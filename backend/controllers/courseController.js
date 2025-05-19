//backend/controllers/courseController.js
const Course = require("../models/Course"); // 引入 Course 模型
const User = require("../models/User"); // 引入 User 模型 (虽然这里直接用 req.user.id，但有时可能需要)
const mongoose = require("mongoose");

const Student = require("../models/Student"); // 确保引入 Student 模型
const Feedback = require("../models/Feedback"); // 确保引入 Feedback 模型

// @desc    创建新课程
// @route   POST /api/courses
// @access  Private (需要用户登录)
exports.createCourse = async (req, res) => {
  try {
    // 1. 从请求体中获取课程名称
    const { name } = req.body;

    // 2. 简单验证课程名称是否存在
    if (!name) {
      return res.status(400).json({ message: "请输入课程名称" });
    }

    // 3. req.user 是通过 protect 中间件添加的，包含了登录用户的信息
    if (!req.user || !req.user.id) {
      // 理论上 protect 中间件已经处理了用户不存在的情况，但作为双重检查
      return res.status(401).json({ message: "用户未授权或用户ID丢失" });
    }

    // 4. 创建新课程实例
    const newCourse = new Course({
      name, // 课程名称
      user: req.user.id, // 将课程与当前登录的用户关联
    });

    // 5. 保存课程到数据库
    const savedCourse = await newCourse.save();

    // 6. 返回成功响应
    res.status(201).json({
      message: "课程创建成功！",
      course: savedCourse,
    });
  } catch (error) {
    console.error("创建课程错误:", error);
    if (error.name === "ValidationError") {
      // 处理 Mongoose 验证错误 (例如 "课程名称不能为空")
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ message: messages.join(", ") });
    }
    // 你可以根据之前 Course 模型中是否启用了唯一索引来处理可能的重复错误
    // if (error.code === 11000) { // MongoDB duplicate key error
    //   return res.status(400).json({ message: '你已经创建过同名的课程了' });
    // }
    res.status(500).json({ message: "服务器内部错误，创建课程失败" });
  }
};

// @desc    获取当前登录用户的所有课程
// @route   GET /api/courses
// @access  Private
exports.getCourses = async (req, res) => {
  try {
    // req.user.id 是由 protect 中间件提供的
    // 我们查找所有 user 字段等于当前登录用户ID的课程
    const courses = await Course.find({ user: req.user.id }).sort({
      createdAt: -1,
    }); // 按创建时间降序排序

    res.status(200).json({
      message: "成功获取课程列表",
      count: courses.length, // 可以选择性地返回课程数量
      courses: courses,
    });
  } catch (error) {
    console.error("获取课程列表错误:", error);
    res.status(500).json({ message: "服务器内部错误，获取课程列表失败" });
  }
};

// @desc    获取单个课程详情
// @route   GET /api/courses/:id
// @access  Private
exports.getCourseById = async (req, res) => {
  try {
    // 1. 检查传入的 ID 是否是合法的 MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "无效的课程ID格式" });
    }

    // 2. 根据 ID 查找课程
    const course = await Course.findById(req.params.id);

    // 3. 如果课程不存在
    if (!course) {
      return res.status(404).json({ message: "未找到该课程" });
    }

    // 4. 验证该课程是否属于当前登录用户
    //    req.user.id 是由 protect 中间件提供的当前登录用户的ID
    //    course.user 存储的是创建该课程的用户的ID (ObjectId 类型)
    if (course.user.toString() !== req.user.id) {
      // 如果课程不属于当前用户，返回 403 Forbidden 或 404 Not Found 都可以
      // 403 更准确地表示用户已认证但无权访问该特定资源
      return res.status(403).json({ message: "无权访问该课程" });
    }

    // 5. 如果一切正常，返回课程详情
    res.status(200).json({
      message: "成功获取课程详情",
      course: course,
    });
  } catch (error) {
    console.error("获取课程详情错误:", error);
    // 如果 findById 内部出错 (例如 ID 格式正确但查询时发生其他错误)
    res.status(500).json({ message: "服务器内部错误，获取课程详情失败" });
  }
};

