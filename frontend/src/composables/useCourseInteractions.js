// frontend/src/composables/useCourseInteractions.js
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

// courseStoreInstance, authStoreInstance 作为参数
export function useCourseInteractions(courseStoreInstance, authStoreInstance) {
  const router = useRouter()
  const route = useRoute()

  const handleCourseSelected = async (courseId) => {
    if (!courseStoreInstance || !router || !route) return
    await courseStoreInstance.selectCourse(courseId) // courseStore 内部会处理学生加载

    const currentRouteName = route.name
    const currentCourseIdInRoute = route.params.courseId

    if (courseId) {
      // 如果当前不在欢迎页且课程ID与选中不符，或在学生仪表盘且课程ID不符，则跳到欢迎页
      // 这个逻辑可以根据需要调整，比如跳转到新选课程的某个默认视图
      if (
        (currentRouteName !== 'WelcomePage' && currentCourseIdInRoute !== courseId) ||
        (currentRouteName === 'StudentDashboard' && currentCourseIdInRoute !== courseId)
      ) {
        router.push({ name: 'WelcomePage' }) // 或者 router.push({ name: 'CourseDefaultView', params: { courseId }})
      }
    } else {
      // 如果取消选择课程（courseId 为 null）
      if (
        currentRouteName !== 'WelcomePage' &&
        currentRouteName !== 'Login' &&
        currentRouteName !== 'Register'
      ) {
        router.push({ name: 'WelcomePage' })
      }
    }
  }

  const handleDeleteCourse = async (course) => {
    if (!courseStoreInstance || !router || !route || !course) return
    try {
      await ElMessageBox.confirm(
        `确定要删除课程 "${course.name}" 吗？此操作将同时删除该课程下的所有学生和反馈记录，且不可恢复。`,
        '警告',
        { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning' },
      )
      const success = await courseStoreInstance.deleteCourse(course._id)
      if (success) {
        ElMessage.success('课程删除成功！')
        // 如果删除的是当前路由参数中的课程，则跳转
        if (route.params.courseId === course._id && route.name !== 'WelcomePage') {
          router.push({ name: 'WelcomePage' })
        }
      } else {
        ElMessage.error(courseStoreInstance.deleteCourseError || '删除课程失败')
      }
    } catch (e) {
      if (e !== 'cancel' && e !== 'close') console.error('删除课程确认时出错:', e)
    }
  }

  const handleCourseCreated = (createdCourse) => {
    if (createdCourse && createdCourse._id) {
      ElMessage.success(`课程 "${createdCourse.name}" 创建成功!`)
      handleCourseSelected(createdCourse._id) // 创建后自动选中
    }
  }

  const handleCourseUpdated = () => {
    // courseToEdit 的重置已在 useCourseModalManager 中处理
    ElMessage.success('课程更新成功!')
    // 可能需要刷新课程列表或当前课程详情，如果 store 没有自动更新
    // await courseStoreInstance.fetchUserCourses();
    // if (courseStoreInstance.currentCourse) {
    //   await courseStoreInstance.selectCourse(courseStoreInstance.currentCourse._id);
    // }
  }

  return {
    handleCourseSelected,
    handleDeleteCourse,
    handleCourseCreated,
    handleCourseUpdated,
  }
}
