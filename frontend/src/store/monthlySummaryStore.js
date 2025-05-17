import { defineStore } from 'pinia'
import * as monthlySummaryService from '../services/monthlySummaryService'
import { useAuthStore } from './authStore' // 用于获取当前用户（老师）信息
import { useCourseStore } from './courseStore' // 用于获取当前课程名称
import { useStudentStore } from './studentStore' // 用于获取当前学生姓名
import dayjs from 'dayjs'

export const useMonthlySummaryStore = defineStore('monthlySummary', {
  state: () => ({
    currentSummary: null, // 当前查看或编辑的月度总结
    summaryHistory: [], // 月度总结历史记录
    isLoadingSummary: false,
    isLoadingHistory: false,
    summaryError: null,
    historyError: null,
    isUpdatingSummary: false,
    updateSummaryError: null,
    isDeletingSummary: false, // 新增
    deleteSummaryError: null, // 新增
    isGeneratingSummary: false, // 新增 (如果选择后端生成)
    generateSummaryError: null, // 新增 (如果选择后端生成)
  }),
  getters: {
    // 如果需要，可以添加 getters
    activeSummary: (state) => state.currentSummary,
    historicalSummaries: (state) => state.summaryHistory,
  },
  actions: {
    /**
     * 获取或初始化指定年月的月度总结。
     * 如果后端返回 null (表示当月无总结)，则会根据当前用户信息和课程信息构建一个默认的空总结对象。
     */
    async fetchOrInitializeMonthlySummary(courseId, studentId, year, month) {
      console.log('[monthlySummaryStore fetchOrInitialize] Received:', {
        courseId,
        studentId,
        year,
        month,
      })
      if (!courseId || !studentId || !year || !month) {
        this.summaryError = '获取月度总结缺少必要的参数'
        this.currentSummary = null
        console.error('[monthlySummaryStore fetchOrInitialize] Invalid params:', {
          courseId,
          studentId,
          year,
          month,
        })
        return
      }
      this.isLoadingSummary = true
      this.summaryError = null
      try {
        const response = await monthlySummaryService.fetchMonthlySummary(
          courseId,
          studentId,
          year,
          month,
        )
        if (response.data && response.data.summary) {
          this.currentSummary = response.data.summary
        } else if (response.data && response.data.summary === null) {
          // 后端明确返回了当月无总结，但提供了默认信息
          const authStore = useAuthStore()
          const courseStore = useCourseStore()
          // studentStore 用于获取学生姓名，但后端返回的默认结构已包含 studentId
          // const studentStore = useStudentStore();

          this.currentSummary = {
            _id: null, // 表示这是一个新的、未保存的总结
            student: studentId,
            course: courseId,
            user: authStore.currentUser?._id || '',
            summaryDate: `${year}-${String(month).padStart(2, '0')}`,
            teacherName: authStore.currentUser?.username || 'N/A',
            subjectName: courseStore.selectedCourse?.name || 'N/A',
            teachingContentCombined: response.data.teachingContentCombined || '',
            courseProgress: response.data.courseProgress || '如期',
            progressMadeCombined: response.data.progressMadeCombined || '',
            areasForImprovementCombined: response.data.areasForImprovementCombined || '',
            improvementPlanCombined: response.data.improvementPlanCombined || '',
            followUpContent: response.data.followUpContent || '',
            createdAt: null,
            updatedAt: null,
          }
        } else {
          this.currentSummary = null // 其他未知情况
        }
      } catch (err) {
        this.summaryError = err.response?.data?.message || '加载月度总结失败'
        this.currentSummary = null
        console.error('fetchOrInitializeMonthlySummary error:', err)
      } finally {
        this.isLoadingSummary = false
      }
    },

    async fetchSummaryHistory(courseId, studentId) {
      console.log('[monthlySummaryStore fetchSummaryHistory] Received:', { courseId, studentId })
      if (!courseId || !studentId) {
        this.historyError = '获取历史记录缺少必要的参数'
        this.summaryHistory = []
        console.error('[monthlySummaryStore fetchSummaryHistory] Invalid params:', {
          courseId,
          studentId,
        })
        return
      }
      this.isLoadingHistory = true
      this.historyError = null
      try {
        const response = await monthlySummaryService.fetchMonthlySummaryHistory(courseId, studentId)
        if (response.data && response.data.history) {
          this.summaryHistory = response.data.history
        } else {
          this.summaryHistory = []
        }
      } catch (err) {
        this.historyError = err.response?.data?.message || '加载月度总结历史失败'
        this.summaryHistory = []
        console.error('fetchSummaryHistory error:', err)
      } finally {
        this.isLoadingHistory = false
      }
    },

    async saveCurrentUserModifiedSummary(summaryDataToSave) {
      if (!this.currentSummary || !this.currentSummary.student || !this.currentSummary.course) {
        this.updateSummaryError = '没有有效的当前总结以供保存，或缺少学生/课程信息'
        return false
      }
      // 如果是全新的总结 (没有 _id)，我们不能直接调用 update API。
      // 后端目前的设计是反馈触发总结的创建/更新，用户手动修改是针对已存在的总结。
      // 或者，我们可以调整后端，如果PUT请求的ID是特定值（如'new'），则尝试创建。
      // 目前简化：假设用户修改的总是已存在的总结（即至少被反馈触发过一次）。
      // 如果 currentSummary._id 为 null，意味着这是前端构建的临时对象，后端尚不存在。
      // 这种情况下，提交操作应该由后端通过反馈自动创建。
      // 用户手动保存，应针对有 _id 的总结。
      if (!this.currentSummary._id) {
        // 理论上，如果用户能编辑，那么这个总结应该至少在后端被反馈触发过一次。
        // 但如果UI允许在没有后端记录的情况下编辑（例如，基于fetchOrInitializeMonthlySummary的空壳），
        // 那么这里需要一个创建逻辑，或者引导用户先通过提交反馈来生成。
        // 为简单起见，我们假设用户修改的总结一定有ID。
        // 如果后端 getMonthlySummary 在没有记录时返回的是一个包含默认值的对象（不含_id），
        // 那么前端的MonthlySummaryTabPage应该在提交前确保这不是一个 "新" 对象，
        // 或者，如果允许用户直接创建空月份的总结，就需要一个POST的API。
        // 根据当前后端设计，用户修改是PUT，所以必须有summaryId
        console.warn('尝试保存一个没有ID的月度总结。这通常意味着它尚未被后端创建。')
        this.updateSummaryError = '无法保存新的月度总结，请确保当月至少有一条反馈。'
        // return false; // 或者，根据您的业务逻辑调整。
        // 这里我们允许尝试提交，如果后端没有对应的summaryId会404
      }

      this.isUpdatingSummary = true
      this.updateSummaryError = null
      try {
        const { course, student, _id: summaryId } = this.currentSummary
        // 从 summaryDataToSave 中提取允许用户修改的字段
        const payload = {
          courseProgress: summaryDataToSave.courseProgress,
          followUpContent: summaryDataToSave.followUpContent,
          // 如果允许用户修改累加的字段
          teachingContentCombined: summaryDataToSave.teachingContentCombined,
          progressMadeCombined: summaryDataToSave.progressMadeCombined,
          areasForImprovementCombined: summaryDataToSave.areasForImprovementCombined,
          improvementPlanCombined: summaryDataToSave.improvementPlanCombined,
        }

        const response = await monthlySummaryService.updateUserModifiedSummary(
          course, // courseId
          student, // studentId
          summaryId,
          payload,
        )

        if (response.data && response.data.summary) {
          this.currentSummary = response.data.summary // 更新当前总结
          // 可选：如果历史记录也显示当前月份，可能需要更新历史记录中的对应项
          const indexInHistory = this.summaryHistory.findIndex((s) => s._id === summaryId)
          if (indexInHistory !== -1) {
            this.summaryHistory[indexInHistory] = response.data.summary
          }
          return true
        }
        return false
      } catch (err) {
        this.updateSummaryError = err.response?.data?.message || '更新月度总结失败'
        console.error('saveCurrentUserModifiedSummary error:', err)
        return false
      } finally {
        this.isUpdatingSummary = false
      }
    },

    /**
     * 当新的反馈被添加或反馈被删除后，调用此方法来刷新当前月份的总结。
     */
    async refreshCurrentMonthSummaryForFeedbackChange(courseId, studentId, feedbackDate) {
      if (!courseId || !studentId || !feedbackDate) return
      const date = dayjs(feedbackDate)
      const year = date.year()
      const month = date.month() + 1 // dayjs month is 0-indexed
      await this.fetchOrInitializeMonthlySummary(courseId, studentId, year, month)
    },

    async deleteMonthlySummary(courseId, studentId, summaryId) {
      if (!courseId || !studentId || !summaryId) {
        this.deleteSummaryError = '删除月度总结缺少必要的ID'
        return false
      }
      this.isDeletingSummary = true
      this.deleteSummaryError = null
      try {
        await monthlySummaryService.deleteMonthlySummary(courseId, studentId, summaryId)
        // 从历史记录中移除
        this.summaryHistory = this.summaryHistory.filter((s) => s._id !== summaryId)
        // 如果删除的是当前正在查看的总结，则清空它
        if (this.currentSummary && this.currentSummary._id === summaryId) {
          this.currentSummary = null
        }
        return true
      } catch (err) {
        this.deleteSummaryError = err.response?.data?.message || '删除月度总结失败'
        console.error('deleteMonthlySummary action error:', err)
        return false
      } finally {
        this.isDeletingSummary = false
      }
    },

    // (可选) 如果选择后端生成总结内容
    async generateMonthlySummary(courseId, studentId, year, month) {
      if (!courseId || !studentId || !year || !month) {
        this.generateSummaryError = '生成总结缺少必要的参数'
        return null
      }
      this.isGeneratingSummary = true
      this.generateSummaryError = null
      try {
        const response = await monthlySummaryService.generateSummaryContent(
          courseId,
          studentId,
          year,
          month,
        )
        if (response.data && response.data.generatedSummary) {
          // 返回生成的数据，让组件去填充表单
          return response.data.generatedSummary
        }
        this.generateSummaryError = response.data?.message || '生成总结内容失败，但未返回具体错误。'
        return null
      } catch (err) {
        this.generateSummaryError = err.response?.data?.message || '生成总结内容请求失败'
        console.error('generateMonthlySummary action error:', err)
        return null
      } finally {
        this.isGeneratingSummary = false
      }
    },

    clearCurrentSummary() {
      this.currentSummary = null
      this.summaryError = null
    },
    clearSummaryHistory() {
      this.summaryHistory = []
      this.historyError = null
    },
    clearAllSummaryErrors() {
      this.summaryError = null
      this.historyError = null
      this.updateSummaryError = null
      this.deleteSummaryError = null // 新增
      this.generateSummaryError = null // 新增
    },
  },
})
