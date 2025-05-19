// backend/controllers/monthlySummaryController.js
const MonthlySummary = require("../models/MonthlySummary");
const Feedback = require("../models/Feedback");
const Student = require("../models/Student");
const Course = require("../models/Course");
const User = require("../models/User");
const mongoose = require("mongoose");
const dayjs = require("dayjs");

// @desc 获取特定学生特定月份的月度总结 (用户已保存的版本)
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
    if (
      !year ||
      !month ||
      !/^\d{4}$/.test(year) ||
      !/^(0[1-9]|1[0-2])$/.test(month)
    ) {
      return res.status(400).json({ message: "无效的年份或月份格式" });
    }

    const summaryDate = `${year}-${month}`;

    const summary = await MonthlySummary.findOne({
      student: studentId,
      course: courseId,
      user: userId,
      summaryDate: summaryDate,
    });

    if (!summary) {
      const student = await Student.findById(studentId).select("name");
      const currentUser = await User.findById(userId).select("username");
      const currentCourse = await Course.findById(courseId).select("name");
      return res.status(200).json({
        message: "该月暂无已保存的月度总结，可尝试生成。",
        summary: null,
        baseInfo: {
          student: studentId,
          course: courseId,
          user: userId,
          summaryDate: summaryDate,
          studentName: student ? student.name : "N/A",
          teacherName: currentUser ? currentUser.username : "N/A",
          subjectName: currentCourse ? currentCourse.name : "N/A",
          summaryTextContent: "", // 为新总结提供空的文本内容
          teachingContentCombined: "",
          progressMadeCombined: "",
          areasForImprovementCombined: "",
          improvementPlanCombined: "",
          courseProgress: "如期",
          followUpContent: "",
        },
      });
    }

    res.status(200).json({ message: "成功获取月度总结", summary });
  } catch (error) {
    console.error("获取月度总结错误:", error);
    res.status(500).json({ message: "服务器内部错误，获取月度总结失败" });
  }
};

// @desc 为指定学生和月份生成月度总结的累积内容（不保存，仅返回组合数据供预览）
// @route POST /api/courses/:courseId/students/:studentId/summaries/generate-content
// @access Private
exports.generateMonthlySummaryContent = async (req, res) => {
  try {
    const { courseId, studentId } = req.params;
    const { year, month } = req.body;
    const userId = req.user.id;

    if (
      !mongoose.Types.ObjectId.isValid(studentId) ||
      !mongoose.Types.ObjectId.isValid(courseId)
    ) {
      return res.status(400).json({ message: "无效的学生或课程ID格式" });
    }
    if (
      !year ||
      !month ||
      !/^\d{4}$/.test(year) ||
      !/^(0[1-9]|1[0-2])$/.test(String(month).padStart(2, "0"))
    ) {
      return res
        .status(400)
        .json({ message: "必须提供有效的年份和月份 (YYYY-MM)" });
    }

    const monthStr = String(month).padStart(2, "0");
    const dateForMonth = dayjs(`${year}-${monthStr}-01`);
    const startOfMonth = dateForMonth.startOf("month").toDate();
    const endOfMonth = dateForMonth.endOf("month").toDate();

    const feedbacksThisMonth = await Feedback.find({
      student: studentId,
      course: courseId,
      user: userId,
      feedbackDate: {
        $gte: startOfMonth,
        $lte: endOfMonth,
      },
    }).sort({ feedbackDate: 1 });

    // 获取学生、课程、教师名称用于生成预览文本
    const student = await Student.findById(studentId).select("name");
    const course = await Course.findById(courseId).select("name");
    const teacher = await User.findById(userId).select("username");

    const studentName = student ? student.name : "该学生";
    const courseName = course ? course.name : "该课程";
    const teacherName = teacher ? teacher.username : "老师";

    let teachingContentCombined = "";
    let progressMadeCombined = "";
    let areasForImprovementCombined = "";
    let improvementPlanCombined = "";
    let summaryTextContent = "";

    summaryTextContent += `月度学习总结 (${year}年${monthStr}月)\n`;
    summaryTextContent += `学生：${studentName}\n`;
    summaryTextContent += `授课老师：${teacherName}\n`;
    summaryTextContent += `授课科目：${courseName}\n\n`;

    if (feedbacksThisMonth && feedbacksThisMonth.length > 0) {
      teachingContentCombined = feedbacksThisMonth
        .map((fb) => fb.teachingContent)
        .filter(Boolean)
        .join("\n");
      progressMadeCombined = feedbacksThisMonth
        .map((fb) => fb.progressMade)
        .filter(Boolean)
        .join("\n");
      areasForImprovementCombined = feedbacksThisMonth
        .map((fb) => fb.areasForImprovement)
        .filter(Boolean)
        .join("\n");
      improvementPlanCombined = feedbacksThisMonth
        .map((fb) => fb.improvementPlan)
        .filter(Boolean)
        .join("\n");

      if (teachingContentCombined)
        summaryTextContent += `[授课内容]\n${teachingContentCombined}\n\n`;
      else summaryTextContent += `[授课内容]\n\n\n`;

      summaryTextContent += `[课程进度]\n如期\n\n`; // 默认值，可由用户编辑

      if (progressMadeCombined)
        summaryTextContent += `[进步之处]\n${progressMadeCombined}\n\n`;
      else summaryTextContent += `[进步之处]\n\n\n`;

      if (areasForImprovementCombined)
        summaryTextContent += `[注意之处]\n${areasForImprovementCombined}\n\n`;
      else summaryTextContent += `[注意之处]\n\n\n`;

      if (improvementPlanCombined)
        summaryTextContent += `[提升方案]\n${improvementPlanCombined}\n\n`;
      else summaryTextContent += `[提升方案]\n\n\n`;

      summaryTextContent += `[后续课程内容]\n无\n`; // 默认值，可由用户编辑
    } else {
      summaryTextContent += `[授课内容]\n该月无具体反馈记录。\n\n`;
      summaryTextContent += `[课程进度]\n如期\n\n`;
      summaryTextContent += `[进步之处]\n该月无具体反馈记录。\n\n`;
      summaryTextContent += `[注意之处]\n该月无具体反馈记录。\n\n`;
      summaryTextContent += `[提升方案]\n该月无具体反馈记录。\n\n`;
      summaryTextContent += `[后续课程内容]\n无\n`;
    }

    const generatedSummary = {
      summaryTextContent: summaryTextContent.trim(),
      teachingContentCombined,
      progressMadeCombined,
      areasForImprovementCombined,
      improvementPlanCombined,
      // courseProgress 和 followUpContent 可以在前端表单中设置默认值或由用户在生成后填写
    };

    res.status(200).json({
      message: "成功生成月度总结预览内容",
      generatedSummary,
    });
  } catch (error) {
    console.error("生成月度总结内容错误:", error);
    res.status(500).json({ message: "服务器内部错误，生成月度总结内容失败" });
  }
};

