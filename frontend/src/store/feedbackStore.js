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

    async deleteFeedback(courseId, studentId, feedbackId) {
      if (!courseId || !studentId || !feedbackId) {
        this.deleteError = '删除反馈时缺少必要的ID信息'
        // 或者 this.error = '...'; // 如果你用一个通用的 error state
        return false
      }
      this.isDeleting = true
      this.deleteError = null
      // this.error = null; // 如果用通用 error state

      try {
        // 【重要】调用 feedbackService 中的 deleteFeedback 方法，这个方法我们稍后定义
        await feedbackService.deleteFeedback(courseId, studentId, feedbackId)

        // 删除成功后，可以直接从本地 feedbackHistory 移除该项，
        // 或者重新调用 fetchFeedbackForStudent 来刷新整个列表。
        // 直接移除更高效，但重新获取能确保数据与后端完全同步。
        // 示例：直接从本地移除
        this.feedbackHistory = this.feedbackHistory.filter((fb) => fb._id !== feedbackId)

        // 或者示例：重新获取列表 (如果选择这种方式，上面的 filter 就不需要了)
        // await this.fetchFeedbackForStudent(courseId, studentId);

        return true
      } catch (err) {
        this.deleteError = err.response?.data?.message || '删除反馈记录失败'
        // this.error = err.response?.data?.message || '删除反馈记录失败';
        console.error('deleteFeedback action error:', err)
        return false
      } finally {
        this.isDeleting = false
      }
    },

    clearErrors() {
      // 可以扩展这个函数来清除 deleteError
      this.historyError = null
      this.submissionError = null
      this.deleteError = null // 新增
      // this.error = null;
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
