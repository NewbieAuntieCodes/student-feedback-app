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

// export const deleteStudent = (courseId, studentId) => {
//   if (!courseId || !studentId) {
//     return Promise.reject(
//       new Error('Course ID and Student ID are required for deleting a student.'),
//     )
//   }
//   return apiClient.delete(
//     `/courses/<span class="math-inline">\{courseId\}/students/</span>{studentId}`,
//   )
// }

export const deleteStudent = (courseId, studentId) => {
  // 可以在这里再次校验 courseId 和 studentId，确保它们是有效的字符串ID
  if (!courseId || typeof courseId !== 'string' || courseId.trim() === '') {
    console.error('[studentService] Invalid courseId for deleteStudent:', courseId)
    return Promise.reject(new Error('Invalid or missing Course ID for deleting a student.'))
  }
  if (!studentId || typeof studentId !== 'string' || studentId.trim() === '') {
    console.error('[studentService] Invalid studentId for deleteStudent:', studentId)
    return Promise.reject(new Error('Invalid or missing Student ID for deleting a student.'))
  }

  // VVVVVV 【这是正确的 URL 构建方式】 VVVVVV
  const url = `/courses/${courseId}/students/${studentId}`
  console.log('[studentService deleteStudent] Requesting URL:', url) // 添加日志确认URL
  return apiClient.delete(url)
  // ^^^^^^ 【这是正确的 URL 构建方式】 ^^^^^^
}
