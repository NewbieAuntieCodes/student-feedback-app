const Feedback = require("../models/Feedback"); // 引入 Feedback 模型
const Student = require("../models/Student"); // 引入 Student 模型
const Course = require("../models/Course"); // 引入 Course 模型
const mongoose = require("mongoose"); // 引入 mongoose

// @desc    为指定学生添加新的反馈
// @route   POST /api/courses/:courseId/students/:studentId/feedback
// @access  Private (需要用户登录)
exports.addFeedback = async (req, res) => {
  try {
    const { courseId, studentId } = req.params;
    const {
      feedbackDate,
      classTime,
      lastHomeworkStatus, // 这是【完成情况】
      lastHomeworkFeedback, // <-- 新增：获取【完成反馈】
      lastExtrapolationAssignmentDate, // <-- 新增：获取上次举一反三布置时间
      teachingContent,
      classPerformance,
      progressMade,
      areasForImprovement,
      punctuality,
      extrapolationAbility,
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
    const newFeedback = new Feedback({
      student: studentId,
      course: courseId,
      user: req.user.id, // 提交反馈的老师
      feedbackDate,
      classTime,
      lastHomeworkStatus, // 对应【完成情况】
      lastHomeworkFeedback, // <-- 新增
      lastExtrapolationAssignmentDate, // <-- 新增
      teachingContent,
      classPerformance,
      progressMade,
      areasForImprovement,
      punctuality,
      extrapolationAbility,
    });

    // 5. 保存反馈到数据库
    const savedFeedback = await newFeedback.save();

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

// @desc    获取指定学生的所有反馈记录
// @route   GET /api/courses/:courseId/students/:studentId/feedback
// @access  Private
exports.getFeedbackForStudent = async (req, res) => {
  try {
    const { courseId, studentId } = req.params;

    // 1. 验证 ID 格式
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "无效的课程ID格式" });
    }
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "无效的学生ID格式" });
    }

    // 2. 验证课程是否存在且属于当前登录用户 (确保上下文正确)
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "未找到该课程" });
    }
    if (course.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "无权访问该课程的资源" });
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

    // 4. 查找该学生的所有反馈记录 (也应由当前用户提交)
    //    并按 feedbackDate 降序排序 (最新的反馈在最前面)
    const feedbackRecords = await Feedback.find({
      student: studentId,
      course: courseId, // 确保反馈也与该课程关联
      user: req.user.id, // 确保反馈是由当前用户提交的
    }).sort({ feedbackDate: -1, createdAt: -1 }); // 主要按反馈日期，次要按创建时间

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
// 我们稍后会在这里添加获取学生反馈列表的控制器函数
// exports.getFeedbackForStudent = async (req, res) => { ... };
