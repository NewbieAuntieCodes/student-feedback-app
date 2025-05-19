// src/services/apiClient.js
import axios from 'axios'

// 创建一个 Axios 实例
const apiClient = axios.create({
  baseURL: 'http://localhost:3001/api', // 你的后端 API 基础 URL
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器，用于在每个请求发送前自动添加 JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') // 从 localStorage 获取 token
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// 响应拦截器 (可选，但推荐)
apiClient.interceptors.response.use(
  (response) => {
    // 对响应数据做点什么
    return response
  },
  (error) => {
    // 对响应错误做点什么
    if (error.response && error.response.status === 401) {
      // 例如，如果 token 过期或无效，可以尝试刷新 token 或重定向到登录页
      // 这个逻辑需要根据你的 authStore 来配合处理，比如 dispatch 一个 logout action
      console.error('Unauthorized, logging out or refreshing token...')
      // import { useAuthStore } from '@/store/authStore'; // 注意：在JS模块顶层导入store可能导致循环依赖
      // const authStore = useAuthStore();
      // authStore.logout(); // 或者更复杂的 token刷新逻辑
    }
    return Promise.reject(error)
  },
)

export default apiClient
