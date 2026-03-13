const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const upload = require("../middleware/upload.middleware");
const authMiddleware = require("../middleware/auth.middleware");

router.get("/health", (req, res) => {
  res.json({ status: "ok", service: "users" });
});

// Public routes
router.get("/instructor/:instructorId", userController.getInstructorInfo);
// Dev-only route for center-fe /secret to create empty profiles
router.post("/secret/profile", userController.upsertUserProfileBySecret);

// Protected routes
router.use(authMiddleware);
router.get("/", userController.getUserInfo);
router.post("/profiles", userController.getUsersByUsernames); // Get multiple user profiles by usernames
router.get("/search", userController.searchUserProfiles); // Search users by name/username (for messenger-fe)
router.put("/password", userController.updatePassword);
router.put("/social", userController.updateSocialShare);
router.put("/avatar", upload.single("avatar"), userController.updateUserAvatar);
router.put("/cover", upload.single("cover"), userController.updateUserCover);
router.put("/information", userController.updateUserInformation); // Update own information
router.put("/information/:username", userController.updateUserInformationByUsername); // Admin/Manager update user by username
router.delete("/", userController.deleteUser);

// Legacy aliases (used by elearn-fe)
router.post("/register", userController.createUser);
router.get("/user", userController.getUser);

module.exports = router;
