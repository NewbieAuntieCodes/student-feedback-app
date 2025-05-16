// src/store/feedbackStore.js
import { defineStore } from 'pinia'
import * as feedbackService from '../services/feedbackService' // 导入反馈服务
import { useMonthlySummaryStore } from './monthlySummaryStore'

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
        const response = await feedbackService.addFeedback(courseId, studentId, feedbackData)
        if (response.status === 201 && response.data.feedback) {
          const savedFeedback = response.data.feedback
          // 刷新反馈历史列表
          // this.feedbackHistory.unshift(savedFeedback); // 或者重新 fetch
          // 最好是让调用者决定是否刷新列表，或者在提交成功后总是刷新
          // await this.fetchFeedbackForStudent(courseId, studentId); // 通常在 ClassFeedbackTabPage 中会调用

          // --- 修改开始: 添加反馈成功后，通知月度总结更新 ---
          if (savedFeedback.feedbackDate) {
            //确保有反馈日期
            const monthlySummaryStore = useMonthlySummaryStore()
            await monthlySummaryStore.refreshCurrentMonthSummaryForFeedbackChange(
              courseId,
              studentId,
              savedFeedback.feedbackDate, // 使用已保存反馈的日期
            )
          }
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
        // --- 修改开始: 在删除前获取要删除的反馈的日期 ---
        const feedbackToDelete = this.feedbackHistory.find((fb) => fb._id === feedbackId)
        const feedbackDateOfDeleted = feedbackToDelete ? feedbackToDelete.feedbackDate : null
        // --- 修改结束 ---

        await feedbackService.deleteFeedback(courseId, studentId, feedbackId)
        this.feedbackHistory = this.feedbackHistory.filter((fb) => fb._id !== feedbackId)

        // --- 修改开始: 删除反馈成功后，通知月度总结更新 ---
        if (feedbackDateOfDeleted) {
          // 确保获取到了日期
          const monthlySummaryStore = useMonthlySummaryStore()
          await monthlySummaryStore.refreshCurrentMonthSummaryForFeedbackChange(
            courseId,
            studentId,
            feedbackDateOfDeleted, // 使用被删除反馈的日期
          )
        }
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
