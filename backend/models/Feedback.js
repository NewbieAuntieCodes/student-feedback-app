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
    default: Date.now,
  },
  classTime: {
    // 截图中的“时间”
    type: String,
    trim: true,
  },
  // interviewOral 字段已移除
  lastHomeworkStatus: {
    // 截图中的“上次作业/完成情况”
    type: String,
    trim: true,
    default: "",
  },
  teachingContent: {
    // 截图中的“授课内容” - 现在是主要内容字段
    type: String,
    required: [true, "授课内容不能为空"],
    trim: true,
  },
  classPerformance: {
    // 截图中的“本次课堂表现”
    type: String,
    required: [true, "本次课堂表现不能为空"],
    trim: true,
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
  createdAt: {
    // 反馈记录的创建时间
    type: Date,
    default: Date.now,
  },
});

feedbackSchema.index({ student: 1, feedbackDate: -1 });

const Feedback = mongoose.model("Feedback", feedbackSchema);

module.exports = Feedback;
