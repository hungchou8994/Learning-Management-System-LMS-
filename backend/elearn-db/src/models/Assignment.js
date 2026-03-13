const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["multi_choice", "assignment"],
    required: true,
  },
  orderIndex: {
    type: Number,
    required: true,
  },
  options: [
    {
      type: String,
    },
  ],
  // For auto-grading multiple choice questions.
  // IMPORTANT: do NOT expose this field to students in assignment endpoints.
  correctAnswer: {
    type: String,
    default: null,
  },
});

const assignmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    gradingMode: {
      type: String,
      enum: ["manual", "auto", "ai"],
      default: "manual",
    },
    ratio: {
      type: Number,
      required: true,
    },
    duration: {
      type: Number, // Duration in minutes
      required: true,
      min: 1,
    },
    deadline: {
      type: Date,
      required: true,
      validate: {
        validator: function (v) {
          return v > new Date();
        },
        message: "Deadline must be in the future",
      },
    },
    questions: [questionSchema],
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Assignment", assignmentSchema);
