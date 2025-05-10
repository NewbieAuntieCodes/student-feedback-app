<template>
  <el-container style="height: 100vh">
    <el-aside
      width="260px"
      class="sidebar-container"
      style="
        background-color: #304156;
        display: flex;
        flex-direction: column;
        border-right: 1px solid #444851;
      "
    >
      <CourseManagementPanel
        v-model="selectedCourseId"
        @course-selected="handleCourseSelected"
        @open-create-course-dialog="openCreateCourseModal"
        @open-add-student-dialog="openAddStudentModal"
      />
      <StudentListMenu
        :selectedCourseId="selectedCourseId"
        :students="studentStore.studentsInCurrentCourse"
        :isLoadingCourses="courseStore.isLoading && courseStore.userCourses.length === 0"
        :isLoadingStudents="studentStore.isLoading && !!selectedCourseId"
        :courses="courseStore.userCourses"
      />
    </el-aside>

    <el-container direction="vertical" class="main-content-container">
      <AppHeader />
      <el-main
        style="
          padding: 0;
          overflow-y: hidden;
          display: flex;
          flex-direction: column;
          background-color: #f0f2f5;
        "
      >
        <router-view v-slot="{ Component, route }">
          <transition name="fade-main" mode="out-in">
            <component :is="Component" :key="route.fullPath" />
          </transition>
        </router-view>
      </el-main>
    </el-container>

    <el-aside width="280px" class="right-sidebar-container" v-if="showRightSidebar">
      <el-scrollbar style="flex-grow: 1; padding: 15px">
        <h3>信息栏</h3>
        <div v-if="courseStore.currentCourse">
          <h4>当前课程: {{ courseStore.currentCourse.name }}</h4>
          <p>ID: {{ courseStore.currentCourse._id }}</p>
          <el-button
            size="small"
            @click="editCurrentCourse"
            type="primary"
            plain
            :icon="EditPen"
            style="margin-top: 5px"
            >编辑课程</el-button
          >
          <el-button
            size="small"
            @click="confirmDeleteCourse(courseStore.currentCourse)"
            type="danger"
            plain
            :icon="Delete"
            style="margin-top: 5px"
            >删除课程</el-button
          >
        </div>
        <el-divider v-if="courseStore.currentCourse && studentStore.currentStudent" />
        <div v-if="studentStore.currentStudent">
          <h4>当前学生: {{ studentStore.currentStudent.name }}</h4>
          <p>ID: {{ studentStore.currentStudent._id }}</p>
          <p>年级: {{ studentStore.currentStudent.grade || 'N/A' }}</p>
        </div>
        <div v-if="!courseStore.currentCourse && !studentStore.currentStudent">
          <p>选择一个课程或学生以查看更多信息。</p>
        </div>
      </el-scrollbar>
    </el-aside>

    <CreateCourseModal
      :visible="courseModal.isModalVisible.value"
      :courseToEdit="courseToEdit"
      @update:visible="courseModal.isModalVisible.value = $event"
      @course-created="handleCourseCreated"
      @course-updated="handleCourseUpdated"
      @closed="handleCourseModalClosed"
    />

    <AddStudentModal
      v-if="addStudentModalTargetCourse"
      :visible="addStudentModal.isModalVisible.value"
      :targetCourse="addStudentModalTargetCourse"
      @update:visible="addStudentModal.isModalVisible.value = $event"
      @student-added="handleStudentAdded"
      @closed="handleAddStudentModalClosed"
    />
  </el-container>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  ElContainer,
  ElAside,
  ElMain,
  ElScrollbar,
  ElMessage,
  ElMessageBox,
  ElButton,
  ElDivider,
} from 'element-plus'
import { EditPen, Delete } from '@element-plus/icons-vue'

