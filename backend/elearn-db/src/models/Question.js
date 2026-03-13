const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["multi_choice", "assignment"],
      required: true,
    },
    order_index: {
      type: Number,
      required: true,
    },
    option1: {
      type: String,
      default: null,
    },
    option2: {
      type: String,
      default: null,
    },
    option3: {
      type: String,
      default: null,
    },
    option4: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
questionSchema.index({ order_index: 1 });

const Question = mongoose.model("Question", questionSchema);

module.exports = Question;
