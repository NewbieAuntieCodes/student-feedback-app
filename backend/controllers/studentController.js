//  backend/controllers/studentController.js
const Student = require("../models/Student"); // 引入 Student 模型
const Course = require("../models/Course"); // 引入 Course 模型，用于验证课程所有权
const Feedback = require("../models/Feedback");
const mongoose = require("mongoose"); // 引入 mongoose

// @desc    将学生添加到指定课程
// @route   POST /api/courses/:courseId/students
// @access  Private (需要用户登录)
exports.addStudentToCourse = async (req, res) => {
  try {
    const { courseId } = req.params; // 从 URL 参数中获取 courseId
    const { name, grade, status, needsAttention, specialAttention } = req.body; // 从请求体中获取学生信息

    // 1. 验证 courseId 是否有效
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "无效的课程ID格式" });
    }

    // 2. 查找课程，并验证课程是否存在且属于当前登录用户
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "未找到该课程" });
    }
    if (course.user.toString() !== req.user.id) {
      // req.user.id 来自 protect 中间件
      return res.status(403).json({ message: "无权向该课程添加学生" });
    }

    // 3. 验证学生姓名是否存在
    if (!name) {
      return res.status(400).json({ message: "请输入学生姓名" });
    }

    // 4. 创建新学生实例
    const newStudent = new Student({
      name,
      grade, // 如果前端没提供，会使用 schema 中的默认值或为空
      status, // 如果前端没提供，会使用 schema 中的默认值 'ongoing'
      needsAttention, // 如果前端没提供，会使用 schema 中的默认值 false
      specialAttention, // 如果前端没提供，会使用 schema 中的默认值 false
      course: courseId, // 关联到当前课程
      user: req.user.id, // 关联到当前登录用户 (老师)
    });

    // 5. 保存学生到数据库
    const savedStudent = await newStudent.save();

    // 6. 返回成功响应
    res.status(201).json({
      message: "学生添加成功！",
      student: savedStudent,
    });
  } catch (error) {
    console.error("添加学生错误:", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ message: messages.join(", ") });
    }
    // 考虑处理 Student 模型中可能设置的唯一索引错误 (例如，同一老师在同一课程下添加同名学生)
    // if (error.code === 11000) {
    //   return res.status(400).json({ message: '该课程下已存在同名学生' });
    // }
    res.status(500).json({ message: "服务器内部错误，添加学生失败" });
  }
};

// @desc    获取指定课程下的所有学生
// @route   GET /api/courses/:courseId/students
// @access  Private
exports.getStudentsInCourse = async (req, res) => {
  try {
    const { courseId } = req.params; // 从 URL 参数中获取 courseId

    // 1. 验证 courseId 是否有效
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "无效的课程ID格式" });
    }

    // 2. 验证课程是否存在且属于当前登录用户
    //    这一步是为了确保用户只能访问他们自己课程下的学生
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "未找到该课程" });
    }
    if (course.user.toString() !== req.user.id) {
      // req.user.id 来自 protect 中间件
      return res.status(403).json({ message: "无权访问该课程下的学生列表" });
    }

    // 3. 查找该课程下的所有学生 (这些学生也应该是由当前用户创建的)
    //    我们通过 courseId 和 userId 双重条件来查找，确保数据的严格归属
    const students = await Student.find({
      course: courseId,
      user: req.user.id, // 确保学生也属于当前登录用户
    }).sort({ createdAt: -1 }); // 按创建时间降序排序 (可选)

    res.status(200).json({
      message: "成功获取学生列表",
      count: students.length,
      students: students,
    });
  } catch (error) {
    console.error("获取学生列表错误:", error);
    res.status(500).json({ message: "服务器内部错误，获取学生列表失败" });
  }
};

// @desc    获取单个学生详情
// @route   GET /api/courses/:courseId/students/:studentId
// @access  Private
exports.getStudentDetails = async (req, res) => {
  try {
    const { courseId, studentId } = req.params;

    // 1. 验证 courseId 和 studentId 是否有效
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
      return res.status(403).json({ message: "无权访问该课程下的学生" });
    }

    // 3. 查找学生，并确保其属于指定的课程和当前用户
    const student = await Student.findOne({
      _id: studentId,
      course: courseId,
      user: req.user.id, // 确保学生也由当前用户管理
    });

    if (!student) {
      return res
        .status(404)
        .json({ message: "未找到该学生，或该学生不属于指定课程/用户" });
    }

    res.status(200).json({
      message: "成功获取学生详情",
      student: student,
    });
  } catch (error) {
    console.error("获取学生详情错误:", error);
    res.status(500).json({ message: "服务器内部错误，获取学生详情失败" });
  }
};