import AppHeader from '@/components/common/AppHeader.vue'
import CourseManagementPanel from '@/components/course/CourseManagementPanel.vue'
import StudentListMenu from '@/components/student/StudentListMenu.vue'
import CreateCourseModal from '@/components/course/CreateCourseModal.vue'
import AddStudentModal from '@/components/student/AddStudentModal.vue'

import { useAuthStore } from '@/store/authStore'
import { useCourseStore } from '@/store/courseStore'
import { useStudentStore } from '@/store/studentStore'
import { useModal } from '@/composables/useModal.js'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const courseStore = useCourseStore()
const studentStore = useStudentStore()

const selectedCourseId = ref(null) // 由 CourseManagementPanel 通过 v-model 更新
const courseToEdit = ref(null)
const addStudentModalTargetCourse = ref(null)

const courseModal = useModal()
console.log('courseModal instance:', courseModal) // 检查1: courseModal 是否是对象
if (courseModal) {
  console.log('courseModal.isModalVisible:', courseModal.isModalVisible) // 检查2: isModalVisible 是否是 ref
}
const addStudentModal = useModal()
console.log('addStudentModal instance:', addStudentModal)
if (addStudentModal) {
  console.log('addStudentModal.isModalVisible:', addStudentModal.isModalVisible)
}

// 控制右侧边栏显示逻辑
const showRightSidebar = computed(() => {
  // 仅当有课程被选中时显示右侧栏，或者当学生被选中时
  // 可以根据具体需求调整
  return !!courseStore.currentCourse
})

const handleCourseSelected = async (courseId) => {
  studentStore.clearStudents() // 清空旧课程的学生
  studentStore.setCurrentStudent(null) // 清空当前选中的学生

  if (courseId) {
    const course = courseStore.userCourses.find((c) => c._id === courseId)
    courseStore.setCurrentCourse(course || null) // 更新 store
    if (course) {
      await studentStore.fetchStudentsInCourse(courseId)
    }
    // 课程改变后，导航到欢迎页或课程详情页（如果存在）
    // 避免在学生详情页时，仅改变课程下拉框而不改变路由，导致数据显示不一致
    if (
      route.name !== 'WelcomePage' &&
      (!route.params.courseId || route.params.courseId !== courseId)
    ) {
      if (router.currentRoute.value.name !== 'WelcomePage') {
        // 如果当前不在欢迎页，并且路由中的课程ID与新选的课程ID不符，则跳转到欢迎页
        // 这样避免了从一个学生的详情页切换课程后，URL仍指向旧课程的学生
        router.push({ name: 'WelcomePage' })
      }
    } else if (route.params.courseId && route.params.courseId !== courseId) {
      // 如果 URL 中有 courseId 但与新选的不同，也跳转到欢迎页，让用户重新选择学生
      router.push({ name: 'WelcomePage' })
    }
  } else {
    // 如果 courseId 为 null (清空选择)
    courseStore.setCurrentCourse(null)
    if (router.currentRoute.value.name !== 'WelcomePage') {
      router.push({ name: 'WelcomePage' })
    }
  }
}

const openCreateCourseModal = () => {
  courseToEdit.value = null // 确保是创建模式
  courseModal.openModal('创建新课程')
}

const editCurrentCourse = () => {
  if (courseStore.currentCourse) {
    courseToEdit.value = { ...courseStore.currentCourse } // 传递副本以供编辑
    courseModal.openModal('编辑课程')
  }
}

const confirmDeleteCourse = async (course) => {
  if (!course) return
  try {
    await ElMessageBox.confirm(
      `确定要删除课程 "${course.name}" 吗？此操作将同时删除该课程下的所有学生和反馈记录，且不可恢复。`,
      '警告',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )
    const success = await courseStore.deleteCourse(course._id)
    if (success) {
      ElMessage.success('课程删除成功！')
      // 如果删除的是当前选中的课程，则清空 selectedCourseId
      if (selectedCourseId.value === course._id) {
        selectedCourseId.value = null // 这会触发 handleCourseSelected(null)
        handleCourseSelected(null) // 主动调用以确保状态更新和导航
      }
    } else {
      ElMessage.error(courseStore.deleteCourseError || '删除课程失败')
    }
  } catch (e) {
    // 用户点击了取消或关闭对话框
    if (e !== 'cancel' && e !== 'close') {
      console.error('删除课程确认时出错:', e)
    }
  }
}

