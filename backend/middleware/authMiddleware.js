const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  let token;

  // 检查请求头中是否有 Authorization，并且是以 'Bearer ' 开头
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // 1. 从请求头中提取 token ('Bearer <token>')
      token = req.headers.authorization.split(" ")[1];

      // 2. 验证 token
      //    使用 .env 文件中的 JWT_SECRET 来验证
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 3. 从 token 中获取用户 ID，并从数据库中查找用户 (不包括密码)
      //    这样后续的路由处理器就可以通过 req.user 访问到用户信息
      req.user = await User.findById(decoded.user.id).select("-password");

      if (!req.user) {
        return res.status(401).json({ message: "用户未找到，授权失败" });
      }

      next(); // Token 有效，用户存在，继续执行下一个中间件或路由处理器
    } catch (error) {
      console.error("Token 验证错误:", error.message);
      if (error.name === "JsonWebTokenError") {
        return res.status(401).json({ message: "无效的 Token，授权失败" });
      }
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({ message: "Token 已过期，授权失败" });
      }
      return res.status(401).json({ message: "未授权，Token 验证失败" });
    }
  }

  if (!token) {
    res.status(401).json({ message: "未授权，没有提供 Token" });
  }
};

module.exports = { protect };
