// src/store/authStore.js
import { defineStore } from 'pinia'
import axios from 'axios' // 或者你封装的 API 服务
import router from '../router' // 引入 router 实例用于导航

// 定义你的后端 API 地址
const API_BASE_URL = 'http://localhost:3001/api/auth' // 请根据你的后端地址修改

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user')) || null,
    loginError: null,
    registerError: null, // 新增：用于存储注册错误信息
    registerSuccessMessage: null, // 新增：用于存储注册成功信息
    isLoading: false,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token && !!state.user,
    currentUser: (state) => state.user,
    getToken: (state) => state.token,
  },
  actions: {
    async login(credentials) {
      this.isLoading = true
      this.loginError = null
      this.registerSuccessMessage = null // 清除可能存在的注册成功消息
      try {
        const response = await axios.post(`${API_BASE_URL}/login`, credentials)
        const { token, user } = response.data

        if (token && user) {
          this.token = token
          this.user = user
          localStorage.setItem('token', token)
          localStorage.setItem('user', JSON.stringify(user))
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
          router.push('/')
        } else {
          this.loginError = '登录失败，服务器返回数据格式不正确。'
        }
        this.isLoading = false
        return true
      } catch (error) {
        this.isLoading = false
        if (error.response && error.response.data && error.response.data.message) {
          this.loginError = error.response.data.message
        } else {
          this.loginError = '登录失败，请检查您的网络或联系管理员。'
        }
        return false
      }
    },

    logout() {
      this.token = null
      this.user = null
      this.loginError = null
      this.registerError = null
      this.registerSuccessMessage = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      delete axios.defaults.headers.common['Authorization']
      router.push('/login')
    },

    // 新增：注册 Action
    async register(userData) {
      this.isLoading = true
      this.registerError = null
      this.registerSuccessMessage = null
      try {
        // 假设 userData 包含 username 和 password
        const response = await axios.post(`${API_BASE_URL}/register`, userData)

        // 后端注册成功通常返回 201 和用户信息或成功消息
        if (response.status === 201 && response.data.message) {
          this.registerSuccessMessage = response.data.message + ' 您现在可以登录了。'
          // 可选：注册成功后直接跳转到登录页
          // router.push('/login');
        } else {
          // 处理非预期的成功响应
          this.registerError = '注册请求成功，但响应格式不正确。'
        }
        this.isLoading = false
        return true // 表示API调用成功（不一定代表业务逻辑上的“注册成功并自动登录”）
      } catch (error) {
        this.isLoading = false
        if (error.response && error.response.data && error.response.data.message) {
          this.registerError = error.response.data.message
        } else {
          this.registerError = '注册失败，请稍后再试或联系管理员。'
        }
        return false // 表示API调用失败
      }
    },

    // 清除错误和成功消息的方法，方便在组件切换时调用
    clearAuthMessages() {
      this.loginError = null
      this.registerError = null
      this.registerSuccessMessage = null
    },
  },
})
// （可选）从 localStorage 加载用户状态，应用初始化时调用
// 这个逻辑部分移到了 state 的初始值中
// loadUserFromStorage() {
//   const token = localStorage.getItem('token');
//   const user = localStorage.getItem('user');
//   if (token && user) {
//     this.token = token;
//     this.user = JSON.parse(user);
//     axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
//   }
// }

// 注册逻辑可以后续添加在这里
// async register(userData) { ... }
