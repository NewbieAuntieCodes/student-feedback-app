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

    async syncCourseWithRoute(courseId, studentId) {
      console.log(
        '[courseStore] syncCourseWithRoute called with courseId:',
        courseId,
        'studentId:',
        studentId,
      ) // 添加日志
      const studentStore = useStudentStore() // 确保已导入 useStudentStore

      if (!courseId) {
        // 如果没有 courseId，清空当前课程和学生
        this.setCurrentCourse(null) // 调用已存在的 setCurrentCourse action
        // studentStore.clearStudentsAndCurrent(); // 或者 studentStore.setCurrentStudent(null);
        return { courseFound: false }
      }

      // 尝试从本地列表查找课程，或者调用 selectCourse 获取最新数据
      // 根据我们之前的讨论，推荐调用 selectCourse 以确保数据是最新的
      await this.selectCourse(courseId) // 调用我们修改过的 selectCourse action

      if (this.currentCourse) {
        // selectCourse 内部应该已经处理了基于 courseId 的学生加载
        // 如果 studentId 也存在，selectCourse 或其调用的 studentStore action 应处理学生选中
        // 这里主要是确保在 selectCourse 完成后，如果 studentId 有值，对应的学生也被选中
        if (studentId) {
          // 确保学生数据已加载（selectCourse应该已经触发）
          // 然后尝试在studentStore中设置当前学生
          // fetchStudentsInCourseAndSetCurrent 应该在找到学生后设置 currentStudent
          await studentStore.fetchStudentsInCourseAndSetCurrent(courseId, studentId)
        }
        return { courseFound: true, course: this.currentCourse }
      } else {
        // 如果 selectCourse 后 this.currentCourse 仍然为 null，说明课程未找到
        this.setCurrentCourse(null) // 确保课程状态被清空
        // studentStore.clearStudentsAndCurrent(); // 确保学生状态也被清空
        return { courseFound: false }
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

    async selectCourse(courseId) {
      const studentStore = useStudentStore() // 确保 useStudentStore 已被正确导入并在 store 外部或顶部定义

      if (!courseId) {
        this.currentCourse = null
        studentStore.clearStudentsAndCurrent() // 清空学生相关状态
        this.error = null // 清除之前的错误
        return
      }

      this.isLoading = true // 开始加载状态
      this.error = null // 清除之前的错误

      try {
        // 调用 courseService 获取单个课程的详细数据
        // 确保 courseService 和 fetchCourseById 方法已正确导入或定义
        const response = await courseService.fetchCourseById(courseId)

        if (response.data && response.data.course) {
          this.currentCourse = response.data.course // 使用从API获取的详细数据更新 currentCourse

          // 可选但推荐：更新本地 courses 列表中的对应课程信息，以保持数据一致性
          const index = this.courses.findIndex((c) => c._id === this.currentCourse._id)
          if (index !== -1) {
            // 使用展开运算符确保响应性，并合并可能已有的本地字段和新的详细字段
            this.courses[index] = { ...this.courses[index], ...this.currentCourse }
          } else {
            // 如果课程不在列表中（例如通过URL直接访问），可以考虑是否要添加到 courses 列表
            // 如果添加，也要注意不要破坏 courses 列表原有的排序或结构
            // this.courses.unshift(this.currentCourse); // 或者 this.courses.push(this.currentCourse);
          }

          // 根据课程状态处理学生加载逻辑
          if (this.currentCourse.status === 'active') {
            // 对于正在上课的课程，获取并设置其下的学生，但不立即选中某个学生
            await studentStore.fetchStudentsInCourseAndSetCurrent(this.currentCourse._id, null)
          } else if (this.currentCourse.status === 'completed') {
            // 对于已完课的课程，清空当前学生列表和选中的学生
            // 学生数据可以设计为按需加载 (例如，当用户在UI中展开已完课课程时)
            studentStore.clearStudentsAndCurrent()
            console.log(
              `已选择已完课课程: ${this.currentCourse.name}。学生列表已清空，可按需加载。`,
            )
          }
        } else {
          // 后端没有返回预期的课程数据
          this.currentCourse = null
          studentStore.clearStudentsAndCurrent()
          this.error = '获取课程详情失败：未找到课程数据。'
          console.warn('selectCourse: No course data in response for ID:', courseId)
        }
      } catch (err) {
        console.error('选择课程并获取详情时出错 (selectCourse action):', err)
        this.currentCourse = null
        studentStore.clearStudentsAndCurrent()
        this.error = err.response?.data?.message || '获取课程详情时发生服务器错误。'
      } finally {
        this.isLoading = false // 结束加载状态
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
      console.log('[courseStore] setCurrentCourse called with:', course) // 添加日志方便调试
      this.currentCourse = course

      // 当课程被清空 (设置为 null) 时，也应该清空当前选中的学生
      if (!course) {
        const studentStore = useStudentStore() // 在 action 内部获取 studentStore 实例
        if (studentStore.currentStudent) {
          // 检查 studentStore.currentStudent 是否真的有值
          console.log('[courseStore] Clearing current student due to course being cleared.')
          studentStore.setCurrentStudent(null) // 确保 studentStore 中有这个 action
        }
      }
    },

    // ... (createCourse, updateCourse, deleteCourse actions 保持不变或微调)
    async createCourse(courseData) {
      this.isCreatingCourse = true
      this.createCourseError = null
      try {
        const response = await courseService.createCourse(courseData)
        console.log(
          '[courseStore createCourse] API Response:',
          JSON.parse(JSON.stringify(response.data)),
        ) // 查看后端返回的原始数据
        if (response.data && response.data.course) {
          const newCourseData = response.data.course
          console.log(
            '[courseStore createCourse] Raw newCourse from backend:',
            JSON.parse(JSON.stringify(newCourseData)),
          )

          // 确保 status 字段存在且为 'active'
          const newCourse = { ...newCourseData }
          if (!newCourse.status) {
            newCourse.status = 'active' // 手动设置，如果后端没给
            console.warn(
              `[courseStore createCourse] newCourse status was missing or falsy, defaulted to 'active'. Original status:`,
              newCourseData.status,
            )
          } else if (newCourse.status !== 'active') {
            console.warn(
              `[courseStore createCourse] newCourse from backend has status '${newCourse.status}', not 'active'. It might not appear in '正在上课'.`,
            )
          }

          this.courses.unshift(newCourse)
          console.log(
            '[courseStore createCourse] courses state after unshift:',
            JSON.parse(JSON.stringify(this.courses)),
          )
          console.log(
            '[courseStore createCourse] activeCourses getter after unshift:',
            JSON.parse(JSON.stringify(this.activeCourses)),
          ) // 检查 activeCourses getter
          // 尝试取消注释下一行
          // await this.selectCourse(newCourse._id);
          // console.log('[courseStore createCourse] Called selectCourse for new course.');
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
