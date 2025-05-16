const MonthlySummary = require("../models/MonthlySummary");
const Feedback = require("../models/Feedback");
const Student = require("../models/Student");
const Course = require("../models/Course");
const User = require("../models/User"); // 需要User来获取教师名
const mongoose = require("mongoose");
const dayjs = require("dayjs"); // 使用 dayjs 来处理日期和格式化

/**
 * 根据单个反馈信息创建或更新月度总结。
 * 这个函数是核心，会在提交新反馈时被调用。
 * @param {string} studentId - 学生ID
 * @param {string} courseId - 课程ID
 * @param {string} userId - 用户（老师）ID
 * @param {object} latestFeedback - 最新的反馈对象
 */
exports.createOrUpdateSummaryFromFeedback = async (
  studentId,
  courseId,
  userId,
  latestFeedback
) => {
  try {
    if (!latestFeedback || !latestFeedback.feedbackDate) {
      console.error("[MonthlySummaryController] 缺少最新的反馈或反馈日期");
      return; // 或者抛出错误
    }

    const feedbackDate = dayjs(latestFeedback.feedbackDate);
    const summaryMonthYear = feedbackDate.format("YYYY-MM"); // 例如 "2023-10"

    // 1. 获取当月的所有反馈记录
    const startOfMonth = feedbackDate.startOf("month").toDate();
    const endOfMonth = feedbackDate.endOf("month").toDate();

    const feedbacksThisMonth = await Feedback.find({
      student: studentId,
      course: courseId,
      user: userId,
      feedbackDate: {
        $gte: startOfMonth,
        $lte: endOfMonth,
      },
    }).sort({ feedbackDate: 1 }); // 按日期升序排序

    if (!feedbacksThisMonth || feedbacksThisMonth.length === 0) {
      console.log(
        `[MonthlySummaryController] ${summaryMonthYear} 月份没有反馈记录，不创建/更新总结。`
      );
      return;
    }

    // 2. 累加内容
    // 注意：您提到 "所有这个月的每一次课的内容的相加"，这里我们用换行符分隔
    // 如果反馈中的这些字段已经是累加好的，或者您有特定格式，请调整这里的拼接逻辑
    const teachingContents = feedbacksThisMonth
      .map((fb) => fb.teachingContent)
      .filter(Boolean)
      .join("\n\n");
    const progressMades = feedbacksThisMonth
      .map((fb) => fb.progressMade)
      .filter(Boolean)
      .join("\n\n");
    const areasForImprovements = feedbacksThisMonth
      .map((fb) => fb.areasForImprovement)
      .filter(Boolean)
      .join("\n\n");
    const improvementPlans = feedbacksThisMonth
      .map((fb) => fb.improvementPlan)
      .filter(Boolean)
      .join("\n\n");

    // 3. 获取教师和课程名称 (仅在创建新总结时或需要更新时)
    let teacherName = "";
    let subjectName = "";
    const user = await User.findById(userId).select("username");
    if (user) teacherName = user.username;
    const course = await Course.findById(courseId).select("name");
    if (course) subjectName = course.name;

    // 4. 查找或创建月度总结
    let summary = await MonthlySummary.findOne({
      student: studentId,
      course: courseId,
      user: userId,
      summaryDate: summaryMonthYear,
    });

    if (summary) {
      // 更新现有总结
      summary.teachingContentCombined = teachingContents;
      summary.progressMadeCombined = progressMades;
      summary.areasForImprovementCombined = areasForImprovements;
      summary.improvementPlanCombined = improvementPlans;
      summary.teacherName = teacherName; // 确保冗余字段也更新
      summary.subjectName = subjectName; // 确保冗余字段也更新
      summary.lastUpdatedByFeedback = latestFeedback._id;
      // courseProgress 和 followUpContent 用户可以手动修改，这里不自动覆盖
    } else {
      // 创建新总结
      summary = new MonthlySummary({
        student: studentId,
        course: courseId,
        user: userId,
        summaryDate: summaryMonthYear,
        teacherName,
        subjectName,
        teachingContentCombined: teachingContents,
        progressMadeCombined: progressMades,
        areasForImprovementCombined: areasForImprovements,
        improvementPlanCombined: improvementPlans,
        courseProgress: "如期", // 默认值
        followUpContent: "", // 默认值
        lastUpdatedByFeedback: latestFeedback._id,
      });
    }

    await summary.save();
    console.log(
      `[MonthlySummaryController] 已为学生 ${studentId} 在课程 ${courseId} 的 ${summaryMonthYear} 创建/更新月度总结。`
    );
  } catch (error) {
    console.error("[MonthlySummaryController] 创建/更新月度总结时出错:", error);
    // 考虑如何处理这里的错误，例如记录到日志系统
  }
};

