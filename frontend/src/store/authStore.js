// src/store/authStore.js
import { defineStore } from 'pinia'
import router from '../router' // 引入 router 实例用于导航
import * as authService from '../services/authService' // 导入认证服务
import apiClient from '../services/apiClient' // 导入 apiClient 以便修改其默认头

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user')) || null,
    loginError: null,
    registerError: null,
    registerSuccessMessage: null,
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
      this.registerSuccessMessage = null
      try {
        const response = await authService.login(credentials) // 使用 AuthService
        const { token, user } = response.data

        if (token && user) {
          this.token = token
          this.user = user
          localStorage.setItem('token', token)
          localStorage.setItem('user', JSON.stringify(user))
          // apiClient 的请求拦截器会自动处理 token，这里无需手动设置 apiClient.defaults.headers
          // 但如果 apiClient 实例在 store 加载后才创建或 token 更新时需要强制刷新拦截器逻辑，
          // 或者你有其他不通过 apiClient 发送的请求需要 token, 则可能需要其他策略。
          // 为简单起见，依赖请求拦截器。
          if (token) {
            // 确保 token 存在
            apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
          } else {
            delete apiClient.defaults.headers.common['Authorization']
          }
          router.push(router.currentRoute.value.query.redirect || '/') // 跳转到之前意图的页面或首页
        } else {
          this.loginError = '登录失败，服务器返回数据格式不正确。'
        }
        return true
      } catch (error) {
        if (error.response && error.response.data && error.response.data.message) {
          this.loginError = error.response.data.message
        } else {
          this.loginError = '登录失败，请检查您的网络或联系管理员。'
        }
        return false
      } finally {
        this.isLoading = false
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
      delete apiClient.defaults.headers.common['Authorization'] // 清除 apiClient 的默认头
      router.push('/login')
    },

    async register(userData) {
      this.isLoading = true
      this.registerError = null
      this.registerSuccessMessage = null
      try {
        const response = await authService.register(userData) // 使用 AuthService

        if (response.status === 201 && response.data.message) {
          this.registerSuccessMessage = response.data.message + ' 您现在可以登录了。'
        } else {
          this.registerError = '注册请求成功，但响应格式不正确。'
        }
        return true
      } catch (error) {
        if (error.response && error.response.data && error.response.data.message) {
          this.registerError = error.response.data.message
        } else {
          this.registerError = '注册失败，请稍后再试或联系管理员。'
        }
        return false
      } finally {
        this.isLoading = false
      }
    },

    // Action to attempt to load user info if token exists but user info is missing (e.g., after page refresh)
    async fetchUserOnLoad() {
      if (this.token && !this.user) {
        this.isLoading = true
        try {
          const response = await authService.fetchCurrentUser() // 使用 AuthService
          this.user = response.data.user
          localStorage.setItem('user', JSON.stringify(this.user))
        } catch (error) {
          console.error('Failed to fetch user on load:', error)
          // Token might be invalid, consider logging out
          // this.logout(); // 或者不处理，让路由守卫处理
        } finally {
          this.isLoading = false
        }
      }
    },

    clearAuthMessages() {
      this.loginError = null
      this.registerError = null
      this.registerSuccessMessage = null
    },

    // 更新 main.js 和 router/index.js 会在适当时候调用这个
    setTokenInApiClient() {
      if (this.token) {
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${this.token}`
      } else {
        delete apiClient.defaults.headers.common['Authorization']
      }
    },
  },
})
