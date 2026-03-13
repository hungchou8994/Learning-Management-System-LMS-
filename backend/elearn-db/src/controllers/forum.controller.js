const mongoose = require("mongoose");
const ForumTag = require("../models/ForumTag");
const ForumQuestion = require("../models/ForumQuestion");
const ForumAnswer = require("../models/ForumAnswer");
const ForumUserStats = require("../models/ForumUserStats");
const ForumInteraction = require("../models/ForumInteraction");
const UserProfile = require("../models/User");

function normUsername(u) {
  return String(u || "").trim().toLowerCase();
}

function fullNameFromProfile(p) {
  const first = String(p?.firstName || "").trim();
  const last = String(p?.lastName || "").trim();
  const name = [first, last].filter(Boolean).join(" ").trim();
  return name || "";
}

async function profileMapFor(usernames) {
  const list = Array.from(
    new Set((usernames || []).map(normUsername).filter(Boolean))
  );
  if (!list.length) return {};

  const profiles = await UserProfile.find({ username: { $in: list } })
    .select("username firstName lastName avatarUrl")
    .lean();

  const map = {};
  for (const p of profiles) {
    const u = normUsername(p.username);
    map[u] = {
      username: u,
      name: fullNameFromProfile(p) || u,
      avatarUrl: p.avatarUrl || "/assets/images/site-logo.svg",
    };
  }
  return map;
}

async function ensureUserStats(username) {
  const u = normUsername(username);
  if (!u) return null;
  return await ForumUserStats.findOneAndUpdate(
    { username: u },
    { $setOnInsert: { username: u } },
    { new: true, upsert: true }
  );
}

async function forumUserIdFor(username) {
  const doc = await ensureUserStats(username);
  return doc?._id || null;
}

function parsePaging(req, defaults = { page: 1, pageSize: 10 }) {
  const pageRaw = parseInt(String(req.query?.page || defaults.page), 10);
  const pageSizeRaw = parseInt(String(req.query?.pageSize || defaults.pageSize), 10);
  const page = Number.isFinite(pageRaw) ? Math.max(1, pageRaw) : defaults.page;
  const pageSize = Number.isFinite(pageSizeRaw) ? Math.min(50, Math.max(1, pageSizeRaw)) : defaults.pageSize;
  return { page, pageSize, skip: (page - 1) * pageSize };
}

exports.listQuestions = async (req, res) => {
  try {
    const { page, pageSize, skip } = parsePaging(req, { page: 1, pageSize: 10 });
    const filter = String(req.query?.filter || "").trim();
    const q = String(req.query?.searchQuery || req.query?.q || "").trim();

    const query = {};
    if (q) {
      query.$text = { $search: q };
    }

    // filter
    let sort = { createdAt: -1 };
    if (filter === "frequent") sort = { views: -1, createdAt: -1 };
    if (filter === "newest") sort = { createdAt: -1 };
    if (filter === "unanswered") query.answerIds = { $size: 0 };

    const items = await ForumQuestion.find(query)
      .sort(sort)
      .skip(skip)
      .limit(pageSize)
      .lean();

    const total = await ForumQuestion.countDocuments(query);
    const isNext = total > skip + items.length;

    const tagIds = Array.from(new Set(items.flatMap((x) => x.tagIds || []).map(String)));
    const tags = await ForumTag.find({ _id: { $in: tagIds } }).select("_id name").lean();
    const tagMap = new Map(tags.map((t) => [String(t._id), t]));

    const authors = await profileMapFor(items.map((x) => x.authorUsername));

    const out = items.map((x) => {
      const authorU = normUsername(x.authorUsername);
      const profile = authors[authorU] || {
        username: authorU,
        name: authorU,
        avatarUrl: "/assets/images/site-logo.svg",
      };
      return {
      _id: x._id,
      title: x.title,
      content: x.content,
      tags: (x.tagIds || []).map((id) => tagMap.get(String(id))).filter(Boolean),
      author: {
        _id: x.author,
        clerkId: authorU,
        username: authorU,
        name: profile.name,
        picture: profile.avatarUrl,
      },
      upvotes: (x.upvotes || []).map(String),
      downvotes: (x.downvotes || []).map(String),
      views: x.views || 0,
      answers: x.answerIds || [],
      createdAt: x.createdAt,
    };
    });

    return res.status(200).json({ status: "success", data: { questions: out, isNext } });
  } catch (e) {
    return res.status(500).json({ status: "error", message: e.message || "Failed to list questions" });
  }
};

exports.getHotQuestions = async (req, res) => {
  try {
    const items = await ForumQuestion.find({})
      .sort({ views: -1, upvotesCount: -1, createdAt: -1 })
      .limit(5)
      .select("_id title")
      .lean();
    return res.status(200).json({ status: "success", data: items });
  } catch (e) {
    return res.status(500).json({ status: "error", message: e.message || "Failed to get hot questions" });
  }
};

