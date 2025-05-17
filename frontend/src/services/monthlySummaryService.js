// frontend/src/services/monthlySummaryService.js
import apiClient from './apiClient'

// 正确的 getSummaryApiUrl 函数
const getSummaryApiUrl = (courseId, studentId) => {
  // 使用模板字符串正确替换变量
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
  if (!courseId || !studentId || !year || !month) {
    console.error('[monthlySummaryService] fetchMonthlySummary: Missing parameters', {
      courseId,
      studentId,
      year,
      month,
    })
    return Promise.reject(new Error('获取月度总结缺少必要的参数'))
  }
  const monthStr = String(month).padStart(2, '0') // 确保月份是两位数
  // 正确拼接URL
  const apiUrl = `${getSummaryApiUrl(courseId, studentId)}/${year}/${monthStr}`
  console.log('[monthlySummaryService] Fetching monthly summary from URL:', apiUrl) // 添加日志
  return apiClient.get(apiUrl)
}

/**
 * 获取特定学生的所有历史月度总结
 * @param {string} courseId - 课程ID
 * @param {string} studentId - 学生ID
 * @returns {Promise<AxiosResponse<any>>}
 */
export const fetchMonthlySummaryHistory = (courseId, studentId) => {
  if (!courseId || !studentId) {
    console.error('[monthlySummaryService] fetchMonthlySummaryHistory: Missing parameters', {
      courseId,
      studentId,
    })
    return Promise.reject(new Error('获取历史记录缺少必要的参数'))
  }
  // 正确拼接URL
  const apiUrl = `${getSummaryApiUrl(courseId, studentId)}/history`
  console.log('[monthlySummaryService] Fetching summary history from URL:', apiUrl) // 添加日志
  return apiClient.get(apiUrl)
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
  if (!courseId || !studentId || !summaryId) {
    console.error('[monthlySummaryService] updateUserModifiedSummary: Missing parameters', {
      courseId,
      studentId,
      summaryId,
    })
    return Promise.reject(new Error('更新月度总结缺少必要的ID'))
  }
  // 正确拼接URL
  const apiUrl = `${getSummaryApiUrl(courseId, studentId)}/${summaryId}`
  console.log('[monthlySummaryService] Updating user modified summary at URL:', apiUrl) // 添加日志
  return apiClient.put(apiUrl, summaryData)
}

// 如果您已经添加了 deleteMonthlySummary 和 generateSummaryContent，也需要用同样的方式检查和修正URL构建：
export const deleteMonthlySummary = (courseId, studentId, summaryId) => {
  if (!courseId || !studentId || !summaryId) {
    console.error('[monthlySummaryService] deleteMonthlySummary: Missing parameters', {
      courseId,
      studentId,
      summaryId,
    })
    return Promise.reject(new Error('删除月度总结时，课程ID、学生ID和总结ID均不能为空。'))
  }
  const apiUrl = `${getSummaryApiUrl(courseId, studentId)}/${summaryId}`
  console.log('[monthlySummaryService] Deleting monthly summary at URL:', apiUrl) // 添加日志
  return apiClient.delete(apiUrl)
}

export const generateSummaryContent = (courseId, studentId, year, month) => {
  if (!courseId || !studentId || !year || !month) {
    console.error('[monthlySummaryService] generateSummaryContent: Missing parameters', {
      courseId,
      studentId,
      year,
      month,
    })
    return Promise.reject(new Error('生成总结内容时，缺少必要的参数。'))
  }
  const apiUrl = `${getSummaryApiUrl(courseId, studentId)}/generate-content`
  console.log('[monthlySummaryService] Generating summary content at URL:', apiUrl) // 添加日志
  return apiClient.post(apiUrl, { year, month })
}
