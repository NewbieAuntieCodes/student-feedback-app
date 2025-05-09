import axios from 'axios'

// 创建一个 Axios 实例
const apiClient = axios.create({
  baseURL: 'http://localhost:3001/api', // 你的后端 API 基础 URL
  headers: {
    'Content-Type': 'application/json',
  },
})

// (可选) 添加请求拦截器，用于在每个请求发送前自动添加 JWT token
apiClient.interceptors.request.use(
  (config) => {
    // 尝试从 localStorage (或其他地方) 获取 token
    const token = localStorage.getItem('userToken') // 我们稍后会在登录成功后将 token 存入 localStorage
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// (可选) 你也可以添加响应拦截器，用于统一处理 API 错误，或在 token 过期时执行操作

export default apiClient
