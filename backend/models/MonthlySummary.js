// backend/models/MonthlySummary.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const monthlySummarySchema = new Schema({
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
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  summaryDate: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return /^\d{4}-(0[1-9]|1[0-2])$/.test(v); // YYYY-MM 格式
      },
      message: (props) => `${props.value} 不是有效的年月格式 (YYYY-MM)!`,
    },
  },
  teacherName: {
    type: String,
    required: true,
  },
  subjectName: {
    type: String,
    required: true,
  },
  // 这个字段将用于存储截图 A 编辑后的完整文本
  summaryTextContent: {
    type: String,
    default: "",
    required: [true, "月度总结内容不能为空"], // 确保用户保存的文本内容不为空
  },
  // 以下字段可以保留，用于辅助生成初始的 summaryTextContent，或作为结构化数据备份
  // 如果前端在保存时不再单独发送这些字段，或者它们已完全被 summaryTextContent 动态生成，可以考虑其必要性
  teachingContentCombined: {
    type: String,
    default: "",
  },
  progressMadeCombined: {
    type: String,
    default: "",
  },
  areasForImprovementCombined: {
    type: String,
    default: "",
  },
  improvementPlanCombined: {
    type: String,
    default: "",
  },
  courseProgress: {
    type: String,
    default: "如期",
  },
  followUpContent: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

monthlySummarySchema.index(
  { student: 1, course: 1, user: 1, summaryDate: 1 },
  { unique: true }
);

monthlySummarySchema.pre("save", function (next) {
  if (this.isNew) {
    this.createdAt = Date.now();
  }
  this.updatedAt = Date.now();
  next();
});

monthlySummarySchema.pre("findOneAndUpdate", function (next) {
  this.set({ updatedAt: Date.now() });
  next();
});

const MonthlySummary = mongoose.model("MonthlySummary", monthlySummarySchema);

module.exports = MonthlySummary;
