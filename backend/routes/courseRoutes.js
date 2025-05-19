//backend/routes/courseRoutes.js
const express = require("express");
const router = express.Router();
const courseController = require("../controllers/courseController"); // 引入课程控制器
const { protect } = require("../middleware/authMiddleware"); // 引入 protect 中间件
const studentRoutes = require("./studentRoutes"); // <-- 新增：引入学生路由

// POST /api/courses - 创建新课程
// 这个路由受到 protect 中间件的保护，只有登录用户才能创建课程
router.post("/", protect, courseController.createCourse);

// GET /api/courses - 获取当前登录用户的所有课程  <-- 新增路由
router.get("/", protect, courseController.getCourses);

// GET /api/courses/:id - 获取单个课程详情  <-- 新增路由
router.get("/:id", protect, courseController.getCourseById);

// PUT /api/courses/:id - 更新课程信息  <-- 新增路由
router.put("/:id", protect, courseController.updateCourse);

// DELETE /api/courses/:id - 删除课程  <-- 新增路由
router.delete("/:id", protect, courseController.deleteCourse);

// --- 嵌套学生路由 ---
// 当路径匹配 /api/courses/:courseId/students 时，将请求转交给 studentRoutes 处理
router.use("/:courseId/students", studentRoutes); // <-- 新增

// 我们稍后会在这里添加其他课程相关的路由
// router.get('/', protect, courseController.getCourses);
// router.get('/:id', protect, courseController.getCourseById);
// router.put('/:id', protect, courseController.updateCourse);
// router.delete('/:id', protect, courseController.deleteCourse);

module.exports = router;
