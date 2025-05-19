// src/store/feedbackStore.js
import { defineStore } from 'pinia'
import * as feedbackService from '../services/feedbackService' // 导入反馈服务
// REMOVED: import { useMonthlySummaryStore } from './monthlySummaryStore'

export const useFeedbackStore = defineStore('feedback', {
  state: () => ({
    feedbackHistory: [],
    isLoadingHistory: false,
    historyError: null,
    isSubmitting: false,
    submissionError: null,
    isDeleting: false,
    deleteError: null,
  }),
  actions: {
    async fetchFeedbackForStudent(courseId, studentId) {
      if (!courseId || !studentId) {
        this.historyError = '未提供课程或学生ID'
        this.feedbackHistory = []
        return
      }
      this.isLoadingHistory = true
      this.historyError = null
      try {
        const response = await feedbackService.fetchFeedbackForStudent(courseId, studentId)
        if (response.data && response.data.feedback) {
          this.feedbackHistory = response.data.feedback
        } else {
          this.feedbackHistory = []
        }
      } catch (err) {
        this.historyError = err.response?.data?.message || '加载历史反馈失败'
        this.feedbackHistory = []
        console.error('fetchFeedbackForStudent error:', err)
      } finally {
        this.isLoadingHistory = false
      }
    },

    async addFeedback(courseId, studentId, feedbackData) {
      if (!courseId || !studentId) {
        this.submissionError = '未提供课程或学生ID'
        return false
      }
      this.isSubmitting = true
      this.submissionError = null
      try {
        const response = await feedbackService.addFeedback(courseId, studentId, feedbackData)
        if (response.status === 201 && response.data.feedback) {
          // const savedFeedback = response.data.feedback // No longer needed here for monthly summary
          // 刷新反馈历史列表的操作通常在调用此 action 的组件中处理，例如重新 fetch
          // 或者如果需要立即更新当前列表：
          // this.feedbackHistory.unshift(savedFeedback);

          // --- 修改: 移除了添加反馈成功后，通知月度总结更新的逻辑 ---
          // 原代码:
          // if (savedFeedback.feedbackDate) {
          //   const monthlySummaryStore = useMonthlySummaryStore()
          //   await monthlySummaryStore.refreshCurrentMonthSummaryForFeedbackChange(
          //     courseId,
          //     studentId,
          //     savedFeedback.feedbackDate,
          //   )
          // }
          // --- 修改结束 ---
          return true
        }
        return false
      } catch (err) {
        this.submissionError = err.response?.data?.message || '提交反馈失败'
        console.error('addFeedback error:', err)
        return false
      } finally {
        this.isSubmitting = false
      }
    },

    async deleteFeedback(courseId, studentId, feedbackId) {
      if (!courseId || !studentId || !feedbackId) {
        this.deleteError = '删除反馈时缺少必要的ID信息'
        return false
      }
      this.isDeleting = true
      this.deleteError = null

      try {
        // --- 修改: 移除了在删除前获取要删除的反馈日期的逻辑 ---
        // 原代码:
        // const feedbackToDelete = this.feedbackHistory.find((fb) => fb._id === feedbackId)
        // const feedbackDateOfDeleted = feedbackToDelete ? feedbackToDelete.feedbackDate : null
        // --- 修改结束 ---

        await feedbackService.deleteFeedback(courseId, studentId, feedbackId)
        this.feedbackHistory = this.feedbackHistory.filter((fb) => fb._id !== feedbackId)

        // --- 修改: 移除了删除反馈成功后，通知月度总结更新的逻辑 ---
        // 原代码:
        // if (feedbackDateOfDeleted) {
        //   const monthlySummaryStore = useMonthlySummaryStore()
        //   await monthlySummaryStore.refreshCurrentMonthSummaryForFeedbackChange(
        //     courseId,
        //     studentId,
        //     feedbackDateOfDeleted,
        //   )
        // }
        // --- 修改结束 ---
        return true
      } catch (err) {
        this.deleteError = err.response?.data?.message || '删除反馈记录失败'
        console.error('deleteFeedback action error:', err)
        return false
      } finally {
        this.isDeleting = false
      }
    },

    clearErrors() {
      this.historyError = null
      this.submissionError = null
      this.deleteError = null
    },

    clearHistory() {
      this.feedbackHistory = []
      this.historyError = null
    },

    clearSubmissionError() {
      this.submissionError = null
    },
  },
})
