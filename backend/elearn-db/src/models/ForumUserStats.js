const mongoose = require("mongoose");

const forumUserStatsSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, index: true },
    reputation: { type: Number, default: 0 },
    savedQuestionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "ForumQuestion" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("ForumUserStats", forumUserStatsSchema);


