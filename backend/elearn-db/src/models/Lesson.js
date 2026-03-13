const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["video", "document", "online"],
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    order_index: {
      type: Number,
      required: true,
    },
    video_url: {
      type: String,
      default: null,
    },
    subtitle: {
      type: String,
      default: null,
    },
    description: {
      type: String,
      required: true,
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
    },
    locked: {
      type: Boolean,
      default: true, // Most lessons are locked by default
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
lessonSchema.index({ order_index: 1 });
lessonSchema.index({ sessionId: 1 });

const Lesson = mongoose.model("Lesson", lessonSchema);

module.exports = Lesson;
