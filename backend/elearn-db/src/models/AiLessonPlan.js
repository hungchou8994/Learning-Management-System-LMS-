const mongoose = require("mongoose");

/**
 * AI-generated lesson plan draft structure.
 * Stored as JSON (Mixed) so we can evolve schema without breaking stored documents,
 * while still indexing key metadata for searching/listing.
 */
const aiLessonPlanSchema = new mongoose.Schema(
  {
    createdBy: {
      // auth-service user UUID (from JWT)
      type: String,
      required: true,
      index: true,
    },
    createdByUsername: {
      type: String,
      required: true,
      index: true,
    },
    createdByRole: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["draft", "archived"],
      default: "draft",
      required: true,
      index: true,
    },
    // Optional linkage (teacher may later create course/session/lesson manually)
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      default: null,
      index: true,
    },
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      default: null,
      index: true,
    },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      default: null,
      index: true,
    },
    // Key fields duplicated for listing/search
    subject: { type: String, required: true, index: true },
    grade: { type: Number, required: true, index: true },
    textbook: { type: String, required: true, index: true },
    lessonTopic: { type: String, required: true },
    durationMinutes: { type: Number, required: true },
    legalBasis: {
      type: [String],
      default: [],
    },
    // The deterministic prompt used (for audit/repro)
    prompt: { type: String, required: false },
    model: { type: String, required: false },
    // Raw structured lesson plan that UI renders/edits
    structure: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    // Original form inputs used to build prompt (optional but useful for regenerations)
    input: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    schemaVersion: {
      type: String,
      default: "lesson-structure.v1",
      required: true,
    },
  },
  { timestamps: true }
);

aiLessonPlanSchema.index({ createdBy: 1, createdAt: -1 });
aiLessonPlanSchema.index({ subject: 1, grade: 1, textbook: 1 });

module.exports = mongoose.model("AiLessonPlan", aiLessonPlanSchema);


