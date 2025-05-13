import { defineStore } from 'pinia'
import * as studentService from '../services/studentService'
import { useCourseStore } from './courseStore' // <--- 确保这行是取消注释的

export const useStudentStore = defineStore('student', {
  state: () => ({
    allStudentsByCourse: {},
    currentStudent: null,
    isLoading: false,
    isLoadingAllActive: false,
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
      return state.allStudentsByCourse[courseId] || []
    },
    selectedStudent: (state) => state.currentStudent,
    studentsInCurrentCourse: (state) => {
      const courseStore = useCourseStore()
      if (courseStore.selectedCourse && courseStore.selectedCourse._id) {
        return state.allStudentsByCourse[courseStore.selectedCourse._id] || []
      }
      return []
    }, // 注意：你之前代码的这个 getter 最后多了一个逗号，在对象最后一个属性/方法后，逗号是可选的，但有些严格的linter可能会提示。这里保持原样。
  },
  actions: {
    async fetchAllStudentsForCourses(courseIds) {
      if (!courseIds || courseIds.length === 0) return
      this.isLoadingAllActive = true
      this.error = null
      try {
        const promises = courseIds.map((courseId) =>
          studentService
            .fetchStudentsInCourse(courseId)
            .then((response) => ({ courseId, students: response.data?.students || [] }))
            .catch((err) => {
              console.error(`Failed to fetch students for course ${courseId}:`, err)
              return { courseId, students: [] }
            }),
        )
        const results = await Promise.all(promises)
        results.forEach((result) => {
          this.allStudentsByCourse[result.courseId] = result.students
        })
      } catch (err) {
        this.error = '批量获取学生列表时发生错误'
        console.error('fetchAllStudentsForCourses error:', err)
      } finally {
        this.isLoadingAllActive = false
      }
    },
    async fetchStudentsInCourseAndSetCurrent(courseId, studentIdToSelect = null) {
      if (!courseId) {
        this.allStudentsByCourse[courseId] = []
        this.currentStudent = null
        this.error = '未提供课程ID'
        return
      }
      this.isLoading = true
      this.error = null
      try {
        const response = await studentService.fetchStudentsInCourse(courseId)
        if (response.data && response.data.students) {
          this.allStudentsByCourse[courseId] = response.data.students
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
      console.log('[studentStore] setCurrentStudent called with:', student)
      this.currentStudent = student
    },

    // clearStudentsAndCurrent() {
    //   this.students = [] // 或者 this.allStudentsByCourse = {} 等具体实现
    //   this.currentStudent = null
    //   this.isLoading = false // 重置加载状态
    //   this.error = null
    // },

    clearStudentsAndCurrent() {
      // 如果你有按课程ID存储学生的对象
      if (this.allStudentsByCourse) {
        // 假设你的state属性叫这个
        // 如果你希望保留空课程的键，但清空学生数组
        // for (const courseIdKey in this.allStudentsByCourse) {
        //     this.allStudentsByCourse[courseIdKey] = [];
        // }
        // 或者完全清空（如果下次需要重新构建）
        this.allStudentsByCourse = {}
      }
      // 如果你有一个独立的扁平学生列表（不推荐与按课程组织的同时使用）
      if (this.students) {
        // 假设你的state属性叫这个
        this.students = []
      }
      this.currentStudent = null
      this.isLoading = false
      this.error = null
      console.log('[studentStore] Cleared current student and relevant student lists.')
    },

    removeStudentsForCourse(courseId) {
      if (this.allStudentsByCourse && this.allStudentsByCourse[courseId]) {
        delete this.allStudentsByCourse[courseId]
      }
      if (this.currentStudent && this.currentStudent.course === courseId) {
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
            } else {
              console.warn(
                `[studentStore] Student with ID ${updatedStudent._id} was updated but not found in local list for course ${courseId}. Adding it.`,
              )
              if (!this.allStudentsByCourse[courseId]) {
                this.allStudentsByCourse[courseId] = []
              }
              this.allStudentsByCourse[courseId].push(updatedStudent)
            }
          } else {
            console.warn(
              `[studentStore] Course with ID ${courseId} not found in allStudentsByCourse during student update. Creating entry and adding student.`,
            )
            this.allStudentsByCourse[courseId] = [updatedStudent]
          }
          if (this.currentStudent && this.currentStudent._id === updatedStudent._id) {
            this.currentStudent = { ...this.currentStudent, ...updatedStudent }
          }
          if (response.data.updatedCourse) {
            const courseStore = useCourseStore()
            console.log(
              '[studentStore] Received updated course from backend after student update:',
              response.data.updatedCourse,
            )
            await courseStore.updateCourse(
              response.data.updatedCourse._id,
              response.data.updatedCourse,
            )
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
      console.log(
        '[studentStore deleteStudent] Received for service call - courseId:',
        courseId,
        'studentId:',
        studentId,
      )
      if (!courseId || !studentId) {
        // this.deleteStudentError = '未提供课程或学生ID用于删除'
        this.error = '删除学生时缺少课程ID或学生ID。'
        console.error(
          '[studentStore deleteStudent] Missing courseId or studentId:',
          courseId,
          studentId,
        ) // 【建议添加日志】
        return false
      }
      // this.isDeletingStudent = true
      // this.deleteStudentError = null
      this.isLoading = true
      this.error = null
      try {
        console.log(
          `[studentStore deleteStudent] Attempting to delete student ${studentId} from course ${courseId}`,
        ) // 【建议添加日志】
        await studentService.deleteStudent(courseId, studentId)
        // 从 allStudentsByCourse 中移除学生
        if (this.allStudentsByCourse && this.allStudentsByCourse[courseId]) {
          this.allStudentsByCourse[courseId] = this.allStudentsByCourse[courseId].filter(
            (student) => student._id !== studentId,
          )
        }
        // 如果删除的是当前选中的学生，则清空
        if (this.currentStudent && this.currentStudent._id === studentId) {
          this.currentStudent = null
          // 如果清空了当前学生，可能也需要通知 courseStore 当前没有学生选中
          // 或者 AppInfoPanel 会自动根据 studentStore.currentStudent === null 来调整显示
        }

        // 如果您还有一个扁平的、全局的 students 列表 (不推荐与 allStudentsByCourse 同时使用，除非有特殊原因)
        // this.students = this.students.filter(student => student._id !== studentId);

        console.log(`Student ${studentId} from course ${courseId} deleted successfully from store.`)
        return true
      } catch (err) {
        // this.deleteStudentError = err.response?.data?.message || '删除学生失败'
        this.error = err.response?.data?.message || '删除学生失败'
        console.error('deleteStudent action error:', err)
        return false
      } finally {
        // this.isDeletingStudent = false
        this.isLoading = false // 或者 isDeletingStudent = false
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
