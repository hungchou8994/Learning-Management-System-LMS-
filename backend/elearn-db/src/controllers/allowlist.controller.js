const AllowList = require("../models/AllowList");
const User = require("../models/User");
const logger = require("../config/logger");

function normalizeUsername(username) {
  return String(username || "").trim().toLowerCase();
}

function uniq(arr) {
  return Array.from(new Set(arr));
}

async function getAvatarUrlByUsername(username) {
  try {
    if (!username) return null;
    const profile = await User.findOne({ username }).select("avatarUrl").lean();
    return profile?.avatarUrl || null;
  } catch {
    return null;
  }
}

function uniqApprovedUsersByEmail(items) {
  const map = new Map();
  for (const item of items || []) {
    if (!item?.username) continue;
    map.set(item.username, item);
  }
  return Array.from(map.values());
}

function requireOwner(doc, req, res) {
  const me = req.user;
  if (!me?.id) {
    res.status(401).json({ status: "error", message: "Authentication required" });
    return false;
  }
  if (!doc.ownerId || doc.ownerId !== String(me.id)) {
    res.status(403).json({ status: "error", message: "Only room owner can perform this action" });
    return false;
  }
  return true;
}

/**
 * Create or update allowlist for a room.
 * Owner is locked to the first creator.
 * PUT /api/meeting/allowlist/:roomId
 */
exports.upsertAllowList = async (req, res) => {
  try {
    const roomId = String(req.params.roomId || "").trim();
    if (!roomId) {
      return res.status(400).json({ status: "error", message: "roomId is required" });
    }

    const me = req.user;
    if (!me?.id || !me?.username) {
      return res.status(401).json({ status: "error", message: "Authentication required" });
    }

    const incoming = Array.isArray(req.body?.allowedUsernames) ? req.body.allowedUsernames : [];
    const ownerUsername = normalizeUsername(me.username);

    const normalized = incoming.map(normalizeUsername).filter((u) => u);
    if (ownerUsername) normalized.push(ownerUsername);

    const allowedUsernames = uniq(normalized);

    const existing = await AllowList.findOne({ roomId });
    if (existing) {
      if (!requireOwner(existing, req, res)) return;
      existing.allowedUsernames = allowedUsernames;
      existing.ownerUsername = String(me.username || "");

      // Seed owner into approvedUsers if missing (so UI can show owner's avatar).
      if (ownerUsername) {
        const already = existing.approvedUsers?.some((u) => u.username === ownerUsername);
        if (!already) {
          existing.approvedUsers = uniqApprovedUsersByEmail([
            ...(existing.approvedUsers || []),
            {
              userId: String(me.id),
              username: ownerUsername,
              avatarUrl: await getAvatarUrlByUsername(ownerUsername),
              approvedAt: new Date(),
            },
          ]);
        }
      }
      // keep denied/pending as-is
      await existing.save();
      return res.status(200).json({
        status: "success",
        data: { roomId, ownerId: existing.ownerId, allowedUsernames: existing.allowedUsernames },
      });
    }

    const created = await AllowList.create({
      roomId,
      ownerId: String(me.id),
      ownerUsername: ownerUsername,
      allowedUsernames,
      approvedUsers:
        ownerUsername
          ? [
              {
                userId: String(me.id),
                username: ownerUsername,
                avatarUrl: await getAvatarUrlByUsername(ownerUsername),
                approvedAt: new Date(),
              },
            ]
          : [],
    });

    return res.status(201).json({
      status: "success",
      data: { roomId, ownerId: created.ownerId, allowedUsernames: created.allowedUsernames },
    });
  } catch (error) {
    logger.error("upsertAllowList error:", error);
    return res.status(500).json({ status: "error", message: "Failed to upsert allowlist" });
  }
};

/**
 * Get allowlist status for current user.
 * GET /api/meeting/allowlist/:roomId/status
 */
