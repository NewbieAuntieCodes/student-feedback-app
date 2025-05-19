// backend/models/Feedback.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const feedbackSchema = new Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Student",
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Course",
  },
  user: {
    // 提交反馈的老师
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  feedbackDate: {
    // 截图中的“日期”
    type: Date,
    required: [true, "反馈日期不能为空"],
  },
  classTime: {
    // 截图中的“时间”
    type: String,
    trim: true,
  },
  lastHomeworkStatus: {
    // 截图中的“上次作业/完成情况”
    type: String,
    trim: true,
    default: "",
  },
  lastHomeworkFeedback: {
    // 对应【完成反馈】
    type: String,
    trim: true,
    default: "",
  },
  lastExtrapolationAssignmentDate: {
    type: Date,
    default: null,
  },
  teachingContent: {
    // 截图中的“授课内容” - 这个字段现在可能被下面的 generatedFeedbackText 部分取代，或者作为结构化备份
    type: String,
    // required: [true, "授课内容不能为空"], // 如果 generatedFeedbackText 是主要的，这个可以不是必填
    trim: true,
    default: "",
  },
  classPerformance: {
    // 截图中的“本次课堂表现”
    type: String,
    // required: [true, "本次课堂表现不能为空"], // 同上
    trim: true,
    default: "",
  },
  progressMade: {
    // 截图中的“进步之处”
    type: String,
    trim: true,
    default: "",
  },
  areasForImprovement: {
    // 截图中的“欠缺之处”
    type: String,
    trim: true,
    default: "",
  },
  // --- 新增字段 ---
  improvementPlan: {
    // 提升方案
    type: String,
    trim: true,
    default: "",
  },
  punctuality: {
    // 截图中的“准时度”
    type: String,
    trim: true,
    default: "",
  },
  extrapolationAbility: {
    // 截图中的“举一反三”
    type: String,
    trim: true,
    default: "",
  },
  // 新增字段，用于存储生成或编辑后的完整反馈文本
  generatedFeedbackText: {
    type: String,
    trim: true,
    required: [true, "反馈预览内容不能为空"], // 设为必填，如果这是主要提交内容
  },
  createdAt: {
    // 反馈记录的创建时间
    type: Date,
    default: Date.now,
  },
});

feedbackSchema.index({ student: 1, feedbackDate: -1 });

const Feedback = mongoose.model("Feedback", feedbackSchema);

module.exports = Feedback;
