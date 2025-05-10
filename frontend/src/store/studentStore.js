// frontend/src/store/studentStore.js
import { defineStore } from 'pinia'
import * as studentService from '../services/studentService'

export const useStudentStore = defineStore('student', {
  state: () => ({
    students: [],
    currentStudent: null,
    isLoading: false,
    error: null,
    // ... (其他状态保持不变)
    isUpdating: false,
    updateError: null,
    isAddingStudent: false,
    addStudentError: null,
    isDeletingStudent: false,
    deleteStudentError: null,
  }),
  getters: {
    studentsInCurrentCourse: (state) => state.students,
    selectedStudent: (state) => state.currentStudent,
  },
  actions: {
    // 用于根据路由参数或课程选择来加载学生并设置当前学生
    async fetchStudentsInCourseAndSetCurrent(courseId, studentIdToSelect = null) {
      if (!courseId) {
        this.students = []
        this.currentStudent = null
        this.error = '未提供课程ID'
        return
      }
      this.isLoading = true
      this.error = null
      try {
        const response = await studentService.fetchStudentsInCourse(courseId)
        if (response.data && response.data.students) {
          this.students = response.data.students
          if (studentIdToSelect && this.students.some((s) => s._id === studentIdToSelect)) {
            this.currentStudent = this.students.find((s) => s._id === studentIdToSelect) || null
          } else {
            this.currentStudent = null // 如果学生ID无效或未提供，则不选择任何学生
          }
        } else {
          this.students = []
          this.currentStudent = null
        }
      } catch (err) {
        this.error = err.response?.data?.message || '获取学生列表失败'
        this.students = []
        this.currentStudent = null
        console.error('fetchStudentsInCourseAndSetCurrent error:', err)
      } finally {
        this.isLoading = false
      }
    },

    setCurrentStudent(student) {
      this.currentStudent = student
    },

    clearStudentsAndCurrent() {
      this.students = []
      this.currentStudent = null
      this.error = null // 也清除错误状态
      this.isLoading = false
    },
    clearStudents() {
      // 保留旧的，如果其他地方只希望清空列表而不影响当前学生
      this.students = []
      // this.currentStudent = null
      this.error = null
      this.isLoading = false
    },

    // ... (addStudentToCourse, updateStudentDetails, deleteStudent actions 保持不变或微调)
    async addStudentToCourse(courseId, studentData) {
      if (!courseId) {
        this.addStudentError = '未提供课程ID以添加学生'
        return null
      }
      this.isAddingStudent = true
      this.addStudentError = null
      try {
        const response = await studentService.addStudentToCourse(courseId, studentData)
        if (response.data && response.data.student) {
          this.students.unshift(response.data.student) // 添加到列表顶部
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
      try {
        const response = await studentService.updateStudentDetails(
          courseId,
          studentId,
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
          return updatedStudent // 返回更新后的学生对象
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
      if (!courseId || !studentId) {
        this.deleteStudentError = '未提供课程或学生ID用于删除'
        return false
      }
      this.isDeletingStudent = true
      this.deleteStudentError = null
      try {
        await studentService.deleteStudent(courseId, studentId)
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
    clearStudentErrors() {
      this.error = null
      this.updateError = null
      this.addStudentError = null
      this.deleteStudentError = null
    },
  },
})
