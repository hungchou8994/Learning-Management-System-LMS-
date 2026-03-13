const TeacherApplication = require("../models/TeacherApplication");

function requireManagerOrAdmin(req, res) {
  const role = req.user?.role;
  if (role !== "manager" && role !== "admin" && role !== "recruiter") {
    res.status(403).json({ status: "error", message: "Forbidden" });
    return false;
  }
  return true;
}

function getSingleFileName(files, key) {
  const f = files && files[key] && Array.isArray(files[key]) ? files[key][0] : null;
  return f && typeof f.filename === "string" ? f.filename : null;
}

exports.createTeacherApplication = async (req, res) => {
  try {
    const {
      fullName,
      dob,
      address,
      email,
      phoneNumber,
      subjects,
      experienceYears,
      message,
    } = req.body || {};

    const idCardFrontFile = getSingleFileName(req.files, "idCardFront");
    const idCardBackFile = getSingleFileName(req.files, "idCardBack");
    const cvFile = getSingleFileName(req.files, "cv");

    if (
      !fullName ||
      !dob ||
      !address ||
      !email ||
      !phoneNumber ||
      !idCardFrontFile ||
      !idCardBackFile ||
      !cvFile
    ) {
      return res.status(400).json({
        status: "error",
        message:
          "Thiếu thông tin bắt buộc: fullName, dob, address, email, phoneNumber, idCardFront, idCardBack, cv",
      });
    }

    const dobDate = new Date(dob);
    if (Number.isNaN(dobDate.getTime())) {
      return res.status(400).json({
        status: "error",
        message: "Ngày sinh không hợp lệ",
      });
    }

    const doc = await TeacherApplication.create({
      fullName,
      dob: dobDate,
      address,
      email,
      phoneNumber,
      idCardFrontFile,
      idCardBackFile,
      cvFile,
      subjects: Array.isArray(subjects) ? subjects : undefined,
      experienceYears,
      message,
      status: "pending",
      source: "teacher",
    });

    return res.status(201).json({
      status: "success",
      data: doc,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Không thể tạo đơn ứng tuyển",
      details: error.message,
    });
  }
};

// Protected: create (or reuse) an empty dossier for legacy teachers
// Route: POST /teacher-applications/draft
exports.createDraftTeacherApplication = async (req, res) => {
  try {
    if (!requireManagerOrAdmin(req, res)) return;

    const { email, fullName } = req.body || {};
    const emailStr = String(email || "").trim().toLowerCase();
    if (!emailStr) {
      return res.status(400).json({ status: "error", message: "Thiếu email" });
    }

    const existing = await TeacherApplication.findOne({ email: emailStr })
      .sort({ createdAt: -1 })
      .exec();
    if (existing) {
      return res.json({ status: "success", data: existing });
    }

    const doc = await TeacherApplication.create({
      email: emailStr,
      fullName: typeof fullName === "string" ? fullName.trim() : "",
      // Legacy teachers (created before application flow) should be treated as approved by default.
      status: "approved",
      source: "center",
      reviewedBy: req.user?.username,
      reviewedAt: new Date(),
    });

    return res.status(201).json({ status: "success", data: doc });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Không thể tạo hồ sơ trống",
      details: error.message,
    });
  }
};

exports.getTeacherApplication = async (req, res) => {
  try {
    if (!requireManagerOrAdmin(req, res)) return;

    const { id } = req.params;
    const doc = await TeacherApplication.findById(id);
    if (!doc) {
      return res.status(404).json({ status: "error", message: "Không tìm thấy đơn" });
    }
    return res.json({ status: "success", data: doc });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Không thể tải đơn ứng tuyển",
      details: error.message,
    });
  }
};

// Protected: update dossier details (and optionally upload/replace files)
// Route: PATCH /teacher-applications/:id/details
exports.updateTeacherApplicationDetails = async (req, res) => {
  try {
    if (!requireManagerOrAdmin(req, res)) return;

    const { id } = req.params;
    const {
      fullName,
      dob,
      address,
      email,
      phoneNumber,
      subjects,
      experienceYears,
      message,
    } = req.body || {};

    const patch = {};
    if (typeof fullName === "string") patch.fullName = fullName.trim();
    if (typeof address === "string") patch.address = address.trim();
    if (typeof email === "string" && email.trim())
      patch.email = email.trim().toLowerCase();
    if (typeof phoneNumber === "string") patch.phoneNumber = phoneNumber.trim();
    if (typeof message === "string") patch.message = message.trim();
    if (Array.isArray(subjects))
      patch.subjects = subjects.map((s) => String(s).trim()).filter(Boolean);
    if (typeof experienceYears !== "undefined") patch.experienceYears = experienceYears;
    if (typeof dob === "string" && dob.trim()) {
      const d = new Date(dob);
      if (Number.isNaN(d.getTime())) {
        return res.status(400).json({ status: "error", message: "Ngày sinh không hợp lệ" });
      }
      patch.dob = d;
    }

    const idCardFrontFile = getSingleFileName(req.files, "idCardFront");
    const idCardBackFile = getSingleFileName(req.files, "idCardBack");
    const cvFile = getSingleFileName(req.files, "cv");
    if (idCardFrontFile) patch.idCardFrontFile = idCardFrontFile;
    if (idCardBackFile) patch.idCardBackFile = idCardBackFile;
    if (cvFile) patch.cvFile = cvFile;

    const updated = await TeacherApplication.findByIdAndUpdate(
      id,
      {
        $set: patch,
        $setOnInsert: { source: "center" },
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ status: "error", message: "Không tìm thấy đơn" });
    }

    return res.json({ status: "success", data: updated });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Không thể cập nhật hồ sơ",
      details: error.message,
    });
  }
};

exports.listTeacherApplications = async (req, res) => {
  try {
    if (!requireManagerOrAdmin(req, res)) return;

    const { status } = req.query;
    const q = {};
    if (typeof status === "string" && status.trim()) q.status = status.trim();

    const docs = await TeacherApplication.find(q).sort({ createdAt: -1 }).limit(500);
    return res.json({ status: "success", data: docs });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Không thể tải danh sách đơn ứng tuyển",
      details: error.message,
    });
  }
};

exports.updateTeacherApplication = async (req, res) => {
  try {
    if (!requireManagerOrAdmin(req, res)) return;

    const { id } = req.params;
    const { status } = req.body || {};
    if (!status || !["draft", "pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({
        status: "error",
        message: "Trạng thái không hợp lệ (draft/pending/approved/rejected)",
      });
    }

    const updated = await TeacherApplication.findByIdAndUpdate(
      id,
      {
        status,
        reviewedBy: req.user?.username,
        reviewedAt: new Date(),
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ status: "error", message: "Không tìm thấy đơn" });
    }

    return res.json({ status: "success", data: updated });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Không thể cập nhật đơn ứng tuyển",
      details: error.message,
    });
  }
};

exports.deleteTeacherApplication = async (req, res) => {
  try {
    if (!requireManagerOrAdmin(req, res)) return;

    const { id } = req.params;
    const deleted = await TeacherApplication.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ status: "error", message: "Không tìm thấy đơn" });
    }

    return res.json({ status: "success", data: { id } });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Không thể xóa đơn ứng tuyển",
      details: error.message,
    });
  }
};


