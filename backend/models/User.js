const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// 定义用户的数据结构
const userSchema = new Schema({
  username: {
    type: String,
    required: true, // 用户名是必填的
    unique: true, // 用户名必须是唯一的
    trim: true, // 去除用户名前后的空格
    minlength: 2, // 用户名至少需要3个字符
  },
  password: {
    type: String,
    required: true, // 密码是必填的
    minlength: 6, // 密码至少需要6个字符
  },
  // 我们可以添加一个注册时间字段，默认为当前时间
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// 基于 Schema 创建 User 模型
// Mongoose 会自动将 'User' 转换为小写并复数化作为数据库中的集合名，即 'users'
const User = mongoose.model("User", userSchema);

module.exports = User; // 导出 User 模型，以便在其他地方使用
