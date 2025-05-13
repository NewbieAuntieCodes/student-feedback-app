// frontend/src/store/studentStore.js
import { defineStore } from 'pinia'
import * as studentService from '../services/studentService'

export const useStudentStore = defineStore('student', {
  state: () => ({
    // students: [], // 旧的：只存储当前课程的学生
    allStudentsByCourse: {}, // 新的：以 courseId 为键，存储每个课程的学生数组
    // 例如: { 'courseId1': [studentA, studentB], 'courseId2': [studentC] }
    currentStudent: null,
    isLoading: false, // 用于加载单个课程的学生
    isLoadingAllActive: false, // 用于批量加载 active 课程的学生
    error: null,
    isUpdating: false,
    updateError: null,
    isAddingStudent: false,
    addStudentError: null,
    isDeletingStudent: false,
    deleteStudentError: null,
  }),
  getters: {
    studentsInCourse: (state) => (courseId) => {
      return state.allStudentsByCourse[courseId] || [] // <--- 关键在这里，如果找不到，返回空数组
    },
    selectedStudent: (state) => state.currentStudent,
    // 可以保留一个基于 currentCourse (如果 courseStore 还维护它) 的 getter，或者让组件直接用 getStudentsByCourseId
    // studentsInCurrentSelectedCourse: (state) => {
    //   const courseStore = useCourseStore(); // 需要在 getter 内部获取，但要注意循环依赖风险和性能
    //   if (courseStore.selectedCourse?._id) {
    //     return state.allStudentsByCourse[courseStore.selectedCourse._id] || [];
    //   }
    //   return [];
    // }
  },
  actions: {
    // 新增 Action: 批量获取指定课程列表的学生
    async fetchAllStudentsForCourses(courseIds) {
      if (!courseIds || courseIds.length === 0) return
      this.isLoadingAllActive = true
      this.error = null // 可以用一个特定的 error for batch loading
      try {
        // 并行获取所有这些课程的学生
        const promises = courseIds.map((courseId) =>
          studentService
            .fetchStudentsInCourse(courseId)
            .then((response) => ({ courseId, students: response.data?.students || [] }))
            .catch((err) => {
              console.error(`Failed to fetch students for course ${courseId}:`, err)
              return { courseId, students: [] } // 出错时返回空数组
            }),
        )
        const results = await Promise.all(promises)

        results.forEach((result) => {
          this.allStudentsByCourse[result.courseId] = result.students
        })
      } catch (err) {
        // 这个 catch 主要用于 Promise.all 本身的错误，单个请求的错误在上面已处理
        this.error = '批量获取学生列表时发生错误'
        console.error('fetchAllStudentsForCourses error:', err)
      } finally {
        this.isLoadingAllActive = false
      }
    },

    // 修改: 用于加载特定课程的学生（可以是 active 或按需加载的 completed）并设置当前学生
    async fetchStudentsInCourseAndSetCurrent(courseId, studentIdToSelect = null) {
      if (!courseId) {
        // this.students = []; // 不再直接修改旧的 students
        this.allStudentsByCourse[courseId] = [] // 确保该课程的列表存在且为空
        this.currentStudent = null
        this.error = '未提供课程ID'
        return
      }
      this.isLoading = true // 表示正在加载这个特定课程的学生
      this.error = null
      try {
        const response = await studentService.fetchStudentsInCourse(courseId)
        if (response.data && response.data.students) {
          this.allStudentsByCourse[courseId] = response.data.students // 存入新的 state 结构

          if (
            studentIdToSelect &&
            this.allStudentsByCourse[courseId].some((s) => s._id === studentIdToSelect)
          ) {
            this.currentStudent =
              this.allStudentsByCourse[courseId].find((s) => s._id === studentIdToSelect) || null
          } else {
            this.currentStudent = null
          }
        } else {
          this.allStudentsByCourse[courseId] = []
          this.currentStudent = null
        }
      } catch (err) {
        this.error = err.response?.data?.message || `获取课程 ${courseId} 的学生列表失败`
        this.allStudentsByCourse[courseId] = []
        this.currentStudent = null
        console.error(`WorkspaceStudentsInCourseAndSetCurrent for course ${courseId} error:`, err)
      } finally {
        this.isLoading = false
      }
    },

    setCurrentStudent(student) {
      this.currentStudent = student
    },

    clearStudentsAndCurrent() {
      // this.students = []; // 不再使用
      // 当课程选择被清除时，我们可能不需要清空 allStudentsByCourse，因为那些数据可能仍然有用
      // 除非是登出等场景。这里主要清空当前选中的学生。
      this.currentStudent = null
      // this.error = null; // 根据需要清除
      // this.isLoading = false;
    },

    // 新增 Action: 当课程被删除时，从 state 中移除该课程的学生数据
    removeStudentsForCourse(courseId) {
      if (this.allStudentsByCourse[courseId]) {
        delete this.allStudentsByCourse[courseId]
      }
      if (this.currentStudent && this.currentStudent.course === courseId) {
        // 假设学生对象有 course 属性
        this.currentStudent = null
      }
    },

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
          const newStudent = response.data.student
          if (!this.allStudentsByCourse[courseId]) {
            this.allStudentsByCourse[courseId] = []
          }
          this.allStudentsByCourse[courseId].unshift(newStudent)
          return newStudent
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
      // ... (逻辑类似，但要更新 allStudentsByCourse[courseId] 中的学生)
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
          if (this.allStudentsByCourse[courseId]) {
            const indexInList = this.allStudentsByCourse[courseId].findIndex(
              (s) => s._id === updatedStudent._id,
            )
            if (indexInList !== -1) {
              this.allStudentsByCourse[courseId][indexInList] = {
                ...this.allStudentsByCourse[courseId][indexInList],
                ...updatedStudent,
              }
            }
          }
          if (this.currentStudent && this.currentStudent._id === updatedStudent._id) {
            this.currentStudent = { ...this.currentStudent, ...updatedStudent }
          }
          return updatedStudent
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
      // ... (逻辑类似，从 allStudentsByCourse[courseId] 中移除学生)
      if (!courseId || !studentId) {
        this.deleteStudentError = '未提供课程或学生ID用于删除'
        return false
      }
      this.isDeletingStudent = true
      this.deleteStudentError = null
      try {
        await studentService.deleteStudent(courseId, studentId)
        if (this.allStudentsByCourse[courseId]) {
          this.allStudentsByCourse[courseId] = this.allStudentsByCourse[courseId].filter(
            (student) => student._id !== studentId,
          )
        }
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
