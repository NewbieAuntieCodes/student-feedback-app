// src/services/authService.js
import apiClient from './apiClient'

const API_BASE_URL = '/auth' // 相对于 apiClient 的 baseURL

export const login = (credentials) => {
  return apiClient.post(`${API_BASE_URL}/login`, credentials)
}

export const register = (userData) => {
  return apiClient.post(`${API_BASE_URL}/register`, userData)
}

export const fetchCurrentUser = () => {
  // 假设你的后端有一个 /api/auth/me 的路由来获取当前用户信息
  return apiClient.get(`${API_BASE_URL}/me`)
}
