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

// 如果将来有更新或删除反馈的功能，也可以在这里添加
// export const updateFeedback = (courseId, studentId, feedbackId, feedbackData) => {
//   return apiClient.put(`${getFeedbackApiUrl(courseId, studentId)}/${feedbackId}`, feedbackData);
// };

// export const deleteFeedback = (courseId, studentId, feedbackId) => {
//   return apiClient.delete(`${getFeedbackApiUrl(courseId, studentId)}/${feedbackId}`);
// };