// @desc    更新学生信息
// @route   PUT /api/courses/:courseId/students/:studentId
// @access  Private
exports.updateStudent = async (req, res) => {
  try {
    const { courseId, studentId } = req.params;
    // 从请求体中获取所有可能更新的字段
    const { name, grade, status, needsAttention, specialAttention } = req.body;

    // 1. 验证 courseId 和 studentId 是否有效
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
      return res.status(403).json({ message: "无权修改该课程下的学生信息" });
    }

    // 3. 查找要更新的学生，并确保其属于指定的课程和当前用户
    let student = await Student.findOne({
      _id: studentId,
      course: courseId,
      user: req.user.id,
    });

    if (!student) {
      return res
        .status(404)
        .json({ message: "未找到该学生，或该学生不属于指定课程/用户" });
    }

    // 4. 更新学生信息
    //    只更新请求体中提供的字段
    if (name !== undefined) student.name = name;
    if (grade !== undefined) student.grade = grade;
    if (status !== undefined) student.status = status; // 确保 status 值在 enum 范围内
    if (needsAttention !== undefined) student.needsAttention = needsAttention;
    if (specialAttention !== undefined)
      student.specialAttention = specialAttention;

    // 5. 保存更新后的学生信息
    const updatedStudent = await student.save(); // .save() 会触发 Mongoose 验证

    res.status(200).json({
      message: "学生信息更新成功！",
      student: updatedStudent,
    });
  } catch (error) {
    console.error("更新学生信息错误:", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ message: messages.join(", ") });
    }
    // 考虑 Student 模型中可能设置的唯一索引错误 (例如，同一老师在同一课程下更新后导致学生同名)
    // if (error.code === 11000) {
    //   return res.status(400).json({ message: '更新后的学生姓名与该课程下其他学生重复' });
    // }
    res.status(500).json({ message: "服务器内部错误，更新学生信息失败" });
  }
};

// @desc    从课程中删除学生
// @route   DELETE /api/courses/:courseId/students/:studentId
// @access  Private
exports.deleteStudent = async (req, res) => {
  try {
    const { courseId, studentId } = req.params;

    // 1. 验证 courseId 和 studentId 是否有效
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
      return res.status(403).json({ message: "无权操作该课程下的学生" });
    }

    // 3. 查找要删除的学生，并确保其属于指定的课程和当前用户
    const student = await Student.findOne({
      _id: studentId,
      course: courseId,
      user: req.user.id,
    });

    if (!student) {
      return res
        .status(404)
        .json({ message: "未找到该学生，或该学生不属于指定课程/用户" });
    }

    // --- 【新增】步骤 4: 删除该学生的所有相关反馈记录 ---
    // 根据 Feedback 模型，反馈记录通过 `student` 字段关联学生ID
    // 我们也应该只删除属于这个课程的反馈，并且是由当前用户创建的反馈（如果适用）
    // 或者，如果反馈不直接和用户关联，但和课程关联，也可以通过课程ID筛选
    await Feedback.deleteMany({
      student: studentId,
      course: courseId, // 确保只删除此课程下的此学生的反馈
      // user: req.user.id, // 可选：如果反馈也严格属于创建它的用户
      // 如果反馈可以由不同用户（如助教）添加，则此条件可能不需要
      // 或者如果删除学生的权限意味着可以删除所有相关反馈，则此条件也可以省略
      // 基于您 Feedback 模型中 user 字段的含义决定
    });
    console.log(
      `已删除学生 ${student.name} (ID: ${studentId}) 在课程 ${course.name} (ID: ${courseId}) 下的所有反馈记录。`
    );
    // --- 结束 【新增】步骤 4 ---

    // 4. 删除学生
    await Student.findByIdAndDelete(studentId);
    // 或者: await student.deleteOne(); (如果你想在 student 实例上操作)

    // 5. 返回成功响应
    res.status(200).json({ message: "学生删除成功！", studentId: studentId });
    // 也可以返回 204 No Content
    // res.status(204).send();
  } catch (error) {
    console.error("删除学生错误:", error);
    res.status(500).json({ message: "服务器内部错误，删除学生失败" });
  }
};
// 我们稍后会在这里添加其他学生相关的控制器函数，比如：
// exports.getStudentsInCourse = async (req, res) => { ... };
// exports.getStudentDetails = async (req, res) => { ... };
// exports.updateStudent = async (req, res) => { ... };
// exports.deleteStudent = async (req, res) => { ... };
