// backend/controllers/feedbackController.js
const Feedback = require("../models/Feedback");
const Student = require("../models/Student");
const Course = require("../models/Course");
const mongoose = require("mongoose");
const monthlySummaryController = require("./monthlySummaryController");

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
      teachingContent, // 这些字段如果前端不再主要填写，可以考虑是否还需要强校验或保存
      classPerformance,
      progressMade,
      areasForImprovement,
      improvementPlan, // <--- 后端已接收
      punctuality,
      extrapolationAbility,
      generatedFeedbackText, // 接收前端发送的预览文本
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
      feedbackDate, // 前端会确保这是 ISO 格式或 Date 对象
      classTime,
      lastHomeworkStatus,
      lastHomeworkFeedback,
      lastExtrapolationAssignmentDate, // 前端会确保这是 ISO 格式或 Date 对象
      generatedFeedbackText, // 保存生成的文本
      // 可选：如果结构化字段仍需保存
      teachingContent: teachingContent || "",
      classPerformance: classPerformance || "",
      progressMade: progressMade || "",
      areasForImprovement: areasForImprovement || "",
      improvementPlan: improvementPlan || "", // <--- 保存提升方案
      punctuality: punctuality || "",
      extrapolationAbility: extrapolationAbility || "",
    };

    // 确保日期字段是 Date 对象
    if (feedbackDate) newFeedbackData.feedbackDate = new Date(feedbackDate);
    if (lastExtrapolationAssignmentDate)
      newFeedbackData.lastExtrapolationAssignmentDate = new Date(
        lastExtrapolationAssignmentDate
      );

    const newFeedback = new Feedback(newFeedbackData);

    // 5. 保存反馈到数据库
    const savedFeedback = await newFeedback.save();
    // --- 修改开始: 调用月度总结更新 ---
    if (savedFeedback) {
      // 使用 await确保异步操作完成，但这里我们不直接依赖其返回值来中断流程
      // 错误处理在 createOrUpdateSummaryFromFeedback 内部进行
      monthlySummaryController
        .createOrUpdateSummaryFromFeedback(
          studentId,
          courseId,
          req.user.id, // 确保传递当前用户ID
          savedFeedback // 传递保存后的反馈对象
        )
        .catch((err) => {
          // 可选：在这里记录调用月度总结更新失败的日志，但不影响主反馈提交的成功响应
          console.error(
            `调用月度总结更新失败 (反馈ID: ${savedFeedback._id}):`,
            err
          );
        });
    }
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

// @desc    删除指定的反馈记录
// @route   DELETE /api/courses/:courseId/students/:studentId/feedback/:feedbackId
// @access  Private
exports.deleteFeedback = async (req, res) => {
  try {
    const { courseId, studentId, feedbackId } = req.params;

    // 1. 验证所有ID格式
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "无效的课程ID格式" });
    }
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "无效的学生ID格式" });
    }
    if (!mongoose.Types.ObjectId.isValid(feedbackId)) {
      return res.status(400).json({ message: "无效的反馈ID格式" });
    }

    // 2. 验证课程和学生的所有权及关联性 (与 getFeedbackForStudent 类似)
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

    // 3. 查找要删除的反馈，并确保它属于当前用户、课程和学生
    const feedback = await Feedback.findOne({
      _id: feedbackId,
      student: studentId,
      course: courseId,
      user: req.user.id, // 确保反馈记录也是由当前用户创建的
    });

    if (!feedback) {
      return res
        .status(404)
        .json({ message: "未找到要删除的反馈记录，或无权删除" });
    }

    // 4. 执行删除
    await Feedback.findByIdAndDelete(feedbackId);
    // 或者: await feedback.deleteOne();

    // --- 修改开始: 删除反馈后也尝试更新月度总结 ---
    // 需要获取一个“最新的”反馈来触发总结更新，如果删除后没有反馈了，则总结内容会变空
    // 或者，如果删除的是当月唯一的反馈，理论上月度总结也应该被删除或清空。
    // 这里的逻辑可以简化为：重新计算当月总结。
    // createOrUpdateSummaryFromFeedback 内部会查找当月所有反馈，如果为空，则不操作。
    // 为了确保逻辑执行，我们需要一个有效的 feedbackDate (可以是被删除反馈的日期)
    // 或者更简单：直接调用一个专门的“重新计算/删除空总结”的函数（如果需要）。
    // 为简单起见，我们仍然尝试用一个“触发器”反馈来更新，这个反馈可以是当月剩下的最新反馈，
    // 或者如果删除的是最后一个，那么 createOrUpdateSummaryFromFeedback 内部会处理（不创建/更新）。
    // 理论上，更稳妥的做法是：如果删除了反馈，应该找到当月剩余的最新反馈，用它来重新生成月度总结。
    // 或者，直接删除对应的月度总结（如果月内没有其他反馈了）。
    // 简化处理：我们传递一个包含日期的对象，让 createOrUpdateSummaryFromFeedback 重新评估。
    // 注意：这里的 `feedback.feedbackDate` 是被删除反馈的日期。
    monthlySummaryController
      .createOrUpdateSummaryFromFeedback(
        studentId,
        courseId,
        req.user.id,
        { feedbackDate: feedback.feedbackDate } // 传递一个包含日期的对象来确定月份
      )
      .catch((err) => {
        console.error(
          `删除反馈后调用月度总结更新失败 (反馈ID: ${feedbackId}):`,
          err
        );
      });
    // --- 修改结束 ---

    res
      .status(200)
      .json({ message: "反馈记录删除成功", feedbackId: feedbackId });
    // 也可以返回 204 No Content
    // res.status(204).send();
  } catch (error) {
    console.error("删除反馈错误:", error);
    res.status(500).json({ message: "服务器内部错误，删除反馈失败" });
  }
};
