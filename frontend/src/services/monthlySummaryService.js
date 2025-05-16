import apiClient from './apiClient'

const getSummaryApiUrl = (courseId, studentId) => {
  return `/courses/${courseId}/students/${studentId}/summaries`
}

/**
 * 获取特定学生特定月份的月度总结
 * @param {string} courseId - 课程ID
 * @param {string} studentId - 学生ID
 * @param {number|string} year - 年份
 * @param {number|string} month - 月份 (1-12)
 * @returns {Promise<AxiosResponse<any>>}
 */
export const fetchMonthlySummary = (courseId, studentId, year, month) => {
  const monthStr = String(month).padStart(2, '0') // 确保月份是两位数
  return apiClient.get(`${getSummaryApiUrl(courseId, studentId)}/${year}/${monthStr}`)
}

/**
 * 获取特定学生的所有历史月度总结
 * @param {string} courseId - 课程ID
 * @param {string} studentId - 学生ID
 * @returns {Promise<AxiosResponse<any>>}
 */
export const fetchMonthlySummaryHistory = (courseId, studentId) => {
  return apiClient.get(`${getSummaryApiUrl(courseId, studentId)}/history`)
}

/**
 * 用户手动更新月度总结
 * @param {string} courseId - 课程ID
 * @param {string} studentId - 学生ID
 * @param {string} summaryId - 月度总结的ID
 * @param {object} summaryData - 需要更新的数据 (例如 courseProgress, followUpContent)
 * @returns {Promise<AxiosResponse<any>>}
 */
export const updateUserModifiedSummary = (courseId, studentId, summaryId, summaryData) => {
  return apiClient.put(`${getSummaryApiUrl(courseId, studentId)}/${summaryId}`, summaryData)
}
