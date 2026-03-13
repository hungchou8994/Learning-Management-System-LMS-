const mongoose = require("mongoose");

const pendingRequestSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true }, // auth-service user id from JWT
    username: { type: String, required: true },
    avatarUrl: { type: String, default: null },
    requestedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const approvedUserSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    username: { type: String, required: true },
    avatarUrl: { type: String, default: null },
    approvedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const allowListSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, unique: true, index: true },
    ownerId: { type: String, default: null, index: true }, // auth-service user id
    ownerUsername: { type: String, default: null },
    allowedUsernames: { type: [String], default: [] }, // normalized lowercased
    deniedUsernames: { type: [String], default: [] }, // optional
    pendingRequests: { type: [pendingRequestSchema], default: [] },
    // Users that were explicitly approved (or owner seeded) so UI can render avatars and counts.
    approvedUsers: { type: [approvedUserSchema], default: [] },
  },
  { timestamps: true }
);

allowListSchema.index({ roomId: 1 });
allowListSchema.index({ ownerId: 1, updatedAt: -1 });

module.exports = mongoose.model("AllowList", allowListSchema);