// @desc 用户保存（创建或更新）月度总结
// @route PUT /api/courses/:courseId/students/:studentId/summaries/:year/:month
exports.saveMonthlySummary = async (req, res) => {
  try {
    const { courseId, studentId, year, month } = req.params;
    const userId = req.user.id;
    const {
      summaryTextContent, // 主要的完整文本内容
      // 以下为辅助字段，如果前端还传来这些值，也一并保存
      teachingContentCombined,
      progressMadeCombined,
      areasForImprovementCombined,
      improvementPlanCombined,
      courseProgress,
      followUpContent,
    } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(studentId) ||
      !mongoose.Types.ObjectId.isValid(courseId)
    ) {
      return res.status(400).json({ message: "无效的学生或课程ID格式" });
    }
    if (
      !year ||
      !month ||
      !/^\d{4}$/.test(year) ||
      !/^(0[1-9]|1[0-2])$/.test(month)
    ) {
      return res.status(400).json({ message: "无效的年份或月份格式" });
    }

    if (
      summaryTextContent === undefined ||
      summaryTextContent === null ||
      String(summaryTextContent).trim() === ""
    ) {
      return res.status(400).json({ message: "月度总结内容不能为空" });
    }

    const summaryDate = `${year}-${month}`;

    const currentUser = await User.findById(userId).select("username");
    const currentCourse = await Course.findById(courseId).select("name");
    const teacherName = currentUser ? currentUser.username : "N/A";
    const subjectName = currentCourse ? currentCourse.name : "N/A";

    const summaryData = {
      student: studentId,
      course: courseId,
      user: userId,
      summaryDate,
      teacherName,
      subjectName,
      summaryTextContent: String(summaryTextContent).trim(),
      teachingContentCombined:
        teachingContentCombined !== undefined ? teachingContentCombined : "",
      progressMadeCombined:
        progressMadeCombined !== undefined ? progressMadeCombined : "",
      areasForImprovementCombined:
        areasForImprovementCombined !== undefined
          ? areasForImprovementCombined
          : "",
      improvementPlanCombined:
        improvementPlanCombined !== undefined ? improvementPlanCombined : "",
      courseProgress: courseProgress || "如期",
      followUpContent: followUpContent || "",
      updatedAt: Date.now(),
    };

    let summary = await MonthlySummary.findOneAndUpdate(
      {
        student: studentId,
        course: courseId,
        user: userId,
        summaryDate: summaryDate,
      },
      { $set: summaryData },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    if (!summary) {
      return res
        .status(500)
        .json({ message: "保存总结失败，未能创建或更新记录。" });
    }

    res.status(200).json({ message: "月度总结保存成功", summary: summary });
  } catch (error) {
    console.error("保存月度总结错误:", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ message: messages.join(", ") });
    }
    res.status(500).json({ message: "服务器内部错误，保存总结失败" });
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
    })
      // 确保返回 summaryTextContent
      .select(
        "summaryDate summaryTextContent teacherName subjectName courseProgress followUpContent createdAt updatedAt _id teachingContentCombined progressMadeCombined areasForImprovementCombined improvementPlanCombined"
      )
      .sort({ summaryDate: -1 });

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

// @desc    删除指定的月度总结
// @route   DELETE /api/courses/:courseId/students/:studentId/summaries/:summaryId
// @access  Private
exports.deleteMonthlySummary = async (req, res) => {
  try {
    const { courseId, studentId, summaryId } = req.params;
    const userId = req.user.id;

    if (
      !mongoose.Types.ObjectId.isValid(courseId) ||
      !mongoose.Types.ObjectId.isValid(studentId) ||
      !mongoose.Types.ObjectId.isValid(summaryId)
    ) {
      return res.status(400).json({ message: "无效的ID格式" });
    }

    const course = await Course.findById(courseId);
    if (!course || course.user.toString() !== userId) {
      return res.status(403).json({ message: "无权操作此课程的月度总结" });
    }

    const summary = await MonthlySummary.findOneAndDelete({
      _id: summaryId,
      student: studentId,
      course: courseId,
      user: userId,
    });

    if (!summary) {
      return res
        .status(404)
        .json({ message: "未找到要删除的月度总结，或无权删除" });
    }

    res.status(200).json({ message: "月度总结删除成功", summaryId: summaryId });
  } catch (error) {
    console.error("删除月度总结错误:", error);
    res.status(500).json({ message: "服务器内部错误，删除月度总结失败" });
  }
};

module.exports = exports;
