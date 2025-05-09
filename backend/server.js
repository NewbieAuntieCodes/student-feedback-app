// 0. 加载 .env 文件中的环境变量
require("dotenv").config();

// 1. 引入依赖
const express = require("express");
const mongoose = require("mongoose");
const authRoutes = require("./routes/authRoutes"); // 引入认证路由
const courseRoutes = require("./routes/courseRoutes"); // <-- 引入课程路由
const cors = require("cors");

// 2. 创建 express 应用实例
const app = express();

// --- 中间件 (Middlewares) ---
// 启用 CORS - 允许所有来源的请求 (开发阶段可以这样，生产环境可能需要更严格的配置)
app.use(cors()); // <-- 新增：使用 cors 中间件
// app.use(cors({
//   origin: 'https://your-frontend-domain.com' // 只允许这个域名的请求
// }));

// 解析 JSON 请求体，这个必须在路由处理之前
app.use(express.json());
// 如果你打算处理 URL 编码的表单数据 (例如传统的 HTML 表单提交), 可以取消下面这行的注释
// app.use(express.urlencoded({ extended: true }));

// --- 数据库连接 ---
const MONGODB_URI = process.env.MONGODB_URI;

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("成功连接到 MongoDB Atlas！");
    // 数据库连接成功后，再启动 Express 服务器
    startServer();
  })
  .catch((err) => {
    console.error("连接 MongoDB 失败:", err.message);
    // 如果连接失败，可以选择退出进程
    // process.exit(1);
  });

// --- 路由 (Routes) ---
// 根路径的简单响应
app.get("/", (req, res) => {
  res.send("你好，学生反馈系统后端服务器已启动！已连接到数据库。");
});

// --- 使用认证路由 ---
// 所有以 /api/auth 开头的请求，都交给 authRoutes 来处理
app.use("/api/auth", authRoutes);
// --- 使用课程路由 ---
app.use("/api/courses", courseRoutes); // <-- 新增：使用课程路由

// --- 启动服务器的函数 ---
const PORT = process.env.PORT || 3000; // 从 .env 读取端口或使用默认值

function startServer() {
  app.listen(PORT, () => {
    console.log(`服务器正在监听 ${PORT} 端口...`);
  });
}