exports.getRecommendedQuestions = async (req, res) => {
  try {
    const me = normUsername(req.user?.username);
    if (!me) return res.status(401).json({ status: "error", message: "Unauthorized" });

    const { page, pageSize, skip } = parsePaging(req, { page: 1, pageSize: 20 });
    const q = String(req.query?.searchQuery || req.query?.q || "").trim();

    // Find recent interactions and infer tag preference
    const interactions = await ForumInteraction.find({ username: me })
      .sort({ createdAt: -1 })
      .limit(200)
      .select("tagIds")
      .lean();

    const tagIds = Array.from(
      new Set(interactions.flatMap((i) => (i.tagIds || []).map(String)))
    ).map((x) => new mongoose.Types.ObjectId(x));

    const query = { authorUsername: { $ne: me } };
    if (tagIds.length) query.tagIds = { $in: tagIds };
    if (q) query.$text = { $search: q };

    const total = await ForumQuestion.countDocuments(query);
    const items = await ForumQuestion.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

    const isNext = total > skip + items.length;

    const tags = await ForumTag.find({ _id: { $in: Array.from(new Set(items.flatMap((x) => x.tagIds || []))) } })
      .select("_id name")
      .lean();
    const tagMap = new Map(tags.map((t) => [String(t._id), t]));

    const authors = await profileMapFor(items.map((x) => x.authorUsername));

    const out = items.map((x) => {
      const authorU = normUsername(x.authorUsername);
      const profile = authors[authorU] || {
        username: authorU,
        name: authorU,
        avatarUrl: "/assets/images/site-logo.svg",
      };
      return {
      _id: x._id,
      title: x.title,
      content: x.content,
      tags: (x.tagIds || []).map((id) => tagMap.get(String(id))).filter(Boolean),
      author: {
        _id: x.author,
        clerkId: authorU,
        username: authorU,
        name: profile.name,
        picture: profile.avatarUrl,
      },
      upvotes: (x.upvotes || []).map(String),
      downvotes: (x.downvotes || []).map(String),
      views: x.views || 0,
      answers: x.answerIds || [],
      createdAt: x.createdAt,
    };
    });

    return res.status(200).json({ status: "success", data: { questions: out, isNext } });
  } catch (e) {
    return res.status(500).json({ status: "error", message: e.message || "Failed to get recommended questions" });
  }
};

