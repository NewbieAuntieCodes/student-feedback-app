// src/store/studentStore.js
import { defineStore } from 'pinia'
import * as studentService from '../services/studentService' // 导入学生服务

export const useStudentStore = defineStore('student', {
  state: () => ({
    students: [],
    currentStudent: null,
    isLoading: false,
    error: null,
    isUpdating: false,
    updateError: null,
    isAddingStudent: false,
    addStudentError: null,
    isDeletingStudent: false, // 新增
    deleteStudentError: null, // 新增
  }),
  getters: {
    studentsInCurrentCourse: (state) => state.students,
    selectedStudent: (state) => state.currentStudent,
  },
  actions: {
    async fetchStudentsInCourse(courseId) {
      if (!courseId) {
        this.error = '未提供课程ID以获取学生列表'
        this.students = []
        return
      }
      this.isLoading = true
      this.error = null
      try {
        const response = await studentService.fetchStudentsInCourse(courseId) // 使用 StudentService
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

    setCurrentStudent(student) {
      this.currentStudent = student
    },

    // 可选: 根据 ID 获取单个学生详情并设为 currentStudent
    async fetchAndSetCurrentStudent(courseId, studentId) {
      if (!courseId || !studentId) {
        this.error = '未提供课程或学生ID'
        this.currentStudent = null
        return
      }
      this.isLoading = true
      this.error = null
      try {
        const response = await studentService.fetchStudentDetails(courseId, studentId)
        if (response.data && response.data.student) {
          this.currentStudent = response.data.student
        } else {
          this.currentStudent = null
          this.error = '未找到学生信息'
        }
      } catch (err) {
        this.error = err.response?.data?.message || '获取学生详情失败'
        this.currentStudent = null
        console.error('fetchAndSetCurrentStudent error:', err)
      } finally {
        this.isLoading = false
      }
    },

    async addStudentToCourse(courseId, studentData) {
      if (!courseId) {
        this.addStudentError = '未提供课程ID以添加学生'
        return null
      }
      this.isAddingStudent = true
      this.addStudentError = null
      this.error = null
      try {
        const response = await studentService.addStudentToCourse(courseId, studentData) // 使用 StudentService
        if (response.data && response.data.student) {
          this.students.unshift(response.data.student)
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

    async updateStudentDetails(courseId, studentId, studentDataToUpdate) {
      if (!courseId || !studentId) {
        this.updateError = '未提供课程或学生ID用于更新'
        return false
      }
      this.isUpdating = true
      this.updateError = null
      this.error = null
      try {
        const response = await studentService.updateStudentDetails(
          courseId,
          studentId,
          studentDataToUpdate,
        ) // 使用 StudentService
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

    async deleteStudent(courseId, studentId) {
      // 新增
      if (!courseId || !studentId) {
        this.deleteStudentError = '未提供课程或学生ID用于删除'
        return false
      }
      this.isDeletingStudent = true
      this.deleteStudentError = null
      this.error = null
      try {
        await studentService.deleteStudent(courseId, studentId) // 使用 StudentService
        this.students = this.students.filter((student) => student._id !== studentId)
        if (this.currentStudent && this.currentStudent._id === studentId) {
          this.currentStudent = null
        }
        return true
      } catch (err) {
        this.deleteStudentError = err.response?.data?.message || '删除学生失败'
        console.error('deleteStudent error:', err)
        return false
      } finally {
        this.isDeletingStudent = false
      }
    },

    clearStudents() {
      this.students = []
      this.currentStudent = null
      this.error = null
      this.isLoading = false
    },

    clearStudentErrors() {
      this.error = null
      this.updateError = null
      this.addStudentError = null
      this.deleteStudentError = null
    },
  },
})
