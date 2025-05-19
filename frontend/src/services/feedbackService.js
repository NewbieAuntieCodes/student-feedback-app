// src/services/feedbackService.js
import apiClient from './apiClient'

const getFeedbackApiUrl = (courseId, studentId) => {
  return `/courses/${courseId}/students/${studentId}/feedback`
}

export const fetchFeedbackForStudent = (courseId, studentId) => {
  return apiClient.get(getFeedbackApiUrl(courseId, studentId))
}

export const addFeedback = (courseId, studentId, feedbackData) => {
  return apiClient.post(getFeedbackApiUrl(courseId, studentId), feedbackData)
}

// 新增或取消注释:
export const deleteFeedback = (courseId, studentId, feedbackId) => {
  if (!courseId || !studentId || !feedbackId) {
    console.error('[feedbackService] Missing IDs for deleteFeedback:', {
      courseId,
      studentId,
      feedbackId,
    })
    return Promise.reject(
      new Error('Course ID, Student ID, and Feedback ID are required for deleting feedback.'),
    )
  }
  // 正确的 URL 构建方式
  const apiUrl = `${getFeedbackApiUrl(courseId, studentId)}/${feedbackId}` // <--- 修改这里，去掉不必要的反斜杠

  console.log('[feedbackService] Attempting to DELETE URL:', apiUrl) // 保留这行日志用于调试
  return apiClient.delete(apiUrl)
}

// 如果将来有更新或删除反馈的功能，也可以在这里添加
// export const updateFeedback = (courseId, studentId, feedbackId, feedbackData) => {
//   return apiClient.put(`${getFeedbackApiUrl(courseId, studentId)}/${feedbackId}`, feedbackData);
// };

// export const deleteFeedback = (courseId, studentId, feedbackId) => {
//   return apiClient.delete(`${getFeedbackApiUrl(courseId, studentId)}/${feedbackId}`);
// };
