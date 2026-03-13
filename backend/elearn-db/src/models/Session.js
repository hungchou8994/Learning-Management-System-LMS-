const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    orderIndex: {
      type: Number,
      required: true,
    },
    lessons: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lesson",
      },
    ],
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
sessionSchema.index({ courseId: 1 });
sessionSchema.index({ orderIndex: 1 });

const Session = mongoose.model("Session", sessionSchema);

module.exports = Session;
