// src/store/feedbackStore.js
import { defineStore } from 'pinia'
import * as feedbackService from '../services/feedbackService' // 导入反馈服务

export const useFeedbackStore = defineStore('feedback', {
  state: () => ({
    feedbackHistory: [],
    isLoadingHistory: false,
    historyError: null,
    isSubmitting: false,
    submissionError: null,
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
        const response = await feedbackService.fetchFeedbackForStudent(courseId, studentId) // 使用 FeedbackService
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
        // 后端 feedbackController 的 addFeedback 期望的字段，确保 feedbackData 结构正确
        const response = await feedbackService.addFeedback(courseId, studentId, feedbackData) // 使用 FeedbackService
        if (response.status === 201 && response.data.feedback) {
          // 提交成功后，可以选择将新反馈添加到 feedbackHistory 的开头，或者重新获取整个列表
          // this.feedbackHistory.unshift(response.data.feedback);
          // 更好的做法是让调用者决定是否刷新列表
          return true
        }
        return false // 或抛出错误
      } catch (err) {
        this.submissionError = err.response?.data?.message || '提交反馈失败'
        console.error('addFeedback error:', err)
        return false
      } finally {
        this.isSubmitting = false
      }
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
