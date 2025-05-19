// frontend/src/services/monthlySummaryService.js
import apiClient from './apiClient'

// Helper function to build the base summary API URL for a student
const getSummaryApiBaseUrl = (courseId, studentId) => {
  return `/courses/${courseId}/students/${studentId}/summaries`
}

/**
 * Fetches a specific monthly summary (user-saved version) for a student.
 * Corresponds to GET /api/courses/:courseId/students/:studentId/summaries/:year/:month
 * @param {string} courseId - Course ID
 * @param {string} studentId - Student ID
 * @param {number|string} year - Year
 * @param {number|string} month - Month (1-12)
 * @returns {Promise<AxiosResponse<any>>}
 */
export const fetchMonthlySummary = (courseId, studentId, year, month) => {
  if (!courseId || !studentId || !year || !month) {
    console.error('[monthlySummaryService] fetchMonthlySummary: Missing parameters')
    return Promise.reject(new Error('获取月度总结缺少必要的参数'))
  }
  const monthStr = String(month).padStart(2, '0')
  const apiUrl = `${getSummaryApiBaseUrl(courseId, studentId)}/${year}/${monthStr}`
  console.log('[monthlySummaryService] Fetching monthly summary from URL:', apiUrl)
  return apiClient.get(apiUrl)
}

/**
 * Fetches all historical monthly summaries for a student.
 * Corresponds to GET /api/courses/:courseId/students/:studentId/summaries/history
 * @param {string} courseId - Course ID
 * @param {string} studentId - Student ID
 * @returns {Promise<AxiosResponse<any>>}
 */
export const fetchMonthlySummaryHistory = (courseId, studentId) => {
  if (!courseId || !studentId) {
    console.error('[monthlySummaryService] fetchMonthlySummaryHistory: Missing parameters')
    return Promise.reject(new Error('获取历史记录缺少必要的参数'))
  }
  const apiUrl = `${getSummaryApiBaseUrl(courseId, studentId)}/history`
  console.log('[monthlySummaryService] Fetching summary history from URL:', apiUrl)
  return apiClient.get(apiUrl)
}

/**
 * Saves (creates or updates) a user's monthly summary for a specific year and month.
 * Corresponds to PUT /api/courses/:courseId/students/:studentId/summaries/:year/:month
 * @param {string} courseId - Course ID
 * @param {string} studentId - Student ID
 * @param {number|string} year - Year
 * @param {number|string} month - Month (1-12)
 * @param {object} summaryData - The complete summary data to save (from the editable preview).
 * @returns {Promise<AxiosResponse<any>>}
 */
export const saveUserMonthlySummary = (courseId, studentId, year, month, summaryData) => {
  if (!courseId || !studentId || !year || !month || !summaryData) {
    console.error('[monthlySummaryService] saveUserMonthlySummary: Missing parameters or data')
    return Promise.reject(new Error('保存月度总结缺少必要的参数或数据'))
  }
  const monthStr = String(month).padStart(2, '0')
  const apiUrl = `${getSummaryApiBaseUrl(courseId, studentId)}/${year}/${monthStr}`
  console.log('[monthlySummaryService] Saving user monthly summary at URL:', apiUrl)
  return apiClient.put(apiUrl, summaryData)
}

/**
 * Deletes a specific monthly summary by its ID.
 * Corresponds to DELETE /api/courses/:courseId/students/:studentId/summaries/:summaryId
 * @param {string} courseId - Course ID
 * @param {string} studentId - Student ID
 * @param {string} summaryId - The ID of the summary to delete.
 * @returns {Promise<AxiosResponse<any>>}
 */
export const deleteMonthlySummary = (courseId, studentId, summaryId) => {
  if (!courseId || !studentId || !summaryId) {
    console.error('[monthlySummaryService] deleteMonthlySummary: Missing parameters')
    return Promise.reject(new Error('删除月度总结时，课程ID、学生ID和总结ID均不能为空。'))
  }
  // Note: The URL for deleting by summaryId remains, assuming summaryId is known when deleting from history.
  const apiUrl = `${getSummaryApiBaseUrl(courseId, studentId)}/${summaryId}`
  console.log('[monthlySummaryService] Deleting monthly summary at URL:', apiUrl)
  return apiClient.delete(apiUrl)
}

/**
 * Requests the backend to generate accumulated summary content for preview.
 * Corresponds to POST /api/courses/:courseId/students/:studentId/summaries/generate-content
 * @param {string} courseId - Course ID
 * @param {string} studentId - Student ID
 * @param {number|string} year - Year
 * @param {number|string} month - Month (1-12)
 * @returns {Promise<AxiosResponse<any>>}
 */
export const generateSummaryContent = (courseId, studentId, year, month) => {
  if (!courseId || !studentId || !year || !month) {
    console.error('[monthlySummaryService] generateSummaryContent: Missing parameters')
    return Promise.reject(new Error('生成总结内容时，缺少必要的参数。'))
  }
  const apiUrl = `${getSummaryApiBaseUrl(courseId, studentId)}/generate-content`
  console.log('[monthlySummaryService] Generating summary content at URL:', apiUrl)
  // The payload for generate-content is { year, month }
  return apiClient.post(apiUrl, { year: Number(year), month: Number(month) })
}

// Renamed updateUserModifiedSummary to saveUserMonthlySummary to better reflect its new role.
// The old updateUserModifiedSummary (PUT to /:summaryId with partial data) is now replaced
// by saveUserMonthlySummary (PUT to /:year/:month with complete summary data).
