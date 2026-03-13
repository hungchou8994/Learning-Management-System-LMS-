const mongoose = require("mongoose");

const attemptSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
    },
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
    },
    grade: {
      type: Number,
    },
    feedback: {
      type: String,
      default: null,
    },
    gradedAt: {
      type: Date,
      default: null,
    },
    gradingMode: {
      type: String,
      enum: ["manual", "auto", "ai"],
      default: null,
    },
    autoSummary: {
      correct: { type: Number, default: null },
      total: { type: Number, default: null },
    },
    instructorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    answers: [
      {
        type: mongoose.Schema.Types.Mixed,
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Attempt", attemptSchema);
