const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/auth.middleware");
const allowListController = require("../controllers/allowlist.controller");

// Protected: meeting pages require login
router.use(authMiddleware);

// Owner creates/updates allowlist for a room
router.put("/:roomId", allowListController.upsertAllowList);

// Anyone can check their status (still requires auth)
router.get("/:roomId/status", allowListController.getAllowListStatus);

// Request to join (creates pending request if not allowed)
router.post("/:roomId/request", allowListController.requestJoin);

// Owner: list pending requests
router.get("/:roomId/pending", allowListController.listPending);

// UI: summary for meeting cards
router.get("/:roomId/summary", allowListController.getSummary);

// Owner: approve/deny
router.post("/:roomId/approve", allowListController.approve);
router.post("/:roomId/deny", allowListController.deny);

module.exports = router;


