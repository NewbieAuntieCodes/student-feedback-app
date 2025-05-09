// src/store/courseStore.js
import { defineStore } from 'pinia'
import axios from 'axios'

// 定义你的后端 API 地址 (课程相关)
const API_BASE_URL = 'http://localhost:3001/api/courses' // 请确保端口正确

export const useCourseStore = defineStore('course', {
  state: () => ({
    courses: [], // 存储用户的课程列表
    currentCourse: null, // 当前选中的课程对象
    isLoading: false, // 用于获取课程列表或详情的加载状态
    error: null, // 用于获取课程列表或详情的错误信息
    isCreatingCourse: false, // 用于创建课程的加载状态
    createCourseError: null, // 用于创建课程的错误信息
    isUpdatingCourse: false, // 用于更新课程的加载状态
    updateCourseError: null, // 用于更新课程的错误信息
  }),
  getters: {
    userCourses: (state) => state.courses,
    selectedCourse: (state) => state.currentCourse,
  },
  actions: {
    // 获取当前登录用户的所有课程
    async fetchUserCourses() {
      this.isLoading = true
      this.error = null // 清除之前的列表加载错误
      try {
        const response = await axios.get(`${API_BASE_URL}/`) // GET /api/courses
        if (response.data && response.data.courses) {
          this.courses = response.data.courses
        } else {
          this.courses = [] // 如果没有课程或响应格式不对
        }
      } catch (err) {
        this.error = err.response?.data?.message || '获取课程列表失败'
        this.courses = [] // 出错时清空课程
        console.error('fetchUserCourses error:', err)
      } finally {
        this.isLoading = false
      }
    },

    // 设置当前选中的课程
    setCurrentCourse(course) {
      // 当课程被清空 (null) 时，也应该接受
      this.currentCourse = course
    },

    // （可选）根据 ID 获取单个课程详情
    async fetchCourseById(courseId) {
      this.isLoading = true
      this.error = null
      try {
        const response = await axios.get(`${API_BASE_URL}/${courseId}`) // GET /api/courses/:id
        // 如果需要，可以在这里设置 this.currentCourse = response.data.course;
        return response.data.course
      } catch (err) {
        this.error = err.response?.data?.message || '获取课程详情失败'
        console.error('fetchCourseById error:', err)
        return null
      } finally {
        this.isLoading = false
      }
    },

    // 创建新课程
    async createCourse(courseData) {
      // courseData: { name: '课程名' }
      this.isCreatingCourse = true
      this.createCourseError = null // 清除之前的创建错误
      this.error = null // 同时清除通用的列表加载错误
      try {
        const response = await axios.post(`${API_BASE_URL}/`, courseData) // POST /api/courses
        if (response.data && response.data.course) {
          this.courses.unshift(response.data.course) // 添加到列表开头，立即在UI上可见
          // 可选：创建成功后，将新创建的课程设为当前选中课程
          // this.setCurrentCourse(response.data.course);
          return response.data.course // 返回创建的课程对象
        }
        // 如果后端成功但返回数据格式不对
        this.createCourseError = '创建课程成功，但服务器响应格式不正确。'
        return null
      } catch (err) {
        this.createCourseError = err.response?.data?.message || '创建课程失败'
        console.error('createCourse error:', err)
        return null
      } finally {
        this.isCreatingCourse = false
      }
    },

    // 更新课程信息
    async updateCourse(courseId, courseDataToUpdate) {
      // courseDataToUpdate: { name: '新课程名' }
      if (!courseId) {
        this.updateCourseError = '未提供课程ID用于更新'
        return false
      }
      this.isUpdatingCourse = true
      this.updateCourseError = null // 清除之前的更新错误
      this.error = null // 同时清除通用的列表加载错误
      try {
        const response = await axios.put(`${API_BASE_URL}/${courseId}`, courseDataToUpdate) // PUT /api/courses/:id
        if (response.data && response.data.course) {
          const updatedCourse = response.data.course
          // 更新 courses 列表中的对应课程
          const index = this.courses.findIndex((c) => c._id === updatedCourse._id)
          if (index !== -1) {
            this.courses[index] = { ...this.courses[index], ...updatedCourse }
          }
          // 如果当前选中的就是这个课程，也更新 currentCourse
          if (this.currentCourse && this.currentCourse._id === updatedCourse._id) {
            this.currentCourse = { ...this.currentCourse, ...updatedCourse }
          }
          return true // 表示更新成功
        }
        // 如果后端成功但返回数据格式不对
        this.updateCourseError = '更新课程成功，但服务器响应格式不正确。'
        return false
      } catch (err) {
        this.updateCourseError = err.response?.data?.message || '更新课程失败'
        console.error('updateCourse error:', err)
        return false
      } finally {
        this.isUpdatingCourse = false
      }
    },

    // 清除所有类型的错误信息
    clearErrors() {
      this.error = null
      this.createCourseError = null
      this.updateCourseError = null
    },
  },
})
