const express = require("express");
// 关键：设置 mergeParams: true 来获取父路由中的 :courseId 和 :studentId 参数
const router = express.Router({ mergeParams: true });
const monthlySummaryController = require("../controllers/monthlySummaryController");
const { protect } = require("../middleware/authMiddleware");

// 所有这些路由都应该受到保护
router.use(protect);

// GET /api/courses/:courseId/students/:studentId/summaries/:year/:month - 获取特定月度总结
router.get("/:year/:month", monthlySummaryController.getMonthlySummary);

// GET /api/courses/:courseId/students/:studentId/summaries/history - 获取历史总结
router.get("/history", monthlySummaryController.getMonthlySummaryHistory);

// PUT /api/courses/:courseId/students/:studentId/summaries/:summaryId - 用户手动更新总结
router.put("/:summaryId", monthlySummaryController.updateUserModifiedSummary);

// 新增：删除月度总结路由
router.delete("/:summaryId", monthlySummaryController.deleteMonthlySummary);

// 新增：(可选) 生成月度总结内容路由
router.post(
  "/generate-content",
  monthlySummaryController.generateMonthlySummaryContent
);

module.exports = router;
