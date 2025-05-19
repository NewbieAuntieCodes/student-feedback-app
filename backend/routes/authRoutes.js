const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController"); // 引入控制器
const { protect } = require("../middleware/authMiddleware"); // <-- 新增：引入 protect 中间件

// POST /api/auth/register
router.post("/register", authController.registerUser);

// POST /api/auth/login  <-- 新增登录路由
router.post("/login", authController.loginUser);

// GET /api/auth/me (一个受保护的路由示例，用于获取当前用户信息)
router.get("/me", protect, (req, res) => {
  // 因为 protect 中间件已经运行，并且把用户信息放到了 req.user
  // 所以这里可以直接访问 req.user
  if (req.user) {
    res.status(200).json({
      message: "成功获取当前用户信息",
      user: req.user,
    });
  } else {
    // 理论上 protect 中间件会处理用户不存在的情况，但作为双重保险
    res.status(404).json({ message: "用户未找到" });
  }
});

module.exports = router; // 导出路由，以便在 server.js 中使用
