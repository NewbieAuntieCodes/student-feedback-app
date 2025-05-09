// src/store/studentStore.js
import { defineStore } from 'pinia'
import axios from 'axios'

const API_COURSES_BASE_URL = 'http://localhost:3001/api/courses' // 请确保端口正确

export const useStudentStore = defineStore('student', {
  state: () => ({
    students: [], // 存储当前选定课程下的学生列表
    currentStudent: null, // 当前选中的学生对象
    isLoading: false, // 用于获取学生列表的加载状态
    error: null, // 用于获取学生列表的错误信息
    isUpdating: false, // 用于更新学生信息的加载状态
    updateError: null, // 用于存储更新学生信息时的错误
    isAddingStudent: false, // 用于添加学生的加载状态
    addStudentError: null, // 用于添加学生的错误信息
  }),
  getters: {
    studentsInCurrentCourse: (state) => state.students,
    selectedStudent: (state) => state.currentStudent,
  },
  actions: {
    // 获取指定课程下的所有学生
    async fetchStudentsInCourse(courseId) {
      if (!courseId) {
        this.error = '未提供课程ID以获取学生列表'
        this.students = []
        return
      }
      this.isLoading = true
      this.error = null
      try {
        const response = await axios.get(`${API_COURSES_BASE_URL}/${courseId}/students`)
        if (response.data && response.data.students) {
          this.students = response.data.students
        } else {
          this.students = []
        }
      } catch (err) {
        this.error = err.response?.data?.message || '获取学生列表失败'
        this.students = []
        console.error('fetchStudentsInCourse error:', err)
      } finally {
        this.isLoading = false
      }
    },

    // 设置当前选中的学生
    setCurrentStudent(student) {
      this.currentStudent = student
    },

    // 添加学生到指定课程
    async addStudentToCourse(courseId, studentData) {
      if (!courseId) {
        this.addStudentError = '未提供课程ID以添加学生'
        return null
      }
      this.isAddingStudent = true
      this.addStudentError = null
      this.error = null // Clear general error
      try {
        const response = await axios.post(
          `${API_COURSES_BASE_URL}/${courseId}/students`,
          studentData,
        )
        if (response.data && response.data.student) {
          this.students.unshift(response.data.student) // 添加到列表开头
          // 可选：如果添加后只有一个学生，或希望自动选中，则设置 currentStudent
          // if (this.students.length === 1) {
          //   this.setCurrentStudent(response.data.student);
          // }
          return response.data.student
        }
        this.addStudentError = '添加学生成功，但服务器响应格式不正确。'
        return null
      } catch (err) {
        this.addStudentError = err.response?.data?.message || '添加学生失败'
        console.error('addStudentToCourse error:', err)
        return null
      } finally {
        this.isAddingStudent = false
      }
    },

    // 更新学生信息
    async updateStudentDetails(courseId, studentId, studentDataToUpdate) {
      if (!courseId || !studentId) {
        this.updateError = '未提供课程或学生ID用于更新'
        return false
      }
      this.isUpdating = true
      this.updateError = null
      this.error = null // Clear general error
      try {
        const response = await axios.put(
          `${API_COURSES_BASE_URL}/${courseId}/students/${studentId}`,
          studentDataToUpdate,
        )
        if (response.data && response.data.student) {
          const updatedStudent = response.data.student
          const indexInList = this.students.findIndex((s) => s._id === updatedStudent._id)
          if (indexInList !== -1) {
            this.students[indexInList] = { ...this.students[indexInList], ...updatedStudent }
          }
          if (this.currentStudent && this.currentStudent._id === updatedStudent._id) {
            this.currentStudent = { ...this.currentStudent, ...updatedStudent }
          }
          return true
        }
        this.updateError = '更新学生信息成功，但服务器响应格式不正确。'
        return false
      } catch (err) {
        this.updateError = err.response?.data?.message || '更新学生信息失败'
        console.error('updateStudentDetails error:', err)
        return false
      } finally {
        this.isUpdating = false
      }
    },

    // 当课程改变时，清空学生列表和当前学生
    clearStudents() {
      this.students = []
      this.currentStudent = null
      // 也清除与学生列表相关的错误和加载状态
      this.error = null
      this.isLoading = false
    },

    // 清除所有与学生操作相关的错误信息
    clearStudentErrors() {
      this.error = null
      this.updateError = null
      this.addStudentError = null
    },
  },
})
