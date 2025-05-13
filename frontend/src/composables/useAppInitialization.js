// frontend/src/composables/useAppInitialization.js

import { ref, watchEffect } from 'vue' // 确保导入了 watchEffect
import { useAuthStore } from '@/store/authStore'
import { useCourseStore } from '@/store/courseStore'
import { useStudentStore } from '@/store/studentStore'
import { ElMessage } from 'element-plus' // 用于在初始化失败时给用户提示

export function useAppInitialization() {
  const authStoreStatus = ref('Pending')
  const courseStoreStatus = ref('Pending')
  const studentStoreStatus = ref('Pending')
  const storesInitialized = ref(false)
  const initializationError = ref(null) // 用 null 表示无错误，用错误消息字符串表示有错误

  let authStoreInstance = null
  let courseStoreInstance = null
  let studentStoreInstance = null

  // 1. 实例化所有 stores
  try {
    authStoreInstance = useAuthStore()
    authStoreStatus.value = authStoreInstance
      ? `OK (ID: ${authStoreInstance.$id})`
      : 'Failed (AuthStore)'
    if (!authStoreInstance) throw new Error('Auth store failed to initialize')

    courseStoreInstance = useCourseStore()
    courseStoreStatus.value = courseStoreInstance
      ? `OK (ID: ${courseStoreInstance.$id})`
      : 'Failed (CourseStore)'
    if (!courseStoreInstance) throw new Error('Course store failed to initialize')

    studentStoreInstance = useStudentStore()
    studentStoreStatus.value = studentStoreInstance
      ? `OK (ID: ${studentStoreInstance.$id})`
      : 'Failed (StudentStore)'
    if (!studentStoreInstance) throw new Error('Student store failed to initialize')

    // 如果到这里没有抛出错误，说明所有 store 都已成功实例化
    storesInitialized.value = true
    console.log('[AppInitialization] All Pinia stores instantiated successfully.')
  } catch (e) {
    const errorMessage = e.message || '一个或多个 Pinia store 实例化失败。'
    initializationError.value = errorMessage
    // 根据错误信息更新具体 store 的状态，方便调试
    if (e.message.includes('Auth')) authStoreStatus.value = `Error: ${e.message}`
    else if (e.message.includes('Course')) courseStoreStatus.value = `Error: ${e.message}`
    else if (e.message.includes('Student')) studentStoreStatus.value = `Error: ${e.message}`
    console.error('[AppInitialization] Critical Error during store instantiation:', e)
    ElMessage.error(`核心服务初始化失败: ${errorMessage}`) // 给用户一个全局提示
  }

  // 2. 使用 watchEffect 来在 stores 成功初始化后执行异步数据加载
  watchEffect(async () => {
    // 只有当 stores 都初始化成功了，并且没有发生初始化错误时，才执行
    if (storesInitialized.value && !initializationError.value) {
      console.log(
        '[AppInitialization via watchEffect] Stores initialized. Starting initial data fetch.',
      )
      try {
        // 确保 courseStoreInstance 真的存在 (双重保险)
        if (courseStoreInstance) {
          console.log(
            '[AppInitialization via watchEffect] Fetching user courses and then active students...',
          )
          // 调用 courseStore 的 action 获取所有课程，
          // 并通过 { loadStudentsForActive: true } 选项告诉它内部去触发 studentStore 加载活跃课程的学生
          await courseStoreInstance.fetchUserCourses({ loadStudentsForActive: true })
          console.log(
            '[AppInitialization via watchEffect] User courses fetched. Active students should be loading/loaded via courseStore action.',
          )
        } else {
          // 这种情况理论上不应该发生，因为 storesInitialized.value 为 true
          throw new Error('courseStoreInstance is not available for fetching initial data.')
        }
        console.log(
          '[AppInitialization via watchEffect] Initial data fetch process triggered/completed.',
        )
      } catch (dataFetchError) {
        const fetchErrorMessage = dataFetchError.message || '初始化应用数据时发生错误，请稍后重试。'
        console.error(
          '[AppInitialization via watchEffect] Error during initial data fetch:',
          dataFetchError,
        )
        ElMessage.error(fetchErrorMessage) // 给用户提示数据加载失败
        initializationError.value = initializationError.value || fetchErrorMessage // 记录或追加错误状态
      }
    } else if (initializationError.value) {
      // 如果 stores 初始化就失败了，就不进行数据加载
      console.error(
        '[AppInitialization via watchEffect] Core stores failed to initialize earlier, skipping initial data fetch.',
      )
    }
  })

  return {
    authStore: authStoreInstance,
    courseStore: courseStoreInstance,
    studentStore: studentStoreInstance,
    authStoreStatus,
    courseStoreStatus,
    studentStoreStatus,
    storesInitialized,
    initializationError,
  }
}
