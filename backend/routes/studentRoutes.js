// backend/routes/studentRoutes.js
const express = require("express");
// 关键：设置 mergeParams: true 来获取父路由中的 :courseId 参数
const router = express.Router({ mergeParams: true });
const studentController = require("../controllers/studentController"); // 引入学生控制器
const { protect } = require("../middleware/authMiddleware"); // 引入 protect 中间件
const feedbackRoutes = require("./feedbackRoutes"); // 引入反馈路由
const monthlySummaryRoutes = require("./monthlySummaryRoutes"); // 新增：导入月度总结路由

// 所有这些学生相关的路由都应该受到保护
router.use(protect); // 在这个 router 实例上的所有路由都会先经过 protect 中间件

// POST /api/courses/:courseId/students - 添加学生到课程
router.post("/", studentController.addStudentToCourse);

// GET /api/courses/:courseId/students - 获取指定课程下的所有学生  <-- 新增路由
router.get("/", studentController.getStudentsInCourse);

// GET /api/courses/:courseId/students/:studentId - 获取单个学生详情  <-- 新增路由
router.get("/:studentId", studentController.getStudentDetails);

// PUT /api/courses/:courseId/students/:studentId - 更新学生信息  <-- 新增路由
router.put("/:studentId", studentController.updateStudent);

// DELETE /api/courses/:courseId/students/:studentId - 从课程中删除学生  <-- 新增路由
router.delete("/:studentId", studentController.deleteStudent);

// --- 嵌套反馈路由 ---
// 当路径匹配 /api/courses/:courseId/students/:studentId/feedback 时，
// 将请求转交给 feedbackRoutes 处理
router.use("/:studentId/feedback", feedbackRoutes); // <-- 新增

// --- 新增：嵌套月度总结路由 ---
// 当路径匹配 /api/courses/:courseId/students/:studentId/summaries 时，
// 将请求转交给 monthlySummaryRoutes 处理
router.use("/:studentId/summaries", monthlySummaryRoutes);

// 我们稍后会在这里添加其他学生相关的路由
// router.get('/', studentController.getStudentsInCourse);
// router.get('/:studentId', studentController.getStudentDetails);
// router.put('/:studentId', studentController.updateStudent);
// router.delete('/:studentId', studentController.deleteStudent);

module.exports = router;
