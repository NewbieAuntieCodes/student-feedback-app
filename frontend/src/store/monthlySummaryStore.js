// frontend/src/store/monthlySummaryStore.js
import { defineStore } from 'pinia'
import * as monthlySummaryService from '../services/monthlySummaryService'
// import { useAuthStore } from './authStore'; // Not directly used in this version of actions
// import { useCourseStore } from './courseStore'; // Not directly used in this version of actions
import dayjs from 'dayjs'

export const useMonthlySummaryStore = defineStore('monthlySummary', {
  state: () => ({
    currentSummary: null, // Stores the user-saved summary for the selected month (full object)
    generatedPreviewContent: null, // Stores the object from "Generate Summary" (includes summaryTextContent and other fields)
    summaryHistory: [],
    isLoadingSummary: false,
    isLoadingHistory: false,
    summaryError: null,
    historyError: null,
    isSavingSummary: false,
    saveSummaryError: null,
    isDeletingSummary: false,
    deleteSummaryError: null,
    isGeneratingPreview: false,
    generatePreviewError: null,
  }),
  getters: {
    activeSummary: (state) => state.currentSummary,
    previewContentForEditing: (state) => state.generatedPreviewContent, // The object to populate form/preview
    historicalSummaries: (state) => state.summaryHistory,
  },
  actions: {
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
        this.generatedPreviewContent = null
        console.error('[monthlySummaryStore fetchOrInitialize] Invalid params')
        return null // Return something to indicate failure or no action
      }
      this.isLoadingSummary = true
      this.summaryError = null
      this.currentSummary = null
      this.generatedPreviewContent = null

      try {
        const response = await monthlySummaryService.fetchMonthlySummary(
          courseId,
          studentId,
          year,
          month,
        )
        if (response.data) {
          if (response.data.summary) {
            // Existing summary found
            this.currentSummary = response.data.summary
            // Populate generatedPreviewContent from currentSummary for immediate editing
            this.generatedPreviewContent = { ...response.data.summary }
            return this.currentSummary
          } else if (response.data.summary === null && response.data.baseInfo) {
            // No summary, but got base info
            this.currentSummary = null
            this.generatedPreviewContent = response.data.baseInfo // Use baseInfo to init form/preview
            console.log(
              '[monthlySummaryStore] No saved summary, baseInfo received and set for preview:',
              response.data.baseInfo,
            )
            return null // Indicate no saved summary was found
          } else {
            this.summaryError = '加载月度总结时返回数据格式不正确。'
          }
        }
      } catch (err) {
        this.summaryError = err.response?.data?.message || '加载月度总结失败'
        console.error('fetchOrInitializeMonthlySummary error:', err)
      } finally {
        this.isLoadingSummary = false
      }
      return null // Default return if other conditions not met
    },

    async generatePreviewSummaryContent(courseId, studentId, year, month) {
      if (!courseId || !studentId || !year || !month) {
        this.generatePreviewError = '生成总结预览缺少必要的参数'
        this.generatedPreviewContent = null
        return null
      }
      this.isGeneratingPreview = true
      this.generatePreviewError = null
      // this.generatedPreviewContent = null; // Clear previous if any, or let component decide
      try {
        const response = await monthlySummaryService.generateSummaryContent(
          courseId,
          studentId,
          year,
          month,
        )
        if (response.data && response.data.generatedSummary) {
          // generatedSummary should be an object containing summaryTextContent and other fields
          this.generatedPreviewContent = response.data.generatedSummary
          return this.generatedPreviewContent
        }
        this.generatePreviewError =
          response.data?.message || '生成总结预览内容失败，但未返回具体错误。'
        return null
      } catch (err) {
        this.generatePreviewError = err.response?.data?.message || '生成总结预览内容请求失败'
        console.error('generatePreviewSummaryContent action error:', err)
        this.generatedPreviewContent = null
        return null
      } finally {
        this.isGeneratingPreview = false
      }
    },

    async saveMonthlySummary(courseId, studentId, year, month, summaryDataToSave) {
      // summaryDataToSave MUST contain summaryTextContent
      if (
        !courseId ||
        !studentId ||
        !year ||
        !month ||
        !summaryDataToSave ||
        summaryDataToSave.summaryTextContent === undefined ||
        summaryDataToSave.summaryTextContent === null
      ) {
        this.saveSummaryError = '保存月度总结缺少必要的参数或总结文本内容'
        console.error(
          '[monthlySummaryStore saveMonthlySummary] Missing required parameters or summaryTextContent is undefined/null:',
          { courseId, studentId, year, month, summaryDataToSave },
        )
        return false
      }
      this.isSavingSummary = true
      this.saveSummaryError = null
      try {
        const response = await monthlySummaryService.saveUserMonthlySummary(
          courseId,
          studentId,
          year,
          month,
          summaryDataToSave, // This payload MUST contain the final summaryTextContent
        )

        if (response.data && response.data.summary) {
          const savedSummary = response.data.summary
          this.currentSummary = savedSummary // Update currentSummary with the fully saved version
          // After saving, the "generated preview" (which was edited and saved) is now the "current summary"
          // So generatedPreviewContent can be aligned with currentSummary or cleared if it's only for pre-edit state.
          // For consistency, let's align it so the form and preview reflect the saved state.
          this.generatedPreviewContent = { ...savedSummary }

          const indexInHistory = this.summaryHistory.findIndex((s) => s._id === savedSummary._id)

          if (indexInHistory !== -1) {
            this.summaryHistory[indexInHistory] = savedSummary
          } else {
            this.summaryHistory.push(savedSummary)
            this.summaryHistory.sort(
              // Keep history sorted
              (a, b) => dayjs(b.summaryDate).diff(dayjs(a.summaryDate)),
            )
          }
          return true
        }
        this.saveSummaryError = response.data?.message || '保存月度总结响应格式不正确。'
        return false
      } catch (err) {
        this.saveSummaryError = err.response?.data?.message || '保存月度总结失败'
        console.error('saveMonthlySummary error:', err)
        return false
      } finally {
        this.isSavingSummary = false
      }
    },

    async fetchSummaryHistory(courseId, studentId) {
      console.log('[monthlySummaryStore fetchSummaryHistory] Received:', { courseId, studentId })
      if (!courseId || !studentId) {
        this.historyError = '获取历史记录缺少必要的参数'
        this.summaryHistory = []
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

    async deleteMonthlySummary(courseId, studentId, summaryId) {
      if (!courseId || !studentId || !summaryId) {
        this.deleteSummaryError = '删除月度总结缺少必要的ID'
        return false
      }
      this.isDeletingSummary = true
      this.deleteSummaryError = null
      try {
        await monthlySummaryService.deleteMonthlySummary(courseId, studentId, summaryId)
        this.summaryHistory = this.summaryHistory.filter((s) => s._id !== summaryId)
        if (this.currentSummary && this.currentSummary._id === summaryId) {
          this.currentSummary = null
          this.generatedPreviewContent = null // Also clear preview if it was showing the deleted summary
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

    clearCurrentSummaryAndPreview() {
      this.currentSummary = null
      this.generatedPreviewContent = null
      this.summaryError = null
      this.generatePreviewError = null
    },
    clearSummaryHistory() {
      this.summaryHistory = []
      this.historyError = null
    },
    clearAllSummaryErrors() {
      this.summaryError = null
      this.historyError = null
      this.saveSummaryError = null
      this.deleteSummaryError = null
      this.generatePreviewError = null
    },
  },
})
