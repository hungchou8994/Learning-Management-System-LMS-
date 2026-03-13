const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      ref: "User",
    },
    course_ids: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Course",
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
cartSchema.index({ username: 1 });

const Cart = mongoose.model("Cart", cartSchema);

module.exports = Cart;
