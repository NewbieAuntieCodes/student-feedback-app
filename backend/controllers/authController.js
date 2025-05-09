const User = require("../models/User"); // 引入 User 模型
const bcrypt = require("bcryptjs"); // 引入 bcryptjs 用于密码哈希
const jwt = require("jsonwebtoken"); // <-- 新增：引入 jsonwebtoken

// @desc    注册新用户
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
  try {
    // 1. 从请求体中获取用户名和密码
    const { username, password } = req.body;

    // 2. 简单验证 (确保用户名和密码存在)
    if (!username || !password) {
      return res.status(400).json({ message: "请输入用户名和密码" });
    }

    // 3. 检查用户名是否已存在
    const existingUser = await User.findOne({ username: username });
    if (existingUser) {
      return res.status(400).json({ message: "该用户名已被注册" });
    }

    // 4. 哈希密码
    // bcrypt.genSalt() 生成一个 "salt" (盐)，增加密码破解难度
    // 10 是 salt rounds，数字越大越安全但越耗时，10-12 通常是好的选择
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 5. 创建新用户实例
    const newUser = new User({
      username: username,
      password: hashedPassword, // 存储哈希后的密码
    });

    // 6. 保存用户到数据库
    await newUser.save();

    // 7. 返回成功响应 (不返回密码)
    res.status(201).json({
      message: "用户注册成功！",
      user: {
        _id: newUser._id,
        username: newUser.username,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    console.error("注册错误:", error);
    // 检查是否是 Mongoose 验证错误 (例如密码太短)
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({ message: messages.join(", ") });
    }
    res.status(500).json({ message: "服务器内部错误，注册失败" });
  }
};

// @desc    认证用户并获取 token (登录)
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    // 1. 简单验证
    if (!username || !password) {
      return res.status(400).json({ message: "请输入用户名和密码" });
    }

    // 2. 检查用户是否存在
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: "无效的凭证" }); // 不要提示用户名不存在，以防枚举攻击
    }

    // 3. 比较密码
    // bcrypt.compare 会比较原始密码和数据库中存储的哈希密码
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "无效的凭证" }); // 同样，不要提示密码错误
    }

    // 4. 如果凭证正确，生成 JWT
    //    JWT payload (载荷) 通常包含一些不敏感的用户信息，比如用户 ID
    const payload = {
      user: {
        id: user._id, // 或者 user.id，Mongoose 会处理
        // 你也可以添加其他信息，如 username，但避免敏感信息
      },
    };

    //    使用 .env 文件中的 JWT_SECRET 来签名 token
    //    设置一个过期时间 (例如 '1h' 表示1小时, '7d' 表示7天)
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "1h" }, // Token 有效期1小时
      (err, token) => {
        if (err) throw err; // 如果签名出错，抛出错误
        res.json({
          message: "登录成功！",
          token: token,
          user: {
            // 可以选择性地返回一些用户信息
            _id: user._id,
            username: user.username,
          },
        });
      }
    );
  } catch (error) {
    console.error("登录错误:", error);
    res.status(500).json({ message: "服务器内部错误，登录失败" });
  }
};