// @desc    更新课程信息
// @route   PUT /api/courses/:id
// @access  Private
exports.updateCourse = async (req, res) => {
  try {
    // 1. 从请求体中获取要更新的课程名称和状态
    const { name, status } = req.body;

    // 2. 验证：确保至少有一个要更新的字段，并且 status 值有效
    if (!name && !status) {
      return res.status(400).json({ message: "请输入要更新的课程名称或状态" });
    }

    if (status && !["active", "completed"].includes(status)) {
      // <--- 校验 status 值
      return res
        .status(400)
        .json({ message: "无效的课程状态值。只允许 'active' 或 'completed'" });
    }

    // 3. 检查传入的 ID 是否是合法的 MongoDB ObjectId (这部分逻辑已存在，保持)
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "无效的课程ID格式" });
    }

    // 4. 根据 ID 查找课程 (这部分逻辑已存在，保持)
    let course = await Course.findById(req.params.id);

    // 5. 如果课程不存在 (这部分逻辑已存在，保持)
    if (!course) {
      return res.status(404).json({ message: "未找到该课程" });
    }

    // 6. 验证该课程是否属于当前登录用户 (这部分逻辑已存在，保持)
    if (course.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "无权修改该课程" });
    }

    // 7. 更新课程信息
    if (name) {
      // 只有当请求中提供了 name 时才更新
      course.name = name;
    }
    if (status) {
      // 只有当请求中提供了 status 时才更新
      course.status = status;
    }
    // 如果将来还有其他字段需要更新，也在这里类似处理

    // 8. 保存更新后的课程
    const updatedCourse = await course.save();

    // 9. 返回成功响应和更新后的课程信息
    res.status(200).json({
      message: "课程更新成功！",
      course: updatedCourse,
    });
  } catch (error) {
    console.error("更新课程错误:", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ message: messages.join(", ") });
    }
    // 你可以根据之前 Course 模型中是否启用了唯一索引来处理可能的重复错误
    // if (error.code === 11000) {
    //   return res.status(400).json({ message: '更新后的课程名称与你已有的其他课程重复' });
    // }
    res.status(500).json({ message: "服务器内部错误，更新课程失败" });
  }
};

// @desc    删除课程
// @route   DELETE /api/courses/:id
// @access  Private
exports.deleteCourse = async (req, res) => {
  try {
    // 1. 检查传入的 ID 是否是合法的 MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "无效的课程ID格式" });
    }

    // 2. 根据 ID 查找课程
    const course = await Course.findById(req.params.id);

    // 3. 如果课程不存在
    if (!course) {
      return res.status(404).json({ message: "未找到该课程" });
    }

    // 4. 验证该课程是否属于当前登录用户
    if (course.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "无权删除该课程" });
    }

    // --- 新增：处理关联数据 ---
    const courseId = req.params.id;

    // 1. 处理关联的学生 (示例：假设 Student 有一个 course 字段)
    //    您可能需要将学生的 course 字段设为 null，或从一个数组中移除 courseId
    //    或者，如果业务逻辑是删除学生，则执行删除操作。
    //    具体操作取决于您的业务需求。
    // 示例：从所有学生的 enrolledCourses 数组中移除此课程ID
    await Student.updateMany(
      { enrolledCourses: courseId }, // 找到所有注册了此课程的学生
      { $pull: { enrolledCourses: courseId } } // 从他们的课程数组中移除此课程ID
    );
    // 或者，如果学生只与一个课程关联，并且删除课程意味着学生不再有效（这不常见）
    // await Student.deleteMany({ course: courseId });

    // 2. 处理关联的反馈 (示例：假设 Feedback 有一个 courseId 字段)
    await Feedback.deleteMany({ course: courseId }); // 删除所有与此课程相关的反馈

    // --- 关联数据处理结束 ---

    // 5. 删除课程
    // await course.remove(); // remove() is deprecated in Mongoose v6+, use deleteOne() or findByIdAndDelete()
    // 使用 findByIdAndDelete 更直接，或者在找到的 course 实例上调用 deleteOne()
    await Course.findByIdAndDelete(req.params.id);
    // 或者: await course.deleteOne(); (如果你想在 course 实例上操作)

    // 6. 返回成功响应
    res.status(200).json({ message: "课程删除成功！", courseId: courseId }); // 返回被删除课程的 ID 可能会对前端更新 UI 有帮助
  } catch (error) {
    console.error("删除课程错误:", error);
    res.status(500).json({ message: "服务器内部错误，删除课程失败" });
  }
};
// 我们稍后会在这里添加其他课程相关的控制器函数，比如：
// exports.getCourses = async (req, res) => { ... };
// exports.getCourseById = async (req, res) => { ... };
// exports.updateCourse = async (req, res) => { ... };
// exports.deleteCourse = async (req, res) => { ... };