const handleCourseCreated = (createdCourse) => {
  // courseModal.closeModal(); // Modal 组件内部在成功后会自行处理 visible
  selectedCourseId.value = createdCourse._id
  handleCourseSelected(createdCourse._id)
}

const handleCourseUpdated = async () => {
  // courseModal.closeModal();
  await courseStore.fetchUserCourses() // 刷新课程列表
  // 如果当前选中的课程被编辑了，确保 currentCourse 也是最新的
  if (
    courseStore.currentCourse &&
    courseToEdit.value &&
    courseStore.currentCourse._id === courseToEdit.value._id
  ) {
    const updatedCourseFromList = courseStore.userCourses.find(
      (c) => c._id === courseToEdit.value._id,
    )
    courseStore.setCurrentCourse(updatedCourseFromList || null)
  }
  courseToEdit.value = null
}

const handleCourseModalClosed = () => {
  courseModal.closeModal() // 确保调用 useModal 的 closeModal
  courseToEdit.value = null
}

const openAddStudentModal = () => {
  if (!selectedCourseId.value) {
    ElMessage.warning('请先选择一个课程以添加学生')
    return
  }
  const course = courseStore.userCourses.find((c) => c._id === selectedCourseId.value)
  if (course) {
    addStudentModalTargetCourse.value = course
    addStudentModal.openModal('为课程添加新学生')
  } else {
    ElMessage.error('未能找到选中的课程信息')
  }
}

const handleStudentAdded = (/* addedStudent */) => {
  // addStudentModal.closeModal(); // Modal 组件内部处理
  // StudentListMenu 会自动因为 studentStore.studentsInCurrentCourse 的变化而更新
  // 如果需要自动导航到新添加的学生，可以在这里处理
}

const handleAddStudentModalClosed = () => {
  addStudentModal.closeModal()
  addStudentModalTargetCourse.value = null
}

onMounted(async () => {
  // 优先从路由参数恢复状态
  const params = route.params
  await courseStore.fetchUserCourses() // 总是先获取课程列表

  if (params.courseId && courseStore.userCourses.some((c) => c._id === params.courseId)) {
    selectedCourseId.value = params.courseId
    const course = courseStore.userCourses.find((c) => c._id === params.courseId)
    courseStore.setCurrentCourse(course) // 设置到 store
    await studentStore.fetchStudentsInCourse(params.courseId)

    if (
      params.studentId &&
      studentStore.studentsInCurrentCourse.some((s) => s._id === params.studentId)
    ) {
      const student = studentStore.studentsInCurrentCourse.find((s) => s._id === params.studentId)
      studentStore.setCurrentStudent(student) // 设置到 store
    } else {
      studentStore.setCurrentStudent(null)
      // 如果有课程但没有有效学生ID，并且当前不是欢迎页，可以考虑导航到欢迎页或课程的默认视图
      if (
        route.name !== 'WelcomePage' &&
        route.name !== 'Login' &&
        !route.fullPath.endsWith(params.courseId) &&
        !route.fullPath.includes('/students/')
      ) {
        // router.push({ name: 'WelcomePage' }); // 或课程的概览页
      }
    }
  } else {
    // 如果URL中没有有效的courseId，则清空选择，并导航到欢迎页
    selectedCourseId.value = null
    courseStore.setCurrentCourse(null)
    studentStore.clearStudents()
    if (route.name !== 'WelcomePage' && route.name !== 'Login') {
      router.push({ name: 'WelcomePage' })
    }
  }
})

