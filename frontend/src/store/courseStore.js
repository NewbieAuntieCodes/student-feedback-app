// frontend/src/store/courseStore.js
import { defineStore } from 'pinia'
import * as courseService from '../services/courseService'
import { useStudentStore } from './studentStore' // 导入 studentStore
// import router from '@/router'; // 避免在 store 中直接导入 router，除非非常必要且处理好循环依赖

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
    isDeletingCourse: false,
    deleteCourseError: null,
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
        const response = await courseService.fetchUserCourses()
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

    async _findAndSetCourse(courseId) {
      if (this.courses.length === 0) {
        await this.fetchUserCourses()
      }
      const course = this.courses.find((c) => c._id === courseId)
      if (course) {
        this.currentCourse = course
        return course
      }
      this.currentCourse = null
      return null
    },

    // 新的 action，用于根据路由参数设置当前课程并加载学生
    async syncCourseWithRoute(courseId, studentId) {
      const studentStore = useStudentStore() // 在 action 内部获取 store 实例

      if (!courseId) {
        this.currentCourse = null
        studentStore.clearStudentsAndCurrent()
        return { courseFound: false }
      }

      const course = await this._findAndSetCourse(courseId)

      if (course) {
        await studentStore.fetchStudentsInCourseAndSetCurrent(courseId, studentId)
        return { courseFound: true, course }
      } else {
        // 课程 ID 无效或未找到
        this.currentCourse = null
        studentStore.clearStudentsAndCurrent()
        return { courseFound: false }
      }
    },

    // 简化 setCurrentCourse，主要用于UI直接选择
    async selectCourse(courseId) {
      const studentStore = useStudentStore()
      if (!courseId) {
        this.currentCourse = null
        studentStore.clearStudentsAndCurrent()
        return
      }
      const course = await this._findAndSetCourse(courseId)
      if (course) {
        await studentStore.fetchStudentsInCourseAndSetCurrent(courseId, null) // 选择课程时，不立即设置学生
      }
    },

    // 保持原来的 setCurrentCourse (或将其与 selectCourse 合并)
    setCurrentCourse(course) {
      this.currentCourse = course
      // 如果需要，在这里也触发学生加载
      // const studentStore = useStudentStore();
      // if (course && course._id) {
      //   studentStore.fetchStudentsInCourseAndSetCurrent(course._id, null);
      // } else {
      //   studentStore.clearStudentsAndCurrent();
      // }
    },

    // ... (createCourse, updateCourse, deleteCourse actions 保持不变或微调)
    async createCourse(courseData) {
      this.isCreatingCourse = true
      this.createCourseError = null
      try {
        const response = await courseService.createCourse(courseData)
        if (response.data && response.data.course) {
          this.courses.unshift(response.data.course)
          // 自动选中新创建的课程
          // this.setCurrentCourse(response.data.course); // 或调用 selectCourse
          return response.data.course
        }
        this.createCourseError = '创建课程成功，但响应格式不正确。'
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
      try {
        const response = await courseService.updateCourse(courseId, courseDataToUpdate)
        if (response.data && response.data.course) {
          const updatedCourse = response.data.course
          const index = this.courses.findIndex((c) => c._id === updatedCourse._id)
          if (index !== -1) {
            this.courses[index] = { ...this.courses[index], ...updatedCourse }
          }
          if (this.currentCourse && this.currentCourse._id === updatedCourse._id) {
            this.currentCourse = { ...this.currentCourse, ...updatedCourse }
          }
          return updatedCourse // 返回更新后的课程对象
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
      if (!courseId) {
        this.deleteCourseError = '未提供课程ID用于删除'
        return false
      }
      this.isDeletingCourse = true
      this.deleteCourseError = null
      const studentStore = useStudentStore()
      try {
        await courseService.deleteCourse(courseId)
        this.courses = this.courses.filter((course) => course._id !== courseId)
        if (this.currentCourse && this.currentCourse._id === courseId) {
          this.currentCourse = null
          studentStore.clearStudentsAndCurrent()
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
