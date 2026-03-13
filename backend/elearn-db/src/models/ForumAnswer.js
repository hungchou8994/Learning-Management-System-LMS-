const mongoose = require("mongoose");

const forumAnswerSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: "ForumQuestion", required: true, index: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "ForumUserStats", required: true, index: true },
    authorUsername: { type: String, required: true, index: true },
    content: { type: String, required: true }, // HTML string

    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "ForumUserStats" }],
    downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "ForumUserStats" }],
    upvotesCount: { type: Number, default: 0, index: true },
    downvotesCount: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);

forumAnswerSchema.index({ questionId: 1, createdAt: -1 });
forumAnswerSchema.index({ authorUsername: 1, createdAt: -1 });
forumAnswerSchema.index({ upvotesCount: -1 });

module.exports = mongoose.model("ForumAnswer", forumAnswerSchema);


