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

    // 新增 Getter: 获取所有“正在上课”的课程
    activeCourses: (state) => {
      return state.courses.filter((course) => course.status === 'active')
    },

    // 新增 Getter: 获取所有“已完课”的课程
    completedCourses: (state) => {
      return state.courses.filter((course) => course.status === 'completed')
    },
  },
  actions: {
    async fetchUserCourses(options = { loadStudentsForActive: false }) {
      // 新增 options 参数
      this.isLoading = true
      this.error = null
      try {
        const response = await courseService.fetchUserCourses()
        if (response.data && response.data.courses) {
          // 假设后端返回的每个 course 对象已经包含了 status 字段
          this.courses = response.data.courses

          // 新增逻辑：如果需要，在获取所有课程后，触发加载“正在上课”课程的学生
          if (options.loadStudentsForActive) {
            const studentStore = useStudentStore()
            // 使用 activeCourses getter 获取正在上课的课程列表
            // 注意：在 action 内部直接使用 this.activeCourses 可能因为 Pinia 的代理机制而略有不同，
            // 更安全的方式是直接从 this.courses 筛选
            const activeCoursesList = this.courses.filter((c) => c.status === 'active')
            if (activeCoursesList.length > 0) {
              await studentStore.fetchAllStudentsForCourses(activeCoursesList.map((c) => c._id))
            }
          }
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
      // 如果课程列表为空，先尝试获取所有课程（这在初始加载时很重要）
      if (this.courses.length === 0 && courseId) {
        // 增加 courseId 判断，避免不必要的加载
        await this.fetchUserCourses({ loadStudentsForActive: false }) // 此时通常不需要重复加载学生
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
        // 当用户从UI选择课程时，根据课程状态决定如何加载学生
        if (course.status === 'active') {
          // 如果是正在上课的课程，其学生应该已经在 fetchAllStudentsForCourses 中加载过了
          // 或者如果还没有，这里可以确保加载
          // 但通常我们期望 AppLayout 初始化时已经批量加载了 active 课程的学生
          // 这里可能只需要 studentStore.setCurrentCourseStudents(courseId) 来设置 students 列表
          // 而不是再次 fetch。
          // 为简单起见，这里假设学生数据可能需要按需加载或已存在
          await studentStore.fetchStudentsInCourseAndSetCurrent(courseId, null) // 选中课程，但不立即选学生
        } else if (course.status === 'completed') {
          // 如果是已完课的课程，通常是懒加载，
          // 这里可以先不加载学生，等用户在 AppSidebar 展开时再加载
          // 或者，如果 AppSidebar 设计为点击课程就加载，那么这里也需要加载
          studentStore.clearStudentsAndCurrent() // 清空学生，等待用户操作
          console.log(`已选择已完课课程 ${course.name}，学生数据将按需加载。`)
        }
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
          // 新创建的课程默认是 active，将其添加到列表顶部
          const newCourse = response.data.course
          this.courses.unshift(newCourse)
          // 自动选中新创建的课程，并加载其学生
          // await this.selectCourse(newCourse._id); // 或者你希望有不同的行为
          return newCourse
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
          // 如果课程状态从 active 变为 completed，可能需要从 studentStore.allStudentsByCourse 中移除其学生
          // 或者从 completed 变为 active，则需要加载其学生（如果 studentStore 的逻辑需要）
          // 这部分联动逻辑可以根据具体需求细化
          return updatedCourse
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
          studentStore.clearStudentsAndCurrent() // 清空学生
          studentStore.removeStudentsForCourse(courseId) // 告诉 studentStore 该课程的学生也没了
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
