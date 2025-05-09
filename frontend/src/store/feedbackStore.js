// src/store/feedbackStore.js
import { defineStore } from 'pinia'
import axios from 'axios'

// API 基础路径 /api/courses/:courseId/students/:studentId/feedback
const API_COURSES_BASE_URL = 'http://localhost:3001/api/courses' // 确保端口正确

export const useFeedbackStore = defineStore('feedback', {
  state: () => ({
    feedbackHistory: [], // 存储某个学生的历史反馈
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
        const response = await axios.get(
          `${API_COURSES_BASE_URL}/${courseId}/students/${studentId}/feedback`,
        )
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
        // 后端 feedbackController 的 addFeedback 期望的字段
        const payload = {
          feedbackDate: feedbackData.feedbackDate,
          classTime: feedbackData.classTime,
          lastHomeworkStatus: feedbackData.lastHomeworkStatus,
          teachingContent: feedbackData.teachingContent,
          classPerformance: feedbackData.classPerformance,
          progressMade: feedbackData.progressMade,
          areasForImprovement: feedbackData.areasForImprovement,
          punctuality: feedbackData.punctuality,
          extrapolationAbility: feedbackData.extrapolationAbility,
        }
        const response = await axios.post(
          `${API_COURSES_BASE_URL}/${courseId}/students/${studentId}/feedback`,
          payload,
        )
        if (response.status === 201 && response.data.feedback) {
          // 提交成功后，可以选择将新反馈添加到 feedbackHistory 的开头，或者重新获取整个列表
          // this.feedbackHistory.unshift(response.data.feedback); // 如果想立即更新UI
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

    clearHistory() {
      this.feedbackHistory = []
      this.historyError = null
    },
  },
})
