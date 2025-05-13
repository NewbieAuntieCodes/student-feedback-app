//  backend/models/Course.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const courseSchema = new Schema({
  name: {
    type: String,
    required: [true, "课程名称不能为空"], // 课程名称是必填的
    trim: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId, // 存储用户的ID
    required: true,
    ref: "User", // 关联到 User 模型
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ["active", "completed"], // 只允许这两个值
    default: "active", // 默认值为 'active' (正在上课)
    required: true, // 确保每个课程都有状态
  },
});

// 为了确保同一个用户下的课程名称不重复 (可选，但推荐)
// courseSchema.index({ name: 1, user: 1 }, { unique: true });

const Course = mongoose.model("Course", courseSchema);

module.exports = Course;
