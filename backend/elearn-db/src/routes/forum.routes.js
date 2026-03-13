const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.middleware");
const forumController = require("../controllers/forum.controller");

// Public endpoints
router.get("/questions", forumController.listQuestions);
router.get("/questions/hot", forumController.getHotQuestions);
router.get("/questions/:id", forumController.getQuestionById);
router.get("/questions/:id/answers", forumController.listAnswers);
router.get("/answers/:id", forumController.getAnswerById);
router.post("/questions/:id/view", forumController.viewQuestion);

router.get("/tags", forumController.listTags);
router.get("/tags/popular", forumController.getTopPopularTags);
router.get("/tags/:id", forumController.getTagById);
router.get("/tags/:id/questions", forumController.listQuestionsByTag);

router.get("/users/:username/summary", forumController.getUserSummary);
router.get("/users/:username/questions", forumController.listUserQuestions);
router.get("/users/:username/answers", forumController.listUserAnswers);
router.get("/users/:username/saved", forumController.listSavedQuestions);

// Protected endpoints
router.use(authMiddleware);
router.get("/me", forumController.getMe);

router.get("/questions/recommended", forumController.getRecommendedQuestions);
router.post("/questions", forumController.createQuestion);
router.patch("/questions/:id", forumController.updateQuestion);
router.delete("/questions/:id", forumController.deleteQuestion);
router.post("/questions/:id/vote", forumController.voteQuestion);
router.post("/questions/:id/save", forumController.toggleSaveQuestion);

router.post("/answers", forumController.createAnswer);
router.patch("/answers/:id", forumController.updateAnswer);
router.delete("/answers/:id", forumController.deleteAnswer);
router.post("/answers/:id/vote", forumController.voteAnswer);

module.exports = router;


