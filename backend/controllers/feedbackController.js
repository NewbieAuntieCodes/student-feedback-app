// backend/controllers/feedbackController.js
const Feedback = require("../models/Feedback");
const Student = require("../models/Student");
const Course = require("../models/Course");
const mongoose = require("mongoose");
// 不再需要直接从 feedbackController 调用 monthlySummaryController
// const monthlySummaryController = require("./monthlySummaryController");

exports.addFeedback = async (req, res) => {
  console.log(
    "Received feedback data in req.body:",
    JSON.stringify(req.body, null, 2)
  );
  try {
    const { courseId, studentId } = req.params;
    const {
      feedbackDate,
      classTime,
      lastHomeworkStatus,
      lastHomeworkFeedback,
      lastExtrapolationAssignmentDate,
      teachingContent,
      classPerformance,
      progressMade,
      areasForImprovement,
      improvementPlan,
      punctuality,
      extrapolationAbility,
      generatedFeedbackText,
    } = req.body;

    // 1. 验证 ID 格式
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "无效的课程ID格式" });
    }
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "无效的学生ID格式" });
    }

    // 2. 验证课程是否存在且属于当前登录用户
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "未找到该课程" });
    }
    if (course.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "无权操作该课程" });
    }

    // 3. 验证学生是否存在，是否属于该课程，且是否由当前用户管理
    const student = await Student.findOne({
      _id: studentId,
      course: courseId,
      user: req.user.id,
    });
    if (!student) {
      return res
        .status(404)
        .json({ message: "未找到该学生，或其不属于指定课程/用户" });
    }

    // 4. 创建新反馈实例
    const newFeedbackData = {
      student: studentId,
      course: courseId,
      user: req.user.id,
      feedbackDate,
      classTime,
      lastHomeworkStatus,
      lastHomeworkFeedback,
      lastExtrapolationAssignmentDate,
      generatedFeedbackText,
      teachingContent: teachingContent || "",
      classPerformance: classPerformance || "",
      progressMade: progressMade || "",
      areasForImprovement: areasForImprovement || "",
      improvementPlan: improvementPlan || "",
      punctuality: punctuality || "",
      extrapolationAbility: extrapolationAbility || "",
    };

    if (feedbackDate) newFeedbackData.feedbackDate = new Date(feedbackDate);
    if (lastExtrapolationAssignmentDate)
      newFeedbackData.lastExtrapolationAssignmentDate = new Date(
        lastExtrapolationAssignmentDate
      );

    const newFeedback = new Feedback(newFeedbackData);

    // 5. 保存反馈到数据库
    const savedFeedback = await newFeedback.save();

    // --- 修改: 移除了自动更新月度总结的调用 ---
    // 原代码:
    // if (savedFeedback) {
    //   monthlySummaryController
    //     .createOrUpdateSummaryFromFeedback(...)
    //     .catch(...);
    // }
    // --- 修改结束 ---

    // 6. 返回成功响应
    res.status(201).json({
      message: "反馈添加成功！",
      feedback: savedFeedback,
    });
  } catch (error) {
    console.error("添加反馈错误:", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ message: messages.join(", ") });
    }
    res.status(500).json({ message: "服务器内部错误，添加反馈失败" });
  }
};

exports.getFeedbackForStudent = async (req, res) => {
  try {
    const { courseId, studentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "无效的课程ID格式" });
    }
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "无效的学生ID格式" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "未找到该课程" });
    }
    if (course.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "无权访问该课程的资源" });
    }

    const student = await Student.findOne({
      _id: studentId,
      course: courseId,
      user: req.user.id,
    });
    if (!student) {
      return res
        .status(404)
        .json({ message: "未找到该学生，或其不属于指定课程/用户" });
    }

    const feedbackRecords = await Feedback.find({
      student: studentId,
      course: courseId,
      user: req.user.id,
    }).sort({ feedbackDate: -1, createdAt: -1 });

    res.status(200).json({
      message: "成功获取学生反馈列表",
      count: feedbackRecords.length,
      feedback: feedbackRecords,
    });
  } catch (error) {
    console.error("获取学生反馈错误:", error);
    res.status(500).json({ message: "服务器内部错误，获取学生反馈失败" });
  }
};

exports.deleteFeedback = async (req, res) => {
  try {
    const { courseId, studentId, feedbackId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "无效的课程ID格式" });
    }
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "无效的学生ID格式" });
    }
    if (!mongoose.Types.ObjectId.isValid(feedbackId)) {
      return res.status(400).json({ message: "无效的反馈ID格式" });
    }

    const course = await Course.findById(courseId);
    if (!course || course.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "无权操作此课程的反馈" });
    }

    const student = await Student.findOne({
      _id: studentId,
      course: courseId,
      user: req.user.id,
    });
    if (!student) {
      return res.status(404).json({ message: "未找到关联的学生或无权操作" });
    }

    const feedback = await Feedback.findOne({
      _id: feedbackId,
      student: studentId,
      course: courseId,
      user: req.user.id,
    });

    if (!feedback) {
      return res
        .status(404)
        .json({ message: "未找到要删除的反馈记录，或无权删除" });
    }

    await Feedback.findByIdAndDelete(feedbackId);

    // --- 修改: 移除了自动更新月度总结的调用 ---
    // 原代码:
    // monthlySummaryController
    //   .createOrUpdateSummaryFromFeedback(...)
    //   .catch(...);
    // --- 修改结束 ---

    res
      .status(200)
      .json({ message: "反馈记录删除成功", feedbackId: feedbackId });
  } catch (error) {
    console.error("删除反馈错误:", error);
    res.status(500).json({ message: "服务器内部错误，删除反馈失败" });
  }
};
