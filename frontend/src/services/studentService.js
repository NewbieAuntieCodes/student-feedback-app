// src/services/studentService.js
import apiClient from './apiClient'

// 注意：学生相关的 API 是嵌套在课程下的
const getStudentApiUrl = (courseId, studentId = null) => {
  let url = `/courses/${courseId}/students`
  if (studentId) {
    url += `/${studentId}`
  }
  return url
}

export const fetchStudentsInCourse = (courseId) => {
  return apiClient.get(getStudentApiUrl(courseId))
}

export const fetchStudentDetails = (courseId, studentId) => {
  return apiClient.get(getStudentApiUrl(courseId, studentId))
}

export const addStudentToCourse = (courseId, studentData) => {
  return apiClient.post(getStudentApiUrl(courseId), studentData)
}

export const updateStudentDetails = (courseId, studentId, studentDataToUpdate) => {
  return apiClient.put(getStudentApiUrl(courseId, studentId), studentDataToUpdate)
}

export const deleteStudent = (courseId, studentId) => {
  return apiClient.delete(getStudentApiUrl(courseId, studentId))
}
