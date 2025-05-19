// backend/routes/monthlySummaryRoutes.js
const express = require("express");
// 关键：设置 mergeParams: true 来获取父路由中的 :courseId 和 :studentId 参数
const router = express.Router({ mergeParams: true });
const monthlySummaryController = require("../controllers/monthlySummaryController");
const { protect } = require("../middleware/authMiddleware");

// 所有这些路由都应该受到保护
router.use(protect);

// GET /api/courses/:courseId/students/:studentId/summaries/:year/:month - 获取特定月度总结 (已保存的)
router.get("/:year/:month", monthlySummaryController.getMonthlySummary);

// POST /api/courses/:courseId/students/:studentId/summaries/generate-content - 请求生成月度总结内容供预览
router.post(
  "/generate-content",
  monthlySummaryController.generateMonthlySummaryContent
);

// PUT /api/courses/:courseId/students/:studentId/summaries/:year/:month - 保存（创建或更新）月度总结
router.put("/:year/:month", monthlySummaryController.saveMonthlySummary);

// GET /api/courses/:courseId/students/:studentId/summaries/history - 获取历史总结
router.get("/history", monthlySummaryController.getMonthlySummaryHistory);

// DELETE /api/courses/:courseId/students/:studentId/summaries/:summaryId - 删除月度总结
router.delete("/:summaryId", monthlySummaryController.deleteMonthlySummary);

module.exports = router;
