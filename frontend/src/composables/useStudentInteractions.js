// src/composables/useStudentInteractions.js

import { useStudentStore } from '@/store/studentStore'
import { useCourseStore } from '@/store/courseStore' // 用于获取当前课程信息
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter, useRoute } from 'vue-router' // 用于删除成功后的导航

export function useStudentInteractions() {
  const studentStore = useStudentStore()
  const courseStore = useCourseStore()
  const router = useRouter()
  const route = useRoute() // 获取当前路由信息

  /**
   * 处理删除学生的逻辑，包括用户确认。
  //  * @param {object} studentToDelete - 要删除的学生对象，期望包含 _id, name, 和 course (课程ID) 属性。
   */
  // const handleDeleteStudent = async (studentToDelete) => {
  //   if (!studentToDelete || !studentToDelete._id || !studentToDelete.course) {
  //     ElMessage.error('无效的学生信息，无法执行删除操作。')
  //     console.error(
  //       '[useStudentInteractions] handleDeleteStudent: Invalid student object provided.',
  //       studentToDelete,
  //     )
  //     return
  //   }

  //   // VVVVVV 【修改这里】 VVVVVV
  //   // 检查 studentToDelete.course 是否存在，并且它是否是一个对象且包含 _id
  //   // 或者它本身就是一个 ID 字符串 (虽然根据日志，前者可能性更大)
  //   // ...
  //   let courseId
  //   if (
  //     studentToDelete.course &&
  //     typeof studentToDelete.course === 'object' &&
  //     studentToDelete.course._id
  //   ) {
  //     courseId = studentToDelete.course._id
  //   } else if (studentToDelete.course && typeof studentToDelete.course === 'string') {
  //     courseId = studentToDelete.course
  //   } else {
  //     /* ... error ... */ return
  //   }
  //   const studentId = studentToDelete._id
  //   console.log(
  //     '[useStudentInteractions] Extracted for API call - courseId:',
  //     courseId,
  //     'studentId:',
  //     studentId,
  //   )
  //   // ...
  //   const studentName = studentToDelete.name

  //   console.log(`[useStudentInteractions handleDeleteStudent] Student to delete:`, studentToDelete) // 【建议添加日志】
  //   console.log(
  //     `[useStudentInteractions handleDeleteStudent] Extracted courseId: ${courseId}, studentId: ${studentId}`,
  //   ) // 【建议添加日志】

  //   if (!courseId) {
  //     // 再次确认 courseId 是否成功提取
  //     ElMessage.error('未能提取有效的课程ID，无法删除学生。')
  //     return
  //   }

  //   try {
  //     // 弹出确认对话框
  //     await ElMessageBox.confirm(
  //       `您确定要删除学生 "${studentName}" 吗？与该学生相关的所有反馈记录也将被一并删除。此操作一旦执行将无法撤销。`,
  //       '确认删除学生', // 对话框标题
  //       {
  //         confirmButtonText: '确定删除',
  //         cancelButtonText: '取消',
  //         type: 'warning',
  //         dangerouslyUseHTMLString: false, // 如果message中有HTML，设为true
  //       },
  //     )

  //     // 用户确认后，调用 studentStore 中的 deleteStudent action
  //     const success = await studentStore.deleteStudent(courseId, studentId)

  //     if (success) {
  //       ElMessage.success(`学生 "${studentName}" 已成功删除。`)

  //       // 删除成功后的处理：
  //       // 1. 如果当前路由显示的是这个被删除学生的详情，则导航离开
  //       if (route.params.studentId === studentId && route.params.courseId === courseId) {
  //         // 导航到当前课程的概览页 (如果 WelcomePage 可以接受 courseId)
  //         // 或者直接到通用的 WelcomePage
  //         // 或者到课程下的学生列表（但此时该学生已不在）
  //         // 这里我们假设导航到课程的 Welcome 状态
  //         if (courseStore.currentCourse) {
  //           // 确保课程信息还在
  //           router.push({
  //             name: 'WelcomePage',
  //             params: { courseId: courseStore.currentCourse._id },
  //           })
  //           // 如果 WelcomePage 不接受 courseId, 则 router.push({ name: 'WelcomePage' });
  //         } else {
  //           router.push({ name: 'WelcomePage' }) // 回到通用欢迎页
  //         }
  //       }
  //       // 2. 如果 AppInfoPanel 正在显示这个学生，它应该会自动更新，因为 studentStore.currentStudent 会被清空
  //     } else {
  //       // store action 返回 false，表示删除失败
  //       ElMessage.error(studentStore.error || '删除学生时遇到问题，请稍后重试。')
  //     }
  //   } catch (action) {
  //     // ElMessageBox.confirm 点击取消时会 reject 一个字符串 'cancel'
  //     if (action === 'cancel') {
  //       ElMessage.info('删除操作已取消。')
  //     } else {
  //       // 其他未知错误
  //       console.error('[useStudentInteractions] Error during student deletion process:', action)
  //       ElMessage.error('执行删除操作时出现意外错误。')
  //     }
  //   }
  // }

  // 未来可以添加其他学生相关的交互函数，比如打开编辑学生模态框等
  // const handleOpenEditStudentModal = (student) => { ... };

  const handleDeleteStudent = async (studentToDelete) => {
    if (!studentToDelete || !studentToDelete._id) {
      ElMessage.error('无效的学生信息（缺少ID），无法执行删除操作。')
      console.error(
        '[useStudentInteractions] handleDeleteStudent: Invalid student object provided (missing _id).',
        studentToDelete,
      )
      return
    }

    let courseId
    if (
      studentToDelete.course &&
      typeof studentToDelete.course === 'object' &&
      studentToDelete.course._id
    ) {
      courseId = studentToDelete.course._id
    } else if (studentToDelete.course && typeof studentToDelete.course === 'string') {
      courseId = studentToDelete.course
    } else {
      ElMessage.error('无法从学生信息中确定课程ID，无法执行删除操作。')
      console.error(
        '[useStudentInteractions] handleDeleteStudent: course ID is missing or invalid in student object.',
        studentToDelete,
      )
      return
    }

    const studentId = studentToDelete._id
    const studentName = studentToDelete.name

    console.log(
      `[useStudentInteractions handleDeleteStudent] Student to delete:`,
      JSON.parse(JSON.stringify(studentToDelete)),
    )
    console.log(
      `[useStudentInteractions handleDeleteStudent] Using courseId: ${courseId}, studentId: ${studentId}`,
    )

    if (!courseId) {
      ElMessage.error('未能提取有效的课程ID，无法删除学生。')
      return
    }

    try {
      await ElMessageBox.confirm(
        `您确定要删除学生 "${studentName}" 吗？与该学生相关的所有反馈记录也将被一并删除。此操作一旦执行将无法撤销。`,
        '确认删除学生',
        {
          confirmButtonText: '确定删除',
          cancelButtonText: '取消',
          type: 'warning',
          dangerouslyUseHTMLString: false, // 保留为 false，因为消息是纯文本
        },
      )

      const success = await studentStore.deleteStudent(courseId, studentId)

      // VVVVVV 这是您需要关注和替换的部分 VVVVVV
      if (success) {
        ElMessage.success(`学生 "${studentName}" 已成功删除。`)

        // 删除成功后的导航逻辑：
        // 统一导航到 WelcomePage，不传递任何参数，因为 WelcomePage 路由不接受 courseId。
        console.log(
          `[useStudentInteractions] Student ${studentName} deleted. Navigating to WelcomePage.`,
        )
        router.push({ name: 'WelcomePage' })
      } else {
        // store action 返回 false，表示删除失败
        ElMessage.error(studentStore.error || '删除学生时遇到问题，请稍后重试。')
      }
      // ^^^^^^ 这是您需要关注和替换的部分 ^^^^^^
    } catch (action) {
      if (action === 'cancel') {
        ElMessage.info('删除操作已取消。')
      } else {
        console.error('[useStudentInteractions] Error during student deletion process:', action)
        ElMessage.error('执行删除操作时出现意外错误。')
      }
    }
  } // handleDeleteStudent 函数结束

  return {
    handleDeleteStudent,
    // handleOpenEditStudentModal,
  }
}