exports.getAllowListStatus = async (req, res) => {
  try {
    const roomId = String(req.params.roomId || "").trim();
    if (!roomId) return res.status(400).json({ status: "error", message: "roomId is required" });

    const me = req.user;
    if (!me?.username) {
      return res.status(401).json({ status: "error", message: "Authentication required" });
    }
    const username = normalizeUsername(me.username);

    const doc = await AllowList.findOne({ roomId });
    if (!doc) {
      return res.status(200).json({
        status: "success",
        data: { roomId, allowed: false, pending: false, denied: false, ownerId: null },
      });
    }

    const allowed = (doc.allowedUsernames || []).includes(username);
    const denied = (doc.deniedUsernames || []).includes(username);
    const pending = (doc.pendingRequests || []).some((r) => normalizeUsername(r.username) === username);

    return res.status(200).json({
      status: "success",
      data: {
        roomId,
        allowed,
        pending,
        denied,
        ownerId: doc.ownerId,
      },
    });
  } catch (error) {
    logger.error("getAllowListStatus error:", error);
    return res.status(500).json({ status: "error", message: "Failed to get allowlist status" });
  }
};

/**
 * Request approval to join a room.
 * POST /api/meeting/allowlist/:roomId/request
 */
exports.requestJoin = async (req, res) => {
  try {
    const roomId = String(req.params.roomId || "").trim();
    if (!roomId) return res.status(400).json({ status: "error", message: "roomId is required" });

    const me = req.user;
    if (!me?.id || !me?.username) {
      return res.status(401).json({ status: "error", message: "Authentication required" });
    }
    const username = normalizeUsername(me.username);

    let doc = await AllowList.findOne({ roomId });
    if (!doc) {
      doc = await AllowList.create({
        roomId,
        ownerId: null,
        ownerUsername: null,
        allowedUsernames: [],
        deniedUsernames: [],
        pendingRequests: [],
      });
    }

    if ((doc.allowedUsernames || []).includes(username)) {
      return res.status(200).json({ status: "success", data: { roomId, allowed: true } });
    }
    if ((doc.deniedUsernames || []).includes(username)) {
      return res.status(403).json({ status: "error", message: "Denied", data: { roomId, denied: true } });
    }

    const alreadyPending = (doc.pendingRequests || []).some((r) => normalizeUsername(r.username) === username);
    if (!alreadyPending) {
      doc.pendingRequests.push({
        userId: String(me.id),
        username,
        avatarUrl: await getAvatarUrlByUsername(username),
        requestedAt: new Date(),
      });
      await doc.save();
    }

    return res.status(200).json({
      status: "success",
      data: { roomId, allowed: false, pending: true, ownerId: doc.ownerId },
    });
  } catch (error) {
    logger.error("requestJoin error:", error);
    return res.status(500).json({ status: "error", message: "Failed to request join" });
  }
};

/**
 * List pending join requests (owner only).
 * GET /api/meeting/allowlist/:roomId/pending
 */
exports.listPending = async (req, res) => {
  try {
    const roomId = String(req.params.roomId || "").trim();
    if (!roomId) return res.status(400).json({ status: "error", message: "roomId is required" });

    const doc = await AllowList.findOne({ roomId });
    if (!doc) return res.status(404).json({ status: "error", message: "AllowList not found" });
    if (!requireOwner(doc, req, res)) return;

    return res.status(200).json({
      status: "success",
      data: { roomId, pendingRequests: doc.pendingRequests, allowedUsernames: doc.allowedUsernames },
    });
  } catch (error) {
    logger.error("listPending error:", error);
    return res.status(500).json({ status: "error", message: "Failed to list pending requests" });
  }
};

/**
 * Approve a pending request (owner only). Approved username is added to allowlist.
 * POST /api/meeting/allowlist/:roomId/approve
 */
