const mongoose = require("mongoose");

const enrollSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["paid", "not_paid"],
      default: "not_paid",
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "bank"],
    },
    progress: {
      type: Number,
      default: 0,
    },
    username: {
      type: String,
      required: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Analytics indexes (center backoffice)
enrollSchema.index({ username: 1, createdAt: -1 });
enrollSchema.index({ courseId: 1, createdAt: -1 });
enrollSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Enroll", enrollSchema);
