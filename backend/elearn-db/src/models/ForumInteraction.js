const mongoose = require("mongoose");

const forumInteractionSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, index: true },
    action: { type: String, required: true }, // ask_question | answer | view
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: "ForumQuestion" },
    answerId: { type: mongoose.Schema.Types.ObjectId, ref: "ForumAnswer" },
    tagIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "ForumTag" }],
  },
  { timestamps: true }
);

forumInteractionSchema.index({ username: 1, createdAt: -1 });

module.exports = mongoose.model("ForumInteraction", forumInteractionSchema);