exports.createQuestion = async (req, res) => {
  try {
    const me = normUsername(req.user?.username);
    if (!me) return res.status(401).json({ status: "error", message: "Unauthorized" });

    const title = String(req.body?.title || "").trim();
    const content = String(req.body?.content || "").trim();
    const tagsRaw = Array.isArray(req.body?.tags) ? req.body.tags : [];
    const tags = Array.from(
      new Set(tagsRaw.map((t) => String(t || "").trim()).filter(Boolean))
    ).slice(0, 10);

    if (!title || !content) {
      return res.status(400).json({ status: "error", message: "title and content are required" });
    }

    // Upsert tags
    const tagIds = [];
    let newTagsCounter = 0;
    for (const t of tags) {
      const rx = new RegExp(`^${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
      const existed = await ForumTag.exists({ name: { $regex: rx } });
      if (!existed) newTagsCounter++;
      const doc = await ForumTag.findOneAndUpdate(
        { name: { $regex: rx } },
        { $setOnInsert: { name: t, description: "" } },
        { upsert: true, new: true }
      );
      tagIds.push(doc._id);
    }

    const meStats = await ensureUserStats(me);
    const qDoc = await ForumQuestion.create({
      title,
      content,
      tagIds,
      author: meStats._id,
      authorUsername: me,
      views: 0,
      upvotes: [],
      downvotes: [],
      upvotesCount: 0,
      downvotesCount: 0,
      answerIds: [],
    });

    if (tagIds.length) {
      await ForumTag.updateMany({ _id: { $in: tagIds } }, { $inc: { questionsCount: 1 } });
    }

    await ForumUserStats.updateOne(
      { username: me },
      { $inc: { reputation: 5 + newTagsCounter * 3 } }
    );

    await ForumInteraction.create({
      username: me,
      action: "ask_question",
      questionId: qDoc._id,
      tagIds,
    });

    return res.status(201).json({ status: "success", data: { _id: qDoc._id } });
  } catch (e) {
    return res.status(500).json({ status: "error", message: e.message || "Failed to create question" });
  }
};

exports.getQuestionById = async (req, res) => {
  try {
    const id = String(req.params.id || "").trim();
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: "error", message: "Invalid id" });
    }

    const doc = await ForumQuestion.findById(id).lean();
    if (!doc) return res.status(404).json({ status: "error", message: "Not found" });

    const tags = await ForumTag.find({ _id: { $in: doc.tagIds || [] } }).select("_id name description").lean();
    const authorMap = await profileMapFor([doc.authorUsername]);
    const authorU = normUsername(doc.authorUsername);
    const profile = authorMap[authorU] || {
      username: normUsername(doc.authorUsername),
      name: normUsername(doc.authorUsername),
      avatarUrl: "/assets/images/site-logo.svg",
    };
    const author = {
      _id: doc.author,
      clerkId: authorU,
      username: authorU,
      name: profile.name,
      picture: profile.avatarUrl,
    };

    return res.status(200).json({
      status: "success",
      data: {
        _id: doc._id,
        title: doc.title,
        content: doc.content,
        tags,
        author,
        upvotes: (doc.upvotes || []).map(String),
        downvotes: (doc.downvotes || []).map(String),
        views: doc.views || 0,
        answers: doc.answerIds || [],
        createdAt: doc.createdAt,
      },
    });
  } catch (e) {
    return res.status(500).json({ status: "error", message: e.message || "Failed to get question" });
  }
};

exports.updateQuestion = async (req, res) => {
  try {
    const me = normUsername(req.user?.username);
    if (!me) return res.status(401).json({ status: "error", message: "Unauthorized" });

    const id = String(req.params.id || "").trim();
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: "error", message: "Invalid id" });
    }

    const doc = await ForumQuestion.findById(id);
    if (!doc) return res.status(404).json({ status: "error", message: "Not found" });
    if (normUsername(doc.authorUsername) !== me && req.user?.role !== "admin") {
      return res.status(403).json({ status: "error", message: "Forbidden" });
    }

    const title = req.body?.title !== undefined ? String(req.body.title || "").trim() : undefined;
    const content = req.body?.content !== undefined ? String(req.body.content || "").trim() : undefined;
    if (title !== undefined) doc.title = title;
    if (content !== undefined) doc.content = content;

    await doc.save();
    return res.status(200).json({ status: "success", data: { _id: doc._id } });
  } catch (e) {
    return res.status(500).json({ status: "error", message: e.message || "Failed to update question" });
  }
};

exports.deleteQuestion = async (req, res) => {
  try {
    const me = normUsername(req.user?.username);
    if (!me) return res.status(401).json({ status: "error", message: "Unauthorized" });

    const id = String(req.params.id || "").trim();
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: "error", message: "Invalid id" });
    }

    const doc = await ForumQuestion.findById(id);
    if (!doc) return res.status(404).json({ status: "error", message: "Not found" });
    if (normUsername(doc.authorUsername) !== me && req.user?.role !== "admin") {
      return res.status(403).json({ status: "error", message: "Forbidden" });
    }

    await ForumAnswer.deleteMany({ questionId: doc._id });
    await ForumInteraction.deleteMany({ questionId: doc._id });

    if (doc.tagIds?.length) {
      await ForumTag.updateMany({ _id: { $in: doc.tagIds } }, { $inc: { questionsCount: -1 } });
    }

    await ForumQuestion.deleteOne({ _id: doc._id });

    // simple rep penalty
    await ensureUserStats(me);
    await ForumUserStats.updateOne({ username: me }, { $inc: { reputation: -10 } });

    return res.status(200).json({ status: "success", data: { ok: true } });
  } catch (e) {
    return res.status(500).json({ status: "error", message: e.message || "Failed to delete question" });
  }
};

exports.voteQuestion = async (req, res) => {
  try {
    const me = normUsername(req.user?.username);
    if (!me) return res.status(401).json({ status: "error", message: "Unauthorized" });
    const meStats = await ensureUserStats(me);

    const id = String(req.params.id || "").trim();
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: "error", message: "Invalid id" });
    }

    const direction = String(req.body?.direction || "").trim().toLowerCase(); // up|down
    if (direction !== "up" && direction !== "down") {
      return res.status(400).json({ status: "error", message: "direction must be 'up' or 'down'" });
    }

    const qDoc = await ForumQuestion.findById(id);
    if (!qDoc) return res.status(404).json({ status: "error", message: "Not found" });

    const meId = String(meStats._id);
    const up = new Set((qDoc.upvotes || []).map((x) => String(x)));
    const down = new Set((qDoc.downvotes || []).map((x) => String(x)));

    const hadUp = up.has(meId);
    const hadDown = down.has(meId);

    if (direction === "up") {
      if (hadUp) up.delete(meId);
      else {
        up.add(meId);
        if (hadDown) down.delete(meId);
      }
    } else {
      if (hadDown) down.delete(meId);
      else {
        down.add(meId);
        if (hadUp) up.delete(meId);
      }
    }

    qDoc.upvotes = Array.from(up).map((x) => new mongoose.Types.ObjectId(x));
    qDoc.downvotes = Array.from(down).map((x) => new mongoose.Types.ObjectId(x));
    qDoc.upvotesCount = qDoc.upvotes.length;
    qDoc.downvotesCount = qDoc.downvotes.length;
    await qDoc.save();

    // Rep (simple)
    const author = normUsername(qDoc.authorUsername);
    if (author && author !== me) {
      await ensureUserStats(author);
      if (direction === "up") {
        await ForumUserStats.updateOne({ username: me }, { $inc: { reputation: hadUp ? -2 : 2 } });
        await ForumUserStats.updateOne({ username: author }, { $inc: { reputation: hadUp ? -10 : 10 } });
      } else {
        await ForumUserStats.updateOne({ username: me }, { $inc: { reputation: hadDown ? 2 : -2 } });
        await ForumUserStats.updateOne({ username: author }, { $inc: { reputation: hadDown ? -10 : 10 } });
      }
    }

    return res.status(200).json({
      status: "success",
      data: {
        upvotes: qDoc.upvotesCount || 0,
        downvotes: qDoc.downvotesCount || 0,
        hasUpvoted: (qDoc.upvotes || []).map(String).includes(meId),
        hasDownvoted: (qDoc.downvotes || []).map(String).includes(meId),
      },
    });
  } catch (e) {
    return res.status(500).json({ status: "error", message: e.message || "Failed to vote" });
  }
};

exports.viewQuestion = async (req, res) => {
  try {
    const id = String(req.params.id || "").trim();
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: "error", message: "Invalid id" });
    }

    await ForumQuestion.updateOne({ _id: id }, { $inc: { views: 1 } });

    const me = normUsername(req.user?.username);
    if (me) {
      // best-effort interaction record
      const qDoc = await ForumQuestion.findById(id).select("tagIds").lean();
      await ForumInteraction.create({
        username: me,
        action: "view",
        questionId: id,
        tagIds: qDoc?.tagIds || [],
      });
    }

    return res.status(200).json({ status: "success", data: { ok: true } });
  } catch (e) {
    return res.status(500).json({ status: "error", message: e.message || "Failed to view" });
  }
};

exports.toggleSaveQuestion = async (req, res) => {
  try {
    const me = normUsername(req.user?.username);
    if (!me) return res.status(401).json({ status: "error", message: "Unauthorized" });

    const id = String(req.params.id || "").trim();
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: "error", message: "Invalid id" });
    }

    const stats = await ensureUserStats(me);
    const exists = (stats.savedQuestionIds || []).some((x) => String(x) === id);
    if (exists) {
      await ForumUserStats.updateOne({ username: me }, { $pull: { savedQuestionIds: id } });
    } else {
      await ForumUserStats.updateOne({ username: me }, { $addToSet: { savedQuestionIds: id } });
    }

    const updated = await ForumUserStats.findOne({ username: me }).select("savedQuestionIds").lean();
    const hasSaved = (updated?.savedQuestionIds || []).some((x) => String(x) === id);

    return res.status(200).json({ status: "success", data: { hasSaved } });
  } catch (e) {
    return res.status(500).json({ status: "error", message: e.message || "Failed to toggle save" });
  }
};

exports.listAnswers = async (req, res) => {
  try {
    const questionId = String(req.params.id || "").trim();
    if (!mongoose.Types.ObjectId.isValid(questionId)) {
      return res.status(400).json({ status: "error", message: "Invalid id" });
    }
    const { page, pageSize, skip } = parsePaging(req, { page: 1, pageSize: 10 });
    const sortBy = String(req.query?.sortBy || "").trim();

    let sort = { createdAt: -1 };
    if (sortBy === "highestUpvotes") sort = { upvotesCount: -1, createdAt: -1 };
    if (sortBy === "lowestUpvotes") sort = { upvotesCount: 1, createdAt: -1 };
    if (sortBy === "recent") sort = { createdAt: -1 };
    if (sortBy === "old") sort = { createdAt: 1 };

    const items = await ForumAnswer.find({ questionId })
      .sort(sort)
      .skip(skip)
      .limit(pageSize)
      .lean();

    const total = await ForumAnswer.countDocuments({ questionId });
    const isNext = total > skip + items.length;

    const authors = await profileMapFor(items.map((x) => x.authorUsername));

    const out = items.map((x) => ({
      _id: x._id,
      content: x.content,
      author: (() => {
        const authorU = normUsername(x.authorUsername);
        const profile = authors[authorU] || { username: authorU, name: authorU, avatarUrl: "/assets/images/site-logo.svg" };
        return { _id: x.author, clerkId: authorU, username: authorU, name: profile.name, picture: profile.avatarUrl };
      })(),
      upvotes: (x.upvotes || []).map(String),
      downvotes: (x.downvotes || []).map(String),
      createdAt: x.createdAt,
    }));

    return res.status(200).json({ status: "success", data: { answers: out, isNext } });
  } catch (e) {
    return res.status(500).json({ status: "error", message: e.message || "Failed to list answers" });
  }
};

exports.getAnswerById = async (req, res) => {
  try {
    const id = String(req.params.id || "").trim();
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: "error", message: "Invalid id" });
    }

    const doc = await ForumAnswer.findById(id).lean();
    if (!doc) return res.status(404).json({ status: "error", message: "Not found" });

    const q = await ForumQuestion.findById(doc.questionId).select("_id title").lean();
    const authorMap = await profileMapFor([doc.authorUsername]);
    const authorU = normUsername(doc.authorUsername);
    const profile = authorMap[authorU] || { username: authorU, name: authorU, avatarUrl: "/assets/images/site-logo.svg" };

    return res.status(200).json({
      status: "success",
      data: {
        _id: doc._id,
        content: doc.content,
        question: q?._id || doc.questionId,
        author: {
          _id: doc.author,
          clerkId: authorU,
          username: authorU,
          name: profile.name,
          picture: profile.avatarUrl,
        },
        upvotes: (doc.upvotes || []).map(String),
        downvotes: (doc.downvotes || []).map(String),
        createdAt: doc.createdAt,
      },
    });
  } catch (e) {
    return res.status(500).json({ status: "error", message: e.message || "Failed to get answer" });
  }
};

exports.createAnswer = async (req, res) => {
  try {
    const me = normUsername(req.user?.username);
    if (!me) return res.status(401).json({ status: "error", message: "Unauthorized" });
    const meStats = await ensureUserStats(me);

    const questionId = String(req.body?.questionId || "").trim();
    const content = String(req.body?.content || "").trim();
    if (!mongoose.Types.ObjectId.isValid(questionId) || !content) {
      return res.status(400).json({ status: "error", message: "questionId and content are required" });
    }

    const qDoc = await ForumQuestion.findById(questionId);
    if (!qDoc) return res.status(404).json({ status: "error", message: "Question not found" });

    const aDoc = await ForumAnswer.create({
      questionId: qDoc._id,
      author: meStats._id,
      authorUsername: me,
      content,
      upvotes: [],
      downvotes: [],
      upvotesCount: 0,
      downvotesCount: 0,
    });

    qDoc.answerIds.push(aDoc._id);
    await qDoc.save();

    await ForumUserStats.updateOne({ username: me }, { $inc: { reputation: 10 } });

    await ForumInteraction.create({
      username: me,
      action: "answer",
      questionId: qDoc._id,
      answerId: aDoc._id,
      tagIds: qDoc.tagIds || [],
    });

    return res.status(201).json({ status: "success", data: { _id: aDoc._id } });
  } catch (e) {
    return res.status(500).json({ status: "error", message: e.message || "Failed to create answer" });
  }
};

exports.updateAnswer = async (req, res) => {
  try {
    const me = normUsername(req.user?.username);
    if (!me) return res.status(401).json({ status: "error", message: "Unauthorized" });

    const id = String(req.params.id || "").trim();
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: "error", message: "Invalid id" });
    }

    const doc = await ForumAnswer.findById(id);
    if (!doc) return res.status(404).json({ status: "error", message: "Not found" });
    if (normUsername(doc.authorUsername) !== me && req.user?.role !== "admin") {
      return res.status(403).json({ status: "error", message: "Forbidden" });
    }

    const content = String(req.body?.content || "").trim();
    if (!content) return res.status(400).json({ status: "error", message: "content is required" });
    doc.content = content;
    await doc.save();
    return res.status(200).json({ status: "success", data: { _id: doc._id } });
  } catch (e) {
    return res.status(500).json({ status: "error", message: e.message || "Failed to update answer" });
  }
};

exports.deleteAnswer = async (req, res) => {
  try {
    const me = normUsername(req.user?.username);
    if (!me) return res.status(401).json({ status: "error", message: "Unauthorized" });

    const id = String(req.params.id || "").trim();
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: "error", message: "Invalid id" });
    }

    const doc = await ForumAnswer.findById(id);
    if (!doc) return res.status(404).json({ status: "error", message: "Not found" });
    if (normUsername(doc.authorUsername) !== me && req.user?.role !== "admin") {
      return res.status(403).json({ status: "error", message: "Forbidden" });
    }

    await ForumQuestion.updateOne({ _id: doc.questionId }, { $pull: { answerIds: doc._id } });
    await ForumInteraction.deleteMany({ answerId: doc._id });
    await ForumAnswer.deleteOne({ _id: doc._id });

    return res.status(200).json({ status: "success", data: { ok: true } });
  } catch (e) {
    return res.status(500).json({ status: "error", message: e.message || "Failed to delete answer" });
  }
};

exports.voteAnswer = async (req, res) => {
  try {
    const me = normUsername(req.user?.username);
    if (!me) return res.status(401).json({ status: "error", message: "Unauthorized" });
    const meStats = await ensureUserStats(me);

    const id = String(req.params.id || "").trim();
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: "error", message: "Invalid id" });
    }

    const direction = String(req.body?.direction || "").trim().toLowerCase(); // up|down
    if (direction !== "up" && direction !== "down") {
      return res.status(400).json({ status: "error", message: "direction must be 'up' or 'down'" });
    }

    const aDoc = await ForumAnswer.findById(id);
    if (!aDoc) return res.status(404).json({ status: "error", message: "Not found" });

    const meId = String(meStats._id);
    const up = new Set((aDoc.upvotes || []).map((x) => String(x)));
    const down = new Set((aDoc.downvotes || []).map((x) => String(x)));

    const hadUp = up.has(meId);
    const hadDown = down.has(meId);

    if (direction === "up") {
      if (hadUp) up.delete(meId);
      else {
        up.add(meId);
        if (hadDown) down.delete(meId);
      }
    } else {
      if (hadDown) down.delete(meId);
      else {
        down.add(meId);
        if (hadUp) up.delete(meId);
      }
    }

    aDoc.upvotes = Array.from(up).map((x) => new mongoose.Types.ObjectId(x));
    aDoc.downvotes = Array.from(down).map((x) => new mongoose.Types.ObjectId(x));
    aDoc.upvotesCount = aDoc.upvotes.length;
    aDoc.downvotesCount = aDoc.downvotes.length;
    await aDoc.save();

    const author = normUsername(aDoc.authorUsername);
    if (author && author !== me) {
      await ensureUserStats(author);
      if (direction === "up") {
        await ForumUserStats.updateOne({ username: me }, { $inc: { reputation: hadUp ? -2 : 2 } });
        await ForumUserStats.updateOne({ username: author }, { $inc: { reputation: hadUp ? -10 : 10 } });
      } else {
        await ForumUserStats.updateOne({ username: me }, { $inc: { reputation: hadDown ? 2 : -2 } });
        await ForumUserStats.updateOne({ username: author }, { $inc: { reputation: hadDown ? -10 : 10 } });
      }
    }

    return res.status(200).json({
      status: "success",
      data: {
        upvotes: aDoc.upvotesCount || 0,
        downvotes: aDoc.downvotesCount || 0,
        hasUpvoted: (aDoc.upvotes || []).map(String).includes(meId),
        hasDownvoted: (aDoc.downvotes || []).map(String).includes(meId),
      },
    });
  } catch (e) {
    return res.status(500).json({ status: "error", message: e.message || "Failed to vote" });
  }
};

exports.listTags = async (req, res) => {
  try {
    const { page, pageSize, skip } = parsePaging(req, { page: 1, pageSize: 10 });
    const filter = String(req.query?.filter || "").trim();
    const q = String(req.query?.searchQuery || req.query?.q || "").trim();

    const query = {};
    if (q) query.name = { $regex: q, $options: "i" };

    let sort = { questionsCount: -1, name: 1 };
    if (filter === "popular") sort = { questionsCount: -1, name: 1 };
    if (filter === "recent") sort = { createdAt: -1 };
    if (filter === "name") sort = { name: 1 };
    if (filter === "old") sort = { createdAt: 1 };

    const tags = await ForumTag.find(query).sort(sort).skip(skip).limit(pageSize).lean();
    const total = await ForumTag.countDocuments(query);
    const isNext = total > skip + tags.length;

    return res.status(200).json({ status: "success", data: { tags, isNext } });
  } catch (e) {
    return res.status(500).json({ status: "error", message: e.message || "Failed to list tags" });
  }
};

exports.getTagById = async (req, res) => {
  try {
    const id = String(req.params.id || "").trim();
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ status: "error", message: "Invalid id" });
    }
    const tag = await ForumTag.findById(id).lean();
    if (!tag) return res.status(404).json({ status: "error", message: "Not found" });
    return res.status(200).json({ status: "success", data: tag });
  } catch (e) {
    return res.status(500).json({ status: "error", message: e.message || "Failed to get tag" });
  }
};

exports.getTopPopularTags = async (req, res) => {
  try {
    const tags = await ForumTag.find({})
      .sort({ questionsCount: -1, name: 1 })
      .limit(5)
      .select("_id name questionsCount")
      .lean();
    const out = tags.map((t) => ({ _id: t._id, name: t.name, totalQuestions: t.questionsCount || 0 }));
    return res.status(200).json({ status: "success", data: out });
  } catch (e) {
    return res.status(500).json({ status: "error", message: e.message || "Failed to get popular tags" });
  }
};

exports.listQuestionsByTag = async (req, res) => {
  try {
    const tagId = String(req.params.id || "").trim();
    if (!mongoose.Types.ObjectId.isValid(tagId)) {
      return res.status(400).json({ status: "error", message: "Invalid id" });
    }
    const { page, pageSize, skip } = parsePaging(req, { page: 1, pageSize: 10 });
    const q = String(req.query?.searchQuery || req.query?.q || "").trim();

    const tag = await ForumTag.findById(tagId).lean();
    if (!tag) return res.status(404).json({ status: "error", message: "Tag not found" });

    const query = { tagIds: new mongoose.Types.ObjectId(tagId) };
    if (q) query.$text = { $search: q };

    const items = await ForumQuestion.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

    const total = await ForumQuestion.countDocuments(query);
    const isNext = total > skip + items.length;

    const tags = await ForumTag.find({ _id: { $in: Array.from(new Set(items.flatMap((x) => x.tagIds || []))) } })
      .select("_id name")
      .lean();
    const tagMap = new Map(tags.map((t) => [String(t._id), t]));
    const authors = await profileMapFor(items.map((x) => x.authorUsername));

    const out = items.map((x) => {
      const authorU = normUsername(x.authorUsername);
      const profile = authors[authorU] || {
        username: authorU,
        name: authorU,
        avatarUrl: "/assets/images/site-logo.svg",
      };
      return {
        _id: x._id,
        title: x.title,
        content: x.content,
        tags: (x.tagIds || []).map((id) => tagMap.get(String(id))).filter(Boolean),
        author: {
          _id: x.author,
          clerkId: authorU,
          username: authorU,
          name: profile.name,
          picture: profile.avatarUrl,
        },
        upvotes: (x.upvotes || []).map(String),
        downvotes: (x.downvotes || []).map(String),
        views: x.views || 0,
        answers: x.answerIds || [],
        createdAt: x.createdAt,
      };
    });

    return res.status(200).json({ status: "success", data: { tagTitle: tag.name, questions: out, isNext } });
  } catch (e) {
    return res.status(500).json({ status: "error", message: e.message || "Failed to list questions by tag" });
  }
};

exports.getUserSummary = async (req, res) => {
  try {
    const username = normUsername(req.params.username);
    if (!username) return res.status(400).json({ status: "error", message: "username required" });

    const profiles = await profileMapFor([username]);
    const profile = profiles[username] || { username, name: username, avatarUrl: "/assets/images/site-logo.svg" };
    const stats = await ensureUserStats(username);

    const totalQuestions = await ForumQuestion.countDocuments({ authorUsername: username });
    const totalAnswers = await ForumAnswer.countDocuments({ authorUsername: username });

    // totals for badges
    const questionUpvotesAgg = await ForumQuestion.aggregate([
      { $match: { authorUsername: username } },
      { $project: { upvotesCount: { $size: { $ifNull: ["$upvotes", []] } } } },
      { $group: { _id: null, totalUpvotes: { $sum: "$upvotesCount" } } },
    ]);
    const answerUpvotesAgg = await ForumAnswer.aggregate([
      { $match: { authorUsername: username } },
      { $project: { upvotesCount: { $size: { $ifNull: ["$upvotes", []] } } } },
      { $group: { _id: null, totalUpvotes: { $sum: "$upvotesCount" } } },
    ]);
    const viewsAgg = await ForumQuestion.aggregate([
      { $match: { authorUsername: username } },
      { $group: { _id: null, totalViews: { $sum: { $ifNull: ["$views", 0] } } } },
    ]);

    return res.status(200).json({
      status: "success",
      data: {
        user: {
          _id: stats?._id || null,
          clerkId: username,
          username,
          name: profile.name,
          picture: profile.avatarUrl,
        },
        reputation: stats?.reputation || 0,
        totalQuestions,
        totalAnswers,
        totals: {
          questionUpvotes: questionUpvotesAgg?.[0]?.totalUpvotes || 0,
          answerUpvotes: answerUpvotesAgg?.[0]?.totalUpvotes || 0,
          totalViews: viewsAgg?.[0]?.totalViews || 0,
        },
      },
    });
  } catch (e) {
    return res.status(500).json({ status: "error", message: e.message || "Failed to get user summary" });
  }
};

exports.getMe = async (req, res) => {
  try {
    const me = normUsername(req.user?.username);
    if (!me) return res.status(401).json({ status: "error", message: "Unauthorized" });
    const stats = await ensureUserStats(me);
    return res.status(200).json({
      status: "success",
      data: {
        username: me,
        reputation: stats?.reputation || 0,
        savedQuestionIds: (stats?.savedQuestionIds || []).map(String),
      },
    });
  } catch (e) {
    return res.status(500).json({ status: "error", message: e.message || "Failed to get me" });
  }
};

exports.listUserQuestions = async (req, res) => {
  try {
    const username = normUsername(req.params.username);
    if (!username) return res.status(400).json({ status: "error", message: "username required" });
    const { page, pageSize, skip } = parsePaging(req, { page: 1, pageSize: 10 });

    const items = await ForumQuestion.find({ authorUsername: username })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

    const total = await ForumQuestion.countDocuments({ authorUsername: username });
    const isNext = total > skip + items.length;

    const tags = await ForumTag.find({ _id: { $in: Array.from(new Set(items.flatMap((x) => x.tagIds || []))) } })
      .select("_id name")
      .lean();
    const tagMap = new Map(tags.map((t) => [String(t._id), t]));
    const authors = await profileMapFor([username]);
    const profile = authors[username] || { username, name: username, avatarUrl: "/assets/images/site-logo.svg" };
    const stats = await ensureUserStats(username);

    const out = items.map((x) => ({
      _id: x._id,
      title: x.title,
      tags: (x.tagIds || []).map((id) => tagMap.get(String(id))).filter(Boolean),
      author: {
        _id: stats?._id || null,
        clerkId: username,
        username,
        name: profile.name,
        picture: profile.avatarUrl,
      },
      upvotes: (x.upvotes || []).map(String),
      views: x.views || 0,
      answers: x.answerIds || [],
      createdAt: x.createdAt,
    }));

    return res.status(200).json({ status: "success", data: { questions: out, isNext } });
  } catch (e) {
    return res.status(500).json({ status: "error", message: e.message || "Failed to list user questions" });
  }
};

exports.listUserAnswers = async (req, res) => {
  try {
    const username = normUsername(req.params.username);
    if (!username) return res.status(400).json({ status: "error", message: "username required" });
    const { page, pageSize, skip } = parsePaging(req, { page: 1, pageSize: 10 });

    const items = await ForumAnswer.find({ authorUsername: username })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

    const total = await ForumAnswer.countDocuments({ authorUsername: username });
    const isNext = total > skip + items.length;

    const qIds = Array.from(new Set(items.map((a) => String(a.questionId))));
    const qs = await ForumQuestion.find({ _id: { $in: qIds } }).select("_id title").lean();
    const qMap = new Map(qs.map((q) => [String(q._id), q]));

    const authors = await profileMapFor([username]);
    const profile = authors[username] || { username, name: username, avatarUrl: "/assets/images/site-logo.svg" };
    const stats = await ensureUserStats(username);

    const out = items.map((a) => ({
      _id: a._id,
      question: qMap.get(String(a.questionId)) || { _id: a.questionId, title: "Question" },
      author: {
        _id: stats?._id || null,
        clerkId: username,
        username,
        name: profile.name,
        picture: profile.avatarUrl,
      },
      upvotes: (a.upvotes || []).length,
      createdAt: a.createdAt,
    }));

    return res.status(200).json({ status: "success", data: { answers: out, isNext } });
  } catch (e) {
    return res.status(500).json({ status: "error", message: e.message || "Failed to list user answers" });
  }
};

exports.listSavedQuestions = async (req, res) => {
  try {
    const username = normUsername(req.params.username);
    if (!username) return res.status(400).json({ status: "error", message: "username required" });
    const { page, pageSize, skip } = parsePaging(req, { page: 1, pageSize: 10 });
    const q = String(req.query?.searchQuery || req.query?.q || "").trim();
    const filter = String(req.query?.filter || "").trim();

    const stats = await ensureUserStats(username);
    const savedIds = (stats?.savedQuestionIds || []).map(String);
    if (!savedIds.length) return res.status(200).json({ status: "success", data: { questions: [], isNext: false } });

    const query = { _id: { $in: savedIds.map((x) => new mongoose.Types.ObjectId(x)) } };
    if (q) query.$text = { $search: q };

    let sort = { createdAt: -1 };
    if (filter === "frequent") sort = { views: -1, createdAt: -1 };

    const items = await ForumQuestion.find(query).sort(sort).skip(skip).limit(pageSize).lean();
    const total = await ForumQuestion.countDocuments(query);
    const isNext = total > skip + items.length;

    const tags = await ForumTag.find({ _id: { $in: Array.from(new Set(items.flatMap((x) => x.tagIds || []))) } })
      .select("_id name")
      .lean();
    const tagMap = new Map(tags.map((t) => [String(t._id), t]));
    const authors = await profileMapFor(items.map((x) => x.authorUsername));

    const out = items.map((x) => ({
      _id: x._id,
      title: x.title,
      tags: (x.tagIds || []).map((id) => tagMap.get(String(id))).filter(Boolean),
      author: (() => {
        const authorU = normUsername(x.authorUsername);
        const profile = authors[authorU] || { username: authorU, name: authorU, avatarUrl: "/assets/images/site-logo.svg" };
        return { _id: x.author, clerkId: authorU, username: authorU, name: profile.name, picture: profile.avatarUrl };
      })(),
      upvotes: (x.upvotes || []).map(String),
      views: x.views || 0,
      answers: x.answerIds || [],
      createdAt: x.createdAt,
    }));

    return res.status(200).json({ status: "success", data: { questions: out, isNext } });
  } catch (e) {
    return res.status(500).json({ status: "error", message: e.message || "Failed to list saved questions" });
  }
};