// @desc 获取特定学生特定月份的月度总结
// @route GET /api/courses/:courseId/students/:studentId/summaries/:year/:month
// @access Private
exports.getMonthlySummary = async (req, res) => {
  try {
    const { courseId, studentId, year, month } = req.params;
    const userId = req.user.id;

    if (
      !mongoose.Types.ObjectId.isValid(studentId) ||
      !mongoose.Types.ObjectId.isValid(courseId)
    ) {
      return res.status(400).json({ message: "无效的学生或课程ID格式" });
    }

    const summaryDate = `${year}-${month.padStart(2, "0")}`; // 确保月份是两位数，如 "2023-09"

    const summary = await MonthlySummary.findOne({
      student: studentId,
      course: courseId,
      user: userId,
      summaryDate: summaryDate,
    });

    if (!summary) {
      // 如果没有找到，可以返回一个空对象或提示，前端可以据此显示“暂无总结”
      return res.status(200).json({
        message: "该月暂无月度总结",
        summary: null,
        // 提供一些默认值，方便前端展示
        student: studentId,
        course: courseId,
        user: userId,
        summaryDate: summaryDate,
        teacherName: req.user.username, // 从当前登录用户获取
        subjectName:
          (await Course.findById(courseId).select("name"))?.name || "",
        courseProgress: "如期",
        teachingContentCombined: "",
        progressMadeCombined: "",
        areasForImprovementCombined: "",
        improvementPlanCombined: "",
        followUpContent: "",
      });
    }

    res.status(200).json({ message: "成功获取月度总结", summary });
  } catch (error) {
    console.error("获取月度总结错误:", error);
    res.status(500).json({ message: "服务器内部错误，获取月度总结失败" });
  }
};

// @desc 获取特定学生的所有历史月度总结
// @route GET /api/courses/:courseId/students/:studentId/summaries/history
// @access Private
exports.getMonthlySummaryHistory = async (req, res) => {
  try {
    const { courseId, studentId } = req.params;
    const userId = req.user.id;

    if (
      !mongoose.Types.ObjectId.isValid(studentId) ||
      !mongoose.Types.ObjectId.isValid(courseId)
    ) {
      return res.status(400).json({ message: "无效的学生或课程ID格式" });
    }

    const history = await MonthlySummary.find({
      student: studentId,
      course: courseId,
      user: userId,
    }).sort({ summaryDate: -1 }); // 按总结年月降序排序

    res.status(200).json({
      message: "成功获取月度总结历史",
      count: history.length,
      history,
    });
  } catch (error) {
    console.error("获取月度总结历史错误:", error);
    res.status(500).json({ message: "服务器内部错误，获取历史失败" });
  }
};

// @desc 用户手动更新月度总结 (主要针对 courseProgress 和 followUpContent，也可以允许微调累加内容)
// @route PUT /api/courses/:courseId/students/:studentId/summaries/:summaryId
// @access Private
exports.updateUserModifiedSummary = async (req, res) => {
  try {
    const { courseId, studentId, summaryId } = req.params;
    const userId = req.user.id;
    const {
      courseProgress,
      followUpContent,
      // 如果允许用户修改自动累加的内容，也可以在这里接收它们
      teachingContentCombined,
      progressMadeCombined,
      areasForImprovementCombined,
      improvementPlanCombined,
    } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(summaryId) ||
      !mongoose.Types.ObjectId.isValid(studentId) ||
      !mongoose.Types.ObjectId.isValid(courseId)
    ) {
      return res.status(400).json({ message: "无效的ID格式" });
    }

    const summary = await MonthlySummary.findOne({
      _id: summaryId,
      student: studentId,
      course: courseId,
      user: userId,
    });

    if (!summary) {
      return res.status(404).json({ message: "未找到该月度总结或无权修改" });
    }

    // 更新用户可修改的字段
    if (courseProgress !== undefined) summary.courseProgress = courseProgress;
    if (followUpContent !== undefined)
      summary.followUpContent = followUpContent;

    // 如果允许修改累加字段
    if (teachingContentCombined !== undefined)
      summary.teachingContentCombined = teachingContentCombined;
    if (progressMadeCombined !== undefined)
      summary.progressMadeCombined = progressMadeCombined;
    if (areasForImprovementCombined !== undefined)
      summary.areasForImprovementCombined = areasForImprovementCombined;
    if (improvementPlanCombined !== undefined)
      summary.improvementPlanCombined = improvementPlanCombined;

    const updatedSummary = await summary.save();
    res
      .status(200)
      .json({ message: "月度总结更新成功", summary: updatedSummary });
  } catch (error) {
    console.error("用户更新月度总结错误:", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ message: messages.join(", ") });
    }
    res.status(500).json({ message: "服务器内部错误，更新总结失败" });
  }
};
