// backend/models/Student.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const studentSchema = new Schema({
  name: {
    type: String,
    required: [true, "学生姓名不能为空"],
    trim: true,
  },
  grade: {
    type: String,
    trim: true,
    default: "", // 可以给个默认空字符串
  },
  status: {
    type: String,
    enum: ["ongoing", "completed"], // 只能是这两个值之一
    default: "ongoing", // 默认是进行中
  },
  needsAttention: {
    type: Boolean,
    default: false,
  },
  specialAttention: {
    type: Boolean,
    default: false,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Course", // 关联到 Course 模型
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User", // 关联到 User 模型 (创建该学生的老师)
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// 考虑为同一个课程下的学生姓名和用户（老师）组合创建唯一索引，防止同一老师在同一课程下添加同名学生 (可选)
// studentSchema.index({ name: 1, course: 1, user: 1 }, { unique: true });

const Student = mongoose.model("Student", studentSchema);

module.exports = Student;
