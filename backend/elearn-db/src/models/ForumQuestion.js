const mongoose = require("mongoose");

const forumQuestionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true }, // HTML string

    tagIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "ForumTag", index: true }],

    // Forum user stats doc (derived from auth-service username)
    author: { type: mongoose.Schema.Types.ObjectId, ref: "ForumUserStats", required: true, index: true },
    authorUsername: { type: String, required: true, index: true },

    views: { type: Number, default: 0, index: true },

    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "ForumUserStats" }],
    downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "ForumUserStats" }],
    upvotesCount: { type: Number, default: 0, index: true },
    downvotesCount: { type: Number, default: 0, index: true },

    // Answer ids for quick counts
    answerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "ForumAnswer" }],
  },
  { timestamps: true }
);

forumQuestionSchema.index({ createdAt: -1 });
forumQuestionSchema.index({ views: -1 });
forumQuestionSchema.index({ authorUsername: 1, createdAt: -1 });
forumQuestionSchema.index({ upvotesCount: -1 });
forumQuestionSchema.index({ title: "text", content: "text" });

module.exports = mongoose.model("ForumQuestion", forumQuestionSchema);


