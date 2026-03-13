const Enroll = require("../models/Enroll");
const logger = require("../config/logger");
const mongoose = require("mongoose");

function parseDateParam(v, fallback) {
  if (!v || typeof v !== "string") return fallback;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return fallback;
  return d;
}

function clampInt(v, fallback, min, max) {
  const n = typeof v === "string" ? parseInt(v, 10) : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function getRange(req) {
  const now = new Date();
  const to = parseDateParam(req.query.to, now);
  const fromDefault = new Date(to);
  fromDefault.setDate(fromDefault.getDate() - 30);
  const from = parseDateParam(req.query.from, fromDefault);
  return { from, to };
}

function granularityFormat(granularity) {
  // Mongo $dateToString formats (UTC). Keep MVP simple.
  if (granularity === "month") return "%Y-%m";
  return "%Y-%m-%d"; // day default
}

function segmentFromLastPurchase(lastPurchaseAt) {
  if (!lastPurchaseAt) return "unknown";
  const days = Math.floor((Date.now() - new Date(lastPurchaseAt).getTime()) / (24 * 3600 * 1000));
  if (days <= 14) return "new_or_recent";
  if (days <= 30) return "active";
  if (days <= 60) return "at_risk";
  return "churned";
}

function baseEnrollMatch({ from, to }, extra = {}) {
  return {
    createdAt: { $gte: from, $lte: to },
    ...extra,
  };
}

function asObjectId(v) {
  if (!v || typeof v !== "string") return null;
  if (!mongoose.Types.ObjectId.isValid(v)) return null;
  return new mongoose.Types.ObjectId(v);
}

function revenueExpr() {
  // price = salePrice ?? originalPrice
  return { $ifNull: ["$course.salePrice", "$course.originalPrice"] };
}

function paidCond() {
  return { $eq: ["$status", "paid"] };
}

function notPaidCond() {
  return { $eq: ["$status", "not_paid"] };
}

exports.getRevenueSummary = async (req, res) => {
  try {
    const { from, to } = getRange(req);
    const courseId = asObjectId(req.query.courseId);
    const teacherId = asObjectId(req.query.teacherId);
    const category = typeof req.query.category === "string" ? req.query.category : null;
    const pipeline = [
      { $match: baseEnrollMatch({ from, to }, courseId ? { courseId } : {}) },
      {
        $lookup: {
          from: "courses",
          localField: "courseId",
          foreignField: "_id",
          as: "course",
        },
      },
      { $unwind: { path: "$course", preserveNullAndEmptyArrays: true } },
      ...(teacherId ? [{ $match: { "course.instructorId": teacherId } }] : []),
      ...(category ? [{ $match: { "course.tag": category } }] : []),
      {
        $group: {
          _id: null,
          enrollmentsTotal: { $sum: 1 },
          paidEnrollments: { $sum: { $cond: [paidCond(), 1, 0] } },
          pendingEnrollments: { $sum: { $cond: [notPaidCond(), 1, 0] } },
          paidRevenue: { $sum: { $cond: [paidCond(), revenueExpr(), 0] } },
          pendingAmount: { $sum: { $cond: [notPaidCond(), revenueExpr(), 0] } },
          buyersSet: { $addToSet: { $cond: [paidCond(), "$username", null] } },
        },
      },
      {
        $project: {
          _id: 0,
          enrollmentsTotal: 1,
          paidEnrollments: 1,
          pendingEnrollments: 1,
          paidRevenue: { $ifNull: ["$paidRevenue", 0] },
          pendingAmount: { $ifNull: ["$pendingAmount", 0] },
          uniqueBuyers: {
            $size: {
              $filter: { input: "$buyersSet", as: "u", cond: { $ne: ["$$u", null] } },
            },
          },
        },
      },
    ];

    const [row] = await Enroll.aggregate(pipeline);
    const summary = row || {
      enrollmentsTotal: 0,
      paidEnrollments: 0,
      pendingEnrollments: 0,
      paidRevenue: 0,
      pendingAmount: 0,
      uniqueBuyers: 0,
    };

    const aov = summary.paidEnrollments > 0 ? summary.paidRevenue / summary.paidEnrollments : 0;

    return res.status(200).json({
      status: "success",
      data: {
        range: { from, to },
        kpis: {
          grossRevenue: summary.paidRevenue, // MVP: treat paidRevenue as gross (no commission model)
          netRevenue: summary.paidRevenue,
          ordersPaid: summary.paidEnrollments,
          ordersPending: summary.pendingEnrollments,
          pendingAmount: summary.pendingAmount,
          uniqueBuyers: summary.uniqueBuyers,
          aov,
          refundAmount: 0,
          refundRate: 0,
        },
        assumptions: {
          revenueSource: "enrollments",
          note: "MVP: dùng Enroll(status=paid) × (salePrice || originalPrice) làm revenue; chưa có Order/Refund thật.",
        },
      },
    });
  } catch (error) {
    logger.error("Analytics getRevenueSummary error:", error);
    return res.status(500).json({ status: "error", message: "Failed to compute revenue summary" });
  }
};

exports.getRevenueTrend = async (req, res) => {
  try {
    const { from, to } = getRange(req);
    const granularity = typeof req.query.granularity === "string" ? req.query.granularity : "day";
    const fmt = granularityFormat(granularity);
    const courseId = asObjectId(req.query.courseId);
    const teacherId = asObjectId(req.query.teacherId);
    const category = typeof req.query.category === "string" ? req.query.category : null;
    const includeNewReturning =
      req.query.includeNewReturning === "1" || req.query.includeNewReturning === "true";

    let newBuyerUsernames = null;
    if (includeNewReturning) {
      // Define "new buyer" as: user's first PAID enrollment timestamp is within [from, to]
      // (MVP: based on Enroll only; no real Order model yet.)
      const firstPaidPipeline = [
        { $match: { status: "paid" } },
        { $group: { _id: "$username", firstPaidAt: { $min: "$createdAt" } } },
        { $match: { firstPaidAt: { $gte: from, $lte: to } } },
        { $project: { _id: 0, username: "$_id" } },
      ];
      const rows = await Enroll.aggregate(firstPaidPipeline);
      // Keep it as an array constant for $in. For very large datasets, this should be replaced by a materialized table.
      newBuyerUsernames = rows.map((r) => r.username).filter(Boolean);
    }

    const pipeline = [
      { $match: baseEnrollMatch({ from, to }, courseId ? { courseId } : {}) },
      {
        $lookup: {
          from: "courses",
          localField: "courseId",
          foreignField: "_id",
          as: "course",
        },
      },
      { $unwind: { path: "$course", preserveNullAndEmptyArrays: true } },
      ...(teacherId ? [{ $match: { "course.instructorId": teacherId } }] : []),
      ...(category ? [{ $match: { "course.tag": category } }] : []),
      {
        $addFields: {
          bucket: { $dateToString: { format: fmt, date: "$createdAt" } },
          price: revenueExpr(),
          ...(includeNewReturning && Array.isArray(newBuyerUsernames)
            ? { isNewBuyer: { $in: ["$username", newBuyerUsernames] } }
            : {}),
        },
      },
      {
        $group: {
          _id: "$bucket",
          paidRevenue: { $sum: { $cond: [paidCond(), "$price", 0] } },
          paidEnrollments: { $sum: { $cond: [paidCond(), 1, 0] } },
          pendingEnrollments: { $sum: { $cond: [notPaidCond(), 1, 0] } },
          pendingAmount: { $sum: { $cond: [notPaidCond(), "$price", 0] } },
          buyersSet: { $addToSet: { $cond: [paidCond(), "$username", null] } },
          ...(includeNewReturning
            ? {
                newRevenue: {
                  $sum: {
                    $cond: [
                      { $and: [paidCond(), { $eq: ["$isNewBuyer", true] }] },
                      "$price",
                      0,
                    ],
                  },
                },
                returningRevenue: {
                  $sum: {
                    $cond: [
                      { $and: [paidCond(), { $ne: ["$isNewBuyer", true] }] },
                      "$price",
                      0,
                    ],
                  },
                },
              }
            : {}),
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          bucket: "$_id",
          paidRevenue: 1,
          paidEnrollments: 1,
          pendingEnrollments: 1,
          pendingAmount: 1,
          uniqueBuyers: {
            $size: {
              $filter: { input: "$buyersSet", as: "u", cond: { $ne: ["$$u", null] } },
            },
          },
          ...(includeNewReturning ? { newRevenue: 1, returningRevenue: 1 } : {}),
        },
      },
    ];

    const rows = await Enroll.aggregate(pipeline);
    return res.status(200).json({
      status: "success",
      data: {
        range: { from, to },
        granularity: granularity === "month" ? "month" : "day",
        points: rows,
        assumptions: { revenueSource: "enrollments" },
      },
    });
  } catch (error) {
    logger.error("Analytics getRevenueTrend error:", error);
    return res.status(500).json({ status: "error", message: "Failed to compute revenue trend" });
  }
};

exports.getRevenueByCourse = async (req, res) => {
  try {
    const { from, to } = getRange(req);
    const limit = clampInt(req.query.limit, 20, 1, 100);

    const pipeline = [
      { $match: baseEnrollMatch({ from, to }) },
      {
        $lookup: {
          from: "courses",
          localField: "courseId",
          foreignField: "_id",
          as: "course",
        },
      },
      { $unwind: { path: "$course", preserveNullAndEmptyArrays: true } },
      { $addFields: { price: revenueExpr() } },
      {
        $group: {
          _id: "$courseId",
          courseName: { $first: "$course.name" },
          instructorId: { $first: "$course.instructorId" },
          tag: { $first: "$course.tag" },
          paidRevenue: { $sum: { $cond: [paidCond(), "$price", 0] } },
          paidEnrollments: { $sum: { $cond: [paidCond(), 1, 0] } },
          pendingEnrollments: { $sum: { $cond: [notPaidCond(), 1, 0] } },
        },
      },
      { $sort: { paidRevenue: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          courseId: "$_id",
          courseName: { $ifNull: ["$courseName", "(unknown)"] },
          instructorId: 1,
          category: { $ifNull: ["$tag", "Uncategorized"] },
          paidRevenue: 1,
          paidEnrollments: 1,
          pendingEnrollments: 1,
        },
      },
    ];

    const rows = await Enroll.aggregate(pipeline);
    return res.status(200).json({
      status: "success",
      data: { range: { from, to }, rows },
    });
  } catch (error) {
    logger.error("Analytics getRevenueByCourse error:", error);
    return res.status(500).json({ status: "error", message: "Failed to compute revenue by course" });
  }
};

exports.getRevenueByTeacher = async (req, res) => {
  try {
    const { from, to } = getRange(req);
    const limit = clampInt(req.query.limit, 20, 1, 100);

    const pipeline = [
      { $match: baseEnrollMatch({ from, to }) },
      {
        $lookup: {
          from: "courses",
          localField: "courseId",
          foreignField: "_id",
          as: "course",
        },
      },
      { $unwind: { path: "$course", preserveNullAndEmptyArrays: true } },
      { $addFields: { price: revenueExpr() } },
      {
        $group: {
          _id: "$course.instructorId",
          paidRevenue: { $sum: { $cond: [paidCond(), "$price", 0] } },
          paidEnrollments: { $sum: { $cond: [paidCond(), 1, 0] } },
          pendingEnrollments: { $sum: { $cond: [notPaidCond(), 1, 0] } },
          courseIds: { $addToSet: "$courseId" },
        },
      },
      { $sort: { paidRevenue: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "u",
        },
      },
      { $unwind: { path: "$u", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          teacherId: "$_id",
          username: "$u.username",
          name: {
            $trim: {
              input: {
                $concat: [
                  { $ifNull: ["$u.firstName", ""] },
                  " ",
                  { $ifNull: ["$u.lastName", ""] },
                ],
              },
            },
          },
          paidRevenue: 1,
          paidEnrollments: 1,
          pendingEnrollments: 1,
          coursesCount: { $size: "$courseIds" },
        },
      },
    ];

    const rows = await Enroll.aggregate(pipeline);
    return res.status(200).json({
      status: "success",
      data: { range: { from, to }, rows },
    });
  } catch (error) {
    logger.error("Analytics getRevenueByTeacher error:", error);
    return res.status(500).json({ status: "error", message: "Failed to compute revenue by teacher" });
  }
};

exports.getRevenueByCategory = async (req, res) => {
  try {
    const { from, to } = getRange(req);

    const pipeline = [
      { $match: baseEnrollMatch({ from, to }) },
      {
        $lookup: {
          from: "courses",
          localField: "courseId",
          foreignField: "_id",
          as: "course",
        },
      },
      { $unwind: { path: "$course", preserveNullAndEmptyArrays: true } },
      { $addFields: { price: revenueExpr(), category: { $ifNull: ["$course.tag", "Uncategorized"] } } },
      {
        $group: {
          _id: "$category",
          paidRevenue: { $sum: { $cond: [paidCond(), "$price", 0] } },
          paidEnrollments: { $sum: { $cond: [paidCond(), 1, 0] } },
          pendingEnrollments: { $sum: { $cond: [notPaidCond(), 1, 0] } },
        },
      },
      { $sort: { paidRevenue: -1 } },
      {
        $project: {
          _id: 0,
          category: "$_id",
          paidRevenue: 1,
          paidEnrollments: 1,
          pendingEnrollments: 1,
        },
      },
    ];

    const rows = await Enroll.aggregate(pipeline);
    return res.status(200).json({
      status: "success",
      data: { range: { from, to }, rows },
    });
  } catch (error) {
    logger.error("Analytics getRevenueByCategory error:", error);
    return res.status(500).json({ status: "error", message: "Failed to compute revenue by category" });
  }
};

exports.listStudents = async (req, res) => {
  try {
    const { from, to } = getRange(req);
    const q = typeof req.query.q === "string" ? req.query.q.trim().toLowerCase() : "";
    const segment = typeof req.query.segment === "string" ? req.query.segment : "";
    const limit = clampInt(req.query.limit, 200, 1, 1000);

    const pipeline = [
      { $match: baseEnrollMatch({ from, to }) },
      {
        $lookup: {
          from: "courses",
          localField: "courseId",
          foreignField: "_id",
          as: "course",
        },
      },
      { $unwind: { path: "$course", preserveNullAndEmptyArrays: true } },
      { $addFields: { price: revenueExpr() } },
      {
        $group: {
          _id: "$username",
          paidRevenue: { $sum: { $cond: [paidCond(), "$price", 0] } },
          paidEnrollments: { $sum: { $cond: [paidCond(), 1, 0] } },
          firstPaidAt: { $min: { $cond: [paidCond(), "$createdAt", null] } },
          lastPaidAt: { $max: { $cond: [paidCond(), "$createdAt", null] } },
          pendingEnrollments: { $sum: { $cond: [notPaidCond(), 1, 0] } },
        },
      },
      { $sort: { paidRevenue: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          username: "$_id",
          paidRevenue: 1,
          paidEnrollments: 1,
          pendingEnrollments: 1,
          firstPaidAt: 1,
          lastPaidAt: 1,
        },
      },
    ];

    let rows = await Enroll.aggregate(pipeline);
    rows = rows.map((r) => {
      const aov = r.paidEnrollments > 0 ? r.paidRevenue / r.paidEnrollments : 0;
      const seg = segmentFromLastPurchase(r.lastPaidAt);
      return { ...r, aov, segment: seg };
    });

    if (q) {
      rows = rows.filter((r) => String(r.username || "").toLowerCase().includes(q));
    }
    if (segment) {
      rows = rows.filter((r) => r.segment === segment);
    }

    return res.status(200).json({
      status: "success",
      data: { range: { from, to }, rows },
    });
  } catch (error) {
    logger.error("Analytics listStudents error:", error);
    return res.status(500).json({ status: "error", message: "Failed to list students" });
  }
};

exports.getStudentDetail = async (req, res) => {
  try {
    const username = req.params.username;
    if (!username) {
      return res.status(400).json({ status: "error", message: "Missing username" });
    }
    const { from, to } = getRange(req);
    const limit = clampInt(req.query.limit, 50, 1, 200);

    const pipeline = [
      { $match: baseEnrollMatch({ from, to }, { username }) },
      {
        $lookup: {
          from: "courses",
          localField: "courseId",
          foreignField: "_id",
          as: "course",
        },
      },
      { $unwind: { path: "$course", preserveNullAndEmptyArrays: true } },
      { $addFields: { price: revenueExpr() } },
      { $sort: { createdAt: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          enrollmentId: "$_id",
          createdAt: 1,
          status: 1,
          paymentMethod: 1,
          progress: 1,
          courseId: 1,
          courseName: { $ifNull: ["$course.name", "(unknown)"] },
          category: { $ifNull: ["$course.tag", "Uncategorized"] },
          price: 1,
          instructorId: "$course.instructorId",
        },
      },
    ];

    const enrollments = await Enroll.aggregate(pipeline);
    const paidRevenue = enrollments.reduce((s, e) => (e.status === "paid" ? s + (e.price || 0) : s), 0);
    const paidEnrollments = enrollments.reduce((s, e) => (e.status === "paid" ? s + 1 : s), 0);
    const pendingEnrollments = enrollments.reduce((s, e) => (e.status === "not_paid" ? s + 1 : s), 0);
    const firstPaidAt = [...enrollments]
      .filter((e) => e.status === "paid")
      .map((e) => new Date(e.createdAt))
      .sort((a, b) => a.getTime() - b.getTime())[0];
    const lastPaidAt = [...enrollments]
      .filter((e) => e.status === "paid")
      .map((e) => new Date(e.createdAt))
      .sort((a, b) => b.getTime() - a.getTime())[0];

    const aov = paidEnrollments > 0 ? paidRevenue / paidEnrollments : 0;
    const seg = segmentFromLastPurchase(lastPaidAt);

    return res.status(200).json({
      status: "success",
      data: {
        range: { from, to },
        student: {
          username,
          segment: seg,
          paidRevenue,
          paidEnrollments,
          pendingEnrollments,
          aov,
          firstPaidAt: firstPaidAt || null,
          lastPaidAt: lastPaidAt || null,
        },
        enrollments,
        assumptions: { revenueSource: "enrollments" },
      },
    });
  } catch (error) {
    logger.error("Analytics getStudentDetail error:", error);
    return res.status(500).json({ status: "error", message: "Failed to get student detail" });
  }
};


