const express = require("express");
// 关键：设置 mergeParams: true 来获取父路由中的 :courseId 和 :studentId 参数
const router = express.Router({ mergeParams: true });
const feedbackController = require("../controllers/feedbackController"); // 引入反馈控制器
// protect 中间件会在 studentRoutes 中统一应用，这里不需要再次单独引入和使用
// const { protect } = require('../middleware/authMiddleware');

// POST /api/courses/:courseId/students/:studentId/feedback - 添加新反馈
router.post("/", feedbackController.addFeedback);

// GET /api/courses/:courseId/students/:studentId/feedback - 获取学生的所有反馈  <-- 新增路由
router.get("/", feedbackController.getFeedbackForStudent);
// 我们稍后会在这里添加获取学生反馈列表的路由
// router.get('/', feedbackController.getFeedbackForStudent);

// 新增：DELETE /api/courses/:courseId/students/:studentId/feedback/:feedbackId - 删除反馈
router.delete("/:feedbackId", feedbackController.deleteFeedback); // 注意这里是 :feedbackId

module.exports = router;
