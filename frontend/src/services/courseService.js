// src/services/courseService.js
import apiClient from './apiClient'

const API_BASE_URL = '/courses'

export const fetchUserCourses = () => {
  return apiClient.get(`${API_BASE_URL}/`)
}

export const fetchCourseById = (courseId) => {
  return apiClient.get(`${API_BASE_URL}/${courseId}`)
}

export const createCourse = (courseData) => {
  return apiClient.post(`${API_BASE_URL}/`, courseData)
}

export const updateCourse = (courseId, courseDataToUpdate) => {
  return apiClient.put(`${API_BASE_URL}/${courseId}`, courseDataToUpdate)
}

export const deleteCourse = (courseId) => {
  return apiClient.delete(`${API_BASE_URL}/${courseId}`)
}
