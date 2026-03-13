const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    address: {
      type: String,
    },
    dob: {
      type: Date,
    },
    bio: {
      type: String,
    },
    phoneNumber: {
      type: String,
    },
    avatarUrl: {
      type: String,
    },
    coverUrl: {
      type: String,
    },
    skill: {
      type: String,
    },
    socialShare: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);
