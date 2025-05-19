// migrateCourseStatus.js (放在你的后端项目根目录或 scripts 目录)
const mongoose = require("mongoose");
const Course = require("../models/Course"); // 确保这个路径能正确找到你的 Course 模型
const dotenv = require("dotenv"); // 如果你使用 .env 文件管理环境变量

// 加载环境变量 (比如 MONGODB_URI)
dotenv.config(); // 如果你的 .env 文件不在根目录，可能需要指定路径: dotenv.config({ path: '../.env' })

// 从环境变量获取数据库连接字符串
// !! 确保你的 .env 文件中有 MONGODB_URI 的正确配置 !!
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error(
    "错误：未在 .env 文件中找到 MONGODB_URI。请确保已正确配置数据库连接字符串。"
  );
  process.exit(1); // 退出脚本
}

async function runCourseStatusMigration() {
  console.log("开始课程状态数据迁移...");
  try {
    // 连接到 MongoDB
    // Mongoose v6+ 默认 useNewUrlParser, useUnifiedTopology, useCreateIndex, useFindAndModify 为 true/false
    // 所以通常不需要显式设置这些旧选项
    await mongoose.connect(MONGODB_URI);
    console.log("成功连接到 MongoDB...");

    // 执行更新操作
    const result = await Course.updateMany(
      { status: { $exists: false } }, // 条件：找到所有 status 字段不存在的课程
      { $set: { status: "active" } } // 操作：将它们的 status 字段设置为 'active'
    );

    console.log(`数据迁移完成!`);
    console.log(`  - 匹配到的文档数量: ${result.matchedCount}`);
    console.log(`  - 实际修改的文档数量: ${result.modifiedCount}`);

    if (result.matchedCount === 0) {
      console.log("看起来所有课程都已经有 status 字段，或者课程集合为空。");
    }
  } catch (error) {
    console.error("数据迁移过程中发生错误:", error);
  } finally {
    // 关闭数据库连接
    await mongoose.disconnect();
    console.log("与 MongoDB 的连接已断开。");
  }
}

// 执行迁移函数
runCourseStatusMigration();
