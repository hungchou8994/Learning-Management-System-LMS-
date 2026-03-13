const mongoose = require("mongoose");

const teacherApplicationSchema = new mongoose.Schema(
  {
    // NOTE: Some teachers existed before the application flow. Center staff can create
    // a draft dossier with partial/empty data, then fill in later.
    fullName: { type: String, trim: true, default: "" },
    dob: { type: Date, default: null },
    address: { type: String, trim: true, default: "" },
    email: { type: String, required: true, trim: true, lowercase: true },
    phoneNumber: { type: String, trim: true, default: "" },

    // Uploaded files (stored as filenames under /uploads)
    idCardFrontFile: { type: String, trim: true, default: null },
    idCardBackFile: { type: String, trim: true, default: null },
    cvFile: { type: String, trim: true, default: null },

    // Optional extra fields (kept for backward compatibility / future use)
    subjects: [{ type: String, trim: true }],
    experienceYears: { type: Number, min: 0, max: 60 },
    message: { type: String, trim: true },
    status: {
      type: String,
      enum: ["draft", "pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    source: {
      type: String,
      enum: ["teacher", "center"],
      default: "teacher",
      index: true,
    },
    reviewedBy: { type: String, trim: true },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

teacherApplicationSchema.index({ email: 1, createdAt: -1 });

module.exports = mongoose.model("TeacherApplication", teacherApplicationSchema);


