const mongoose = require("mongoose");

const forumTagSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    // Optional description (DevOverflow clone required it, but in practice it's often empty)
    description: { type: String, default: "" },
    // Denormalized counters for fast sorting
    questionsCount: { type: Number, default: 0, index: true },
    followersCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

forumTagSchema.index({ name: 1 });
forumTagSchema.index({ questionsCount: -1 });

module.exports = mongoose.model("ForumTag", forumTagSchema);


