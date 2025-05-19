// frontend/src/composables/useRouteCourseSync.js
import { onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'

// storesInitialized, modalHelpersInitialized (refs), authStore, courseStore 作为参数
export function useRouteCourseSync(
  storesInitialized,
  modalHelpersInitialized, // 确保 modal helper 也已就绪
  authStoreInstance,
  courseStoreInstance,
) {
  const router = useRouter()
  const route = useRoute()

  const performRouteSync = async () => {
    if (!authStoreInstance || !authStoreInstance.isAuthenticated) {
      console.log('[RouteSync] User not authenticated. Routing will be handled by guard.')
      return
    }
    if (!courseStoreInstance) {
      console.error('[RouteSync] CourseStore not available for sync.')
      return
    }

    console.log('[RouteSync] Syncing course with route params:', route.params)
    try {
      const { courseFound } = await courseStoreInstance.syncCourseWithRoute(
        route.params.courseId,
        route.params.studentId,
      )
      console.log('[RouteSync] syncCourseWithRoute result - courseFound:', courseFound)

      if (
        !route.params.courseId && // 没有课程ID，但不是特定的豁免路由
        route.name !== 'WelcomePage' &&
        route.name !== 'Login' &&
        route.name !== 'Register'
      ) {
        router.push({ name: 'WelcomePage' })
      } else if (
        route.params.courseId &&
        !courseFound && // 有课程ID但未找到，且不是特定的豁免路由
        route.name !== 'WelcomePage' &&
        route.name !== 'Login' &&
        route.name !== 'Register'
      ) {
        ElMessage.error('链接中的课程未找到或已失效。')
        router.push({ name: 'WelcomePage' })
      }
    } catch (error) {
      console.error('[RouteSync] Error during syncCourseWithRoute or navigation:', error)
      ElMessage.error('同步页面状态时发生错误。')
    }
  }

  onMounted(async () => {
    console.log('[AppLayout via RouteSync] Component Mounted Hook from Composable.')
    if (
      !storesInitialized.value ||
      !modalHelpersInitialized.value || // 确保 modal helpers 也已初始化
      !router ||
      !route ||
      !authStoreInstance ||
      !courseStoreInstance
    ) {
      console.error('[RouteSync] onMounted: Critical dependencies not ready for sync. Aborting.')
      return
    }
    console.log('[RouteSync] onMounted: All dependencies ready. Initializing state from route...')
    await performRouteSync()
  })

  watch(
    () => route.fullPath,
    async (newFullPath, oldFullPath) => {
      if (!newFullPath || newFullPath === oldFullPath) return // 路径未实际变化

      if (
        !storesInitialized.value ||
        !modalHelpersInitialized.value ||
        !courseStoreInstance ||
        !router ||
        !authStoreInstance
      ) {
        console.log('[RouteSync] Watch: Skipped due to uninitialized dependencies.')
        return
      }
      console.log('[RouteSync] Watch triggered. New path:', newFullPath)
      await performRouteSync()
    },
    // { immediate: true } // onMounted 已经处理了首次加载，这里通常不需要 immediate
  )
}
