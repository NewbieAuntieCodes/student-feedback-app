// src/store/courseStore.js
import { defineStore } from 'pinia'
import * as courseService from '../services/courseService' // 导入课程服务

export const useCourseStore = defineStore('course', {
  state: () => ({
    courses: [],
    currentCourse: null,
    isLoading: false,
    error: null,
    isCreatingCourse: false,
    createCourseError: null,
    isUpdatingCourse: false,
    updateCourseError: null,
    isDeletingCourse: false, // 新增删除状态
    deleteCourseError: null, // 新增删除错误状态
  }),
  getters: {
    userCourses: (state) => state.courses,
    selectedCourse: (state) => state.currentCourse,
  },
  actions: {
    async fetchUserCourses() {
      this.isLoading = true
      this.error = null
      try {
        const response = await courseService.fetchUserCourses() // 使用 CourseService
        if (response.data && response.data.courses) {
          this.courses = response.data.courses
        } else {
          this.courses = []
        }
      } catch (err) {
        this.error = err.response?.data?.message || '获取课程列表失败'
        this.courses = []
        console.error('fetchUserCourses error:', err)
      } finally {
        this.isLoading = false
      }
    },

    setCurrentCourse(course) {
      this.currentCourse = course
    },

    async fetchCourseById(courseId) {
      this.isLoading = true
      this.error = null
      try {
        const response = await courseService.fetchCourseById(courseId) // 使用 CourseService
        // this.currentCourse = response.data.course; // 可以直接在这里设置，或者由调用者设置
        return response.data.course
      } catch (err) {
        this.error = err.response?.data?.message || '获取课程详情失败'
        console.error('fetchCourseById error:', err)
        return null
      } finally {
        this.isLoading = false
      }
    },

    async createCourse(courseData) {
      this.isCreatingCourse = true
      this.createCourseError = null
      this.error = null
      try {
        const response = await courseService.createCourse(courseData) // 使用 CourseService
        if (response.data && response.data.course) {
          this.courses.unshift(response.data.course)
          // this.setCurrentCourse(response.data.course); // 可选
          return response.data.course
        }
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

    async updateCourse(courseId, courseDataToUpdate) {
      if (!courseId) {
        this.updateCourseError = '未提供课程ID用于更新'
        return false
      }
      this.isUpdatingCourse = true
      this.updateCourseError = null
      this.error = null
      try {
        const response = await courseService.updateCourse(courseId, courseDataToUpdate) // 使用 CourseService
        if (response.data && response.data.course) {
          const updatedCourse = response.data.course
          const index = this.courses.findIndex((c) => c._id === updatedCourse._id)
          if (index !== -1) {
            this.courses[index] = { ...this.courses[index], ...updatedCourse }
          }
          if (this.currentCourse && this.currentCourse._id === updatedCourse._id) {
            this.currentCourse = { ...this.currentCourse, ...updatedCourse }
          }
          return true
        }
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

    async deleteCourse(courseId) {
      // 新增删除 action
      if (!courseId) {
        this.deleteCourseError = '未提供课程ID用于删除'
        return false
      }
      this.isDeletingCourse = true
      this.deleteCourseError = null
      this.error = null
      try {
        await courseService.deleteCourse(courseId) // 使用 CourseService
        this.courses = this.courses.filter((course) => course._id !== courseId)
        if (this.currentCourse && this.currentCourse._id === courseId) {
          this.currentCourse = null // 如果删除的是当前选中课程，则清空
        }
        return true
      } catch (err) {
        this.deleteCourseError = err.response?.data?.message || '删除课程失败'
        console.error('deleteCourse error:', err)
        return false
      } finally {
        this.isDeletingCourse = false
      }
    },

    clearErrors() {
      this.error = null
      this.createCourseError = null
      this.updateCourseError = null
      this.deleteCourseError = null
    },
  },
})