exports.approve = async (req, res) => {
  try {
    const roomId = String(req.params.roomId || "").trim();
    const username = normalizeUsername(req.body?.username);
    if (!roomId) return res.status(400).json({ status: "error", message: "roomId is required" });
    if (!username) return res.status(400).json({ status: "error", message: "username is required" });

    const doc = await AllowList.findOne({ roomId });
    if (!doc) return res.status(404).json({ status: "error", message: "AllowList not found" });
    if (!requireOwner(doc, req, res)) return;

    const pendingReq = (doc.pendingRequests || []).find((r) => normalizeUsername(r.username) === username);
    if (pendingReq?.username && pendingReq?.userId) {
      doc.approvedUsers = uniqApprovedUsersByEmail([
        ...(doc.approvedUsers || []),
        {
          userId: pendingReq.userId,
          username: normalizeUsername(pendingReq.username),
          avatarUrl: pendingReq.avatarUrl || null,
          approvedAt: new Date(),
        },
      ]);
    }

    doc.pendingRequests = (doc.pendingRequests || []).filter((r) => normalizeUsername(r.username) !== username);
    doc.deniedUsernames = (doc.deniedUsernames || []).filter((u) => normalizeUsername(u) !== username);
    if (!(doc.allowedUsernames || []).includes(username)) doc.allowedUsernames.push(username);
    doc.allowedUsernames = uniq(doc.allowedUsernames || []);
    await doc.save();

    return res.status(200).json({ status: "success", data: { roomId, allowedUsernames: doc.allowedUsernames } });
  } catch (error) {
    logger.error("approve error:", error);
    return res.status(500).json({ status: "error", message: "Failed to approve request" });
  }
};

/**
 * Deny a pending request (owner only).
 * POST /api/meeting/allowlist/:roomId/deny
 */
exports.deny = async (req, res) => {
  try {
    const roomId = String(req.params.roomId || "").trim();
    const username = normalizeUsername(req.body?.username);
    if (!roomId) return res.status(400).json({ status: "error", message: "roomId is required" });
    if (!username) return res.status(400).json({ status: "error", message: "username is required" });

    const doc = await AllowList.findOne({ roomId });
    if (!doc) return res.status(404).json({ status: "error", message: "AllowList not found" });
    if (!requireOwner(doc, req, res)) return;

    doc.pendingRequests = (doc.pendingRequests || []).filter((r) => normalizeUsername(r.username) !== username);
    if (!(doc.deniedUsernames || []).includes(username)) doc.deniedUsernames.push(username);
    doc.deniedUsernames = uniq(doc.deniedUsernames || []);
    await doc.save();

    return res.status(200).json({ status: "success", data: { roomId, deniedUsernames: doc.deniedUsernames } });
  } catch (error) {
    logger.error("deny error:", error);
    return res.status(500).json({ status: "error", message: "Failed to deny request" });
  }
};

/**
 * Allowlist summary for UI cards (previous meetings).
 * GET /api/meeting/allowlist/:roomId/summary
 *
 * Note: This is authenticated (JWT required), but not owner-only because the meeting list itself is already scoped
 * by Stream membership on the frontend. The payload is a minimal view needed for UI rendering.
 */
exports.getSummary = async (req, res) => {
  try {
    const roomId = String(req.params.roomId || "").trim();
    if (!roomId) return res.status(400).json({ status: "error", message: "roomId is required" });

    const doc = await AllowList.findOne({ roomId }).lean();
    if (!doc) {
      return res.status(200).json({
        status: "success",
        data: {
          roomId,
          ownerId: null,
          ownerUsername: null,
          allowedUsernames: [],
          approvedUsers: [],
        },
      });
    }

    return res.status(200).json({
      status: "success",
      data: {
        roomId,
        ownerId: doc.ownerId || null,
        ownerUsername: doc.ownerUsername || null,
        allowedUsernames: Array.isArray(doc.allowedUsernames) ? doc.allowedUsernames : [],
        approvedUsers: Array.isArray(doc.approvedUsers) ? doc.approvedUsers : [],
      },
    });
  } catch (error) {
    logger.error("getSummary error:", error);
    return res.status(500).json({ status: "error", message: "Failed to get allowlist summary" });
  }
};


