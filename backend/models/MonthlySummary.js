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
    // 提交反馈的老师/创建总结的用户
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  summaryDate: {
    // 总结的年月，例如 "2023-10"
    type: String, // 或者可以使用 Date 类型，只存储年月部分
    required: true,
    validate: {
      validator: function (v) {
        return /^\d{4}-(0[1-9]|1[0-2])$/.test(v); // YYYY-MM 格式
      },
      message: (props) => `${props.value} 不是有效的年月格式 (YYYY-MM)!`,
    },
  },
  teacherName: {
    // 授课老师的用户名，冗余存储方便查询
    type: String,
    required: true,
  },
  subjectName: {
    // 授课科目名称，冗余存储方便查询
    type: String,
    required: true,
  },
  teachingContentCombined: {
    // 授课内容 (累加)
    type: String,
    default: "",
  },
  courseProgress: {
    // 课程进度（是否如期）
    type: String,
    default: "如期", // 默认如期
    enum: ["如期", "提前", "延后", "未定"], // 可选值
  },
  progressMadeCombined: {
    // 进步之处 (累加)
    type: String,
    default: "",
  },
  areasForImprovementCombined: {
    // 欠缺之处 (累加)
    type: String,
    default: "",
  },
  improvementPlanCombined: {
    // 提升方案 (累加)
    type: String,
    default: "",
  },
  followUpContent: {
    // 后续课程内容 (用户自行输入)
    type: String,
    default: "",
  },
  lastUpdatedByFeedback: {
    // 最近一次由哪个反馈更新
    type: mongoose.Schema.Types.ObjectId,
    ref: "Feedback",
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

// 确保对于同一个学生、同一课程、同一个用户、同一个总结年月，只有一条月度总结记录
monthlySummarySchema.index(
  { student: 1, course: 1, user: 1, summaryDate: 1 },
  { unique: true }
);

// 更新 updatedAt 字段的中间件
monthlySummarySchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

monthlySummarySchema.pre("findOneAndUpdate", function (next) {
  this.set({ updatedAt: Date.now() });
  next();
});

const MonthlySummary = mongoose.model("MonthlySummary", monthlySummarySchema);

module.exports = MonthlySummary;