// 监听路由变化以同步UI状态 (如selectedCourseId)
watch(
  () => route.fullPath,
  async (newFullPath, oldFullPath) => {
    if (newFullPath === oldFullPath) return

    const newCourseIdParam = route.params.courseId
    const newStudentIdParam = route.params.studentId

    // 1. 处理课程ID变化
    if (newCourseIdParam) {
      if (newCourseIdParam !== selectedCourseId.value) {
        // 如果路由的课程ID与当前选中的不同
        if (courseStore.userCourses.length === 0) await courseStore.fetchUserCourses() // 确保有课程列表

        const courseExists = courseStore.userCourses.some((c) => c._id === newCourseIdParam)
        if (courseExists) {
          selectedCourseId.value = newCourseIdParam // 同步下拉框
          const course = courseStore.userCourses.find((c) => c._id === newCourseIdParam)
          courseStore.setCurrentCourse(course) // 更新store
          await studentStore.fetchStudentsInCourse(newCourseIdParam) // 加载新课程的学生
        } else {
          // 路由中的课程ID无效，清空所有选择并导航到欢迎页
          selectedCourseId.value = null
          courseStore.setCurrentCourse(null)
          studentStore.clearStudents()
          if (route.name !== 'WelcomePage') router.push({ name: 'WelcomePage' })
          return // 提前退出，因为课程无效，学生也无需处理
        }
      }
    } else {
      // 如果路由中没有课程ID (例如导航到了欢迎页)
      if (selectedCourseId.value !== null) {
        // 但当前UI还选中着课程
        selectedCourseId.value = null // 清空下拉框
        courseStore.setCurrentCourse(null) // 清空store
        studentStore.clearStudents() // 清空学生
      }
    }

    // 2. 处理学生ID变化 (必须在有效课程的前提下)
    if (newCourseIdParam) {
      // 只有当课程ID有效时才处理学生ID
      if (newStudentIdParam) {
        // 确保学生列表已为当前课程加载
        if (studentStore.studentsInCurrentCourse.some((s) => s._id === newStudentIdParam)) {
          const student = studentStore.studentsInCurrentCourse.find(
            (s) => s._id === newStudentIdParam,
          )
          studentStore.setCurrentStudent(student)
        } else {
          // 如果学生ID无效或不在当前课程学生列表中，清除当前学生
          studentStore.setCurrentStudent(null)
        }
      } else {
        // 如果路由中没有学生ID
        studentStore.setCurrentStudent(null) // 清除当前学生
      }
    } else {
      // 如果路由中没有课程ID，也意味着没有学生
      studentStore.setCurrentStudent(null)
    }
  },
  { deep: true },
) // deep: true 确保params对象内部变化也能被监听到
</script>

<style scoped>
.sidebar-container {
  transition: width 0.28s;
  box-shadow: 2px 0 6px rgba(0, 21, 41, 0.35);
}
.main-content-container {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.el-main {
  flex: 1;
  /* padding: 20px; /* 移除这里的内边距，让 router-view 占满 */
  background-color: #f0f2f5;
  overflow-y: auto; /* 让 router-view 内部可以滚动 */
}

.right-sidebar-container {
  background-color: #fff;
  /* padding: 0; */ /* el-scrollbar 会有内边距 */
  border-left: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  box-shadow: -2px 0 6px rgba(0, 21, 41, 0.15);
}
.right-sidebar-container h3,
.right-sidebar-container h4 {
  color: #303133;
  margin-bottom: 10px;
}
.right-sidebar-container p {
  font-size: 14px;
  color: #606266;
  line-height: 1.6;
  margin-bottom: 8px;
}
.right-sidebar-container .el-button + .el-button {
  margin-left: 10px;
}
.right-sidebar-container .el-divider {
  margin: 15px 0;
}

.fade-main-enter-active,
.fade-main-leave-active {
  transition: opacity 0.2s ease-in-out;
}
.fade-main-enter-from,
.fade-main-leave-to {
  opacity: 0;
}
</style>
