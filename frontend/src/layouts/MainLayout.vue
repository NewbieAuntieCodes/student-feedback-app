<template>
  <el-container style="height: 100vh">
    <el-aside
      width="260px"
      style="
        background-color: #304156;
        display: flex;
        flex-direction: column;
        border-right: 1px solid #444851;
      "
    >
      <div style="padding: 15px; border-bottom: 1px solid #2a394b">
        <el-form-item
          label="选择课程:"
          label-position="top"
          style="margin-bottom: 5px; color: #bfcbd9"
        >
          <el-select
            v-model="selectedCourseId"
            placeholder="选择课程"
            style="width: 100%"
            clearable
            filterable
            @change="handleCourseSelectionChange"
            :loading="courseStore.isLoading"
            size="small"
          >
            <el-option
              v-for="course in courseStore.userCourses"
              :key="course._id"
              :label="course.name"
              :value="course._id"
            />
          </el-select>
        </el-form-item>
        <el-button
          type="primary"
          plain
          size="small"
          @click="openCreateCourseDialog"
          style="width: 100%; margin-top: 8px"
          :icon="CirclePlusFilled"
        >
          创建新课程
        </el-button>
        <el-button
          v-if="selectedCourseId"
          type="success"
          plain
          size="small"
          @click="openAddStudentDialog(courseStore.selectedCourse)"
          style="width: 100%; margin-top: 8px"
          :icon="User"
        >
          添加学生到当前课程
        </el-button>
      </div>

      <el-scrollbar style="flex-grow: 1">
        <div
          v-if="courseStore.isLoading && courseStore.userCourses.length === 0"
          class="loading-placeholder"
        >
          加载课程中...
        </div>
        <div
          v-else-if="!selectedCourseId && !courseStore.isLoading"
          class="loading-placeholder"
          style="padding-top: 20px"
        >
          请先选择一个课程
        </div>
        <div
          v-else-if="studentStore.isLoading && selectedCourseId"
          class="loading-placeholder-small"
        >
          <el-icon class="is-loading" :size="16"><Loading /></el-icon> 加载学生...
        </div>
        <el-menu
          :default-active="activeStudentMenuIndex"
          class="el-menu-vertical-students"
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#409EFF"
          v-else-if="selectedCourseId && studentStore.studentsInCurrentCourse.length > 0"
        >
          <el-menu-item class="menu-header-title">
            <span>当前课程学生:</span>
          </el-menu-item>
          <el-menu-item
            v-for="student in studentStore.studentsInCurrentCourse"
            :key="student._id"
            :index="generateStudentRoute(selectedCourseId, student._id)"
            @click="navigateToStudent(selectedCourseId, student._id)"
            class="student-menu-item"
          >
            <el-icon><Avatar /></el-icon>
            <span class="student-name">{{ student.name }}</span>
            <div class="student-status-icons-simple">
              <el-tooltip v-if="student.status === 'completed'" content="已完成" placement="top">
                <el-icon color="#909399" size="12"><CircleCheckFilled /></el-icon>
              </el-tooltip>
              <el-tooltip v-if="student.needsAttention" content="需关注" placement="top">
                <el-icon color="#E6A23C" size="12"><WarningFilled /></el-icon>
              </el-tooltip>
              <el-tooltip v-if="student.specialAttention" content="特关注" placement="top">
                <el-icon color="#F56C6C" size="12"><StarFilled /></el-icon>
              </el-tooltip>
            </div>
            <el-tag size="small" type="info" effect="plain">{{ student.grade || 'N/A' }}</el-tag>
          </el-menu-item>
        </el-menu>
        <div
          v-else-if="
            selectedCourseId &&
            !studentStore.isLoading &&
            studentStore.studentsInCurrentCourse.length === 0
          "
          class="no-students-placeholder"
        >
          该课程下暂无学生
        </div>
      </el-scrollbar>
    </el-aside>

    <el-container direction="vertical" class="main-content-container">
      <el-header
        style="
          text-align: right;
          font-size: 12px;
          border-bottom: 1px solid #eee;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background-color: #fff;
          color: #303133;
          line-height: 60px;
          height: 60px;
          padding: 0 20px;
          box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
        "
      >
        <span>欢迎您，{{ authStore.currentUser?.username }}！</span>
        <el-button type="danger" plain @click="logout" :icon="SwitchButton">退出登录</el-button>
      </el-header>
      <el-main
        style="
          padding: 0px;
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

    <el-aside
      width="280px"
      style="
        background-color: #fff;
        padding: 0;
        border-left: 1px solid #e0e0e0;
        display: flex;
        flex-direction: column;
      "
    >
      <el-scrollbar style="flex-grow: 1; padding: 15px">
        <h3>右边栏</h3>
        <p>这里是右边栏的默认内容。</p>
      </el-scrollbar>
    </el-aside>

    <el-dialog
      v-model="courseDialog.visible"
      :title="courseDialog.title"
      width="450px"
      :close-on-click-modal="false"
      @closed="resetCourseForm"
    >
      <el-form
        ref="courseFormRef"
        :model="courseForm"
        :rules="courseRules"
        label-width="80px"
        label-position="right"
      >
        <el-form-item label="课程名称" prop="name">
          <el-input v-model="courseForm.name" placeholder="请输入课程名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="courseDialog.visible = false">取消</el-button>
          <el-button type="primary" @click="submitCourseForm" :loading="courseDialog.isSubmitting">
            {{ courseDialog.isEdit ? '保存更改' : '确定创建' }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog
      v-model="addStudentDialog.visible"
      title="为课程添加新学生"
      width="450px"
      :close-on-click-modal="false"
      @closed="resetStudentForm"
    >
      <div v-if="addStudentDialog.targetCourse">
        <strong>课程: {{ addStudentDialog.targetCourse.name }}</strong>
      </div>
      <el-form
        ref="addStudentFormRef"
        :model="newStudentForm"
        :rules="addStudentRules"
        label-width="80px"
        label-position="right"
        style="margin-top: 15px"
      >
        <el-form-item label="学生姓名" prop="name">
          <el-input v-model="newStudentForm.name" placeholder="请输入学生姓名" />
        </el-form-item>
        <el-form-item label="年级" prop="grade">
          <el-input v-model="newStudentForm.grade" placeholder="例如: 高一 / 三年级" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="addStudentDialog.visible = false">取消</el-button>
          <el-button
            type="primary"
            @click="handleAddStudent"
            :loading="addStudentDialog.isSubmitting"
          >
            确定添加
          </el-button>
        </span>
      </template>
    </el-dialog>
  </el-container>
</template>

<script setup>
// src/layouts/MainLayout.vue - <script setup> 部分

import { ref, reactive, onMounted, watch, computed, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  UserFilled,
  CirclePlusFilled,
  Avatar,
  SwitchButton,
  Loading,
  School,
  CircleCheckFilled,
  VideoPlay,
  WarningFilled,
  StarFilled,
  User, // 确保 User 图标已引入
} from '@element-plus/icons-vue' // User 图标用于 "添加学生" 按钮
import { useAuthStore } from '../store/authStore'
import { useCourseStore } from '../store/courseStore'
import { useStudentStore } from '../store/studentStore'
import { ElMessage, ElMessageBox } from 'element-plus' // ElScrollbar, ElTag 已在模板中使用，无需显式导入 script

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const courseStore = useCourseStore()
const studentStore = useStudentStore()

const selectedCourseId = ref(null) // 用于 el-select 绑定

// --- 课程 Dialog ---
const courseFormRef = ref(null)
const courseDialog = reactive({
  visible: false,
  title: '创建新课程',
  isEdit: false, // 在这个简化版本中，我们主要关注创建，编辑可以后续添加或通过其他方式
  isSubmitting: false,
  courseIdToEdit: null,
})
const courseForm = reactive({ name: '' })
const courseRules = reactive({
  name: [{ required: true, message: '课程名称不能为空', trigger: 'blur' }],
})

const openCreateCourseDialog = () => {
  courseDialog.title = '创建新课程'
  courseDialog.isEdit = false
  courseForm.name = ''
  courseDialog.visible = true
  nextTick(() => courseFormRef.value?.clearValidate())
}

const resetCourseForm = () => {
  // 对话框关闭时可以重置
  courseForm.name = ''
  if (courseFormRef.value) {
    courseFormRef.value.clearValidate()
  }
}

const submitCourseForm = async () => {
  if (!courseFormRef.value) return
  await courseFormRef.value.validate(async (valid) => {
    if (valid) {
      courseDialog.isSubmitting = true
      let success = false
      let createdOrUpdatedCourse = null

      if (courseDialog.isEdit && courseDialog.courseIdToEdit) {
        // 如果要支持编辑，确保 courseStore.updateCourse action 存在且正确
        createdOrUpdatedCourse = await courseStore.updateCourse(courseDialog.courseIdToEdit, {
          name: courseForm.name,
        })
        success = !!createdOrUpdatedCourse
      } else {
        createdOrUpdatedCourse = await courseStore.createCourse({ name: courseForm.name })
        success = !!createdOrUpdatedCourse
      }
      courseDialog.isSubmitting = false

      if (success && createdOrUpdatedCourse) {
        ElMessage.success(courseDialog.isEdit ? '课程更新成功！' : '课程创建成功！')
        courseDialog.visible = false
        if (!courseDialog.isEdit) {
          // 如果是创建，则自动选中
          selectedCourseId.value = createdOrUpdatedCourse._id
          handleCourseSelectionChange(createdOrUpdatedCourse._id)
        } else {
          // 如果是编辑，重新获取课程列表以刷新名称（或者store action内部已处理）
          // await courseStore.fetchUserCourses(); // 确保列表更新
        }
      } else {
        const specificError = courseDialog.isEdit
          ? courseStore.updateCourseError
          : courseStore.createCourseError
        ElMessage.error(
          specificError ||
            courseStore.error ||
            (courseDialog.isEdit ? '课程更新失败' : '课程创建失败'),
        )
      }
    }
  })
}

// --- 添加学生 Dialog ---
const addStudentFormRef = ref(null)
const addStudentDialog = reactive({
  visible: false,
  isSubmitting: false,
  targetCourse: null, // 存储要为其添加学生的课程对象
})
const newStudentForm = reactive({ name: '', grade: '' })
const addStudentRules = reactive({
  name: [{ required: true, message: '学生姓名不能为空', trigger: 'blur' }],
})

const openAddStudentDialog = (course) => {
  if (!course && selectedCourseId.value) {
    // 如果未直接传入 course，尝试从 selectedCourseId 获取
    course = courseStore.userCourses.find((c) => c._id === selectedCourseId.value)
  }
  if (!course) {
    ElMessage.warning('请先选择一个课程')
    return
  }
  addStudentDialog.targetCourse = course
  newStudentForm.name = ''
  newStudentForm.grade = ''
  addStudentDialog.visible = true
  nextTick(() => addStudentFormRef.value?.clearValidate())
}

const resetStudentForm = () => {
  newStudentForm.name = ''
  newStudentForm.grade = ''
  if (addStudentFormRef.value) {
    addStudentFormRef.value.clearValidate()
  }
}

const handleAddStudent = async () => {
  if (!addStudentFormRef.value || !addStudentDialog.targetCourse) return
  await addStudentFormRef.value.validate(async (valid) => {
    if (valid) {
      addStudentDialog.isSubmitting = true
      const studentData = { name: newStudentForm.name, grade: newStudentForm.grade }
      const addedStudent = await studentStore.addStudentToCourse(
        addStudentDialog.targetCourse._id,
        studentData,
      )
      addStudentDialog.isSubmitting = false

      if (addedStudent) {
        ElMessage.success(`学生 "${addedStudent.name}" 添加成功！`)
        addStudentDialog.visible = false
        // studentStore.addStudentToCourse 应该已经更新了 students 列表
        // 如果没有，需要手动刷新: await studentStore.fetchStudentsInCourse(addStudentDialog.targetCourse._id);
      } else {
        ElMessage.error(studentStore.addStudentError || studentStore.error || '添加学生失败')
      }
    }
  })
}

// --- 学生列表和导航 ---
const activeStudentMenuIndex = computed(() => {
  if (route.name && (route.name === 'StudentDashboard' || route.name.startsWith('Student'))) {
    const { courseId, studentId } = route.params
    // 确保 courseId 与当前下拉框选中的 courseId 一致
    if (courseId && studentId && courseId === selectedCourseId.value) {
      return generateStudentRoute(courseId, studentId)
    }
  }
  return '' // 如果不匹配或没有选中课程，则不激活任何学生项
})

const generateStudentRoute = (courseId, studentId) => {
  // 确保导航到默认的 feedback 标签页
  return `/courses/${courseId}/students/${studentId}/feedback`
}

const navigateToStudent = (courseId, studentId) => {
  const course = courseStore.userCourses.find((c) => c._id === courseId)
  if (course) courseStore.setCurrentCourse(course) // 设置当前课程到 store

  const student = studentStore.studentsInCurrentCourse.find((s) => s._id === studentId)
  if (student) studentStore.setCurrentStudent(student) // 设置当前学生到 store

  const targetRoute = generateStudentRoute(courseId, studentId)
  if (route.fullPath !== targetRoute) {
    // 避免重复导航
    router.push(targetRoute)
  }
}

const handleCourseSelectionChange = async (courseId) => {
  console.log('[MainLayout] Course selection changed to:', courseId)
  studentStore.clearStudents() // 清空学生列表和当前学生
  studentStore.setCurrentStudent(null)

  if (courseId) {
    const course = courseStore.userCourses.find((c) => c._id === courseId)
    courseStore.setCurrentCourse(course || null) // 更新 store 中的当前课程
    if (course) {
      console.log('[MainLayout] Fetching students for course:', courseId)
      await studentStore.fetchStudentsInCourse(courseId)
      console.log('[MainLayout] Students fetched:', studentStore.studentsInCurrentCourse.length)
    }
    // 课程改变后，不自动导航到学生，而是先导航到欢迎页，让用户点击学生
    if (route.name !== 'WelcomePage' && route.name !== 'Login') {
      router.push({ name: 'WelcomePage' })
    }
  } else {
    // courseId 被清空
    courseStore.setCurrentCourse(null)
    console.log('[MainLayout] Course selection cleared. Navigating to WelcomePage.')
    if (route.name !== 'WelcomePage' && route.name !== 'Login') {
      router.push({ name: 'WelcomePage' })
    }
  }
}

const logout = () => {
  authStore.logout() // authStore.logout() 内部会导航到 /login
  selectedCourseId.value = null
  courseStore.setCurrentCourse(null)
  studentStore.clearStudents()
  studentStore.setCurrentStudent(null)
}

onMounted(async () => {
  console.log('[MainLayout] Component Mounted (Dropdown Version)')
  await courseStore.fetchUserCourses()
  console.log('[MainLayout] Courses fetched, count:', courseStore.userCourses.length)

  const params = route.params
  let shouldNavigateToWelcome = true

  if (params.courseId && courseStore.userCourses.some((c) => c._id === params.courseId)) {
    selectedCourseId.value = params.courseId // 同步下拉框的选中状态
    const course = courseStore.userCourses.find((c) => c._id === params.courseId)
    courseStore.setCurrentCourse(course || null)
    await studentStore.fetchStudentsInCourse(params.courseId)

    if (
      params.studentId &&
      studentStore.studentsInCurrentCourse.some((s) => s._id === params.studentId)
    ) {
      const student = studentStore.studentsInCurrentCourse.find((s) => s._id === params.studentId)
      studentStore.setCurrentStudent(student || null)
      shouldNavigateToWelcome = false // 因为已经成功恢复了学生，不需要去欢迎页
    } else {
      studentStore.setCurrentStudent(null)
    }
  } else {
    // URL 中没有有效的 courseId，或者课程列表为空
    selectedCourseId.value = null
    courseStore.setCurrentCourse(null)
    studentStore.clearStudents()
    studentStore.setCurrentStudent(null)
  }

  if (
    shouldNavigateToWelcome &&
    route.name !== 'WelcomePage' &&
    route.name !== 'Login' &&
    !params.studentId
  ) {
    // 只有在没有成功恢复学生选择，并且当前不是欢迎页或登录页时才跳转
    console.log('[MainLayout] onMounted: Navigating to WelcomePage.')
    router.push({ name: 'WelcomePage' })
  }
  console.log('[MainLayout] onMounted: End. Selected courseId:', selectedCourseId.value)
})

// 监听路由参数变化，以同步 selectedCourseId 下拉框 (主要用于浏览器前进后退)
watch(
  () => route.params.courseId,
  async (newCourseIdParam, oldCourseIdParam) => {
    if (
      newCourseIdParam &&
      newCourseIdParam !== oldCourseIdParam &&
      newCourseIdParam !== selectedCourseId.value
    ) {
      // 只有当路由参数的 courseId 变化，并且与当前下拉框选中的值不同时才处理
      // 以避免 handleCourseSelectionChange 和这个 watch 互相触发
      console.log('[MainLayout] Watch route.params.courseId changed to:', newCourseIdParam)
      if (courseStore.userCourses.length === 0 && !courseStore.isLoading) {
        await courseStore.fetchUserCourses()
      }
      const courseExistsInStore = courseStore.userCourses.some((c) => c._id === newCourseIdParam)
      if (courseExistsInStore) {
        selectedCourseId.value = newCourseIdParam // 同步下拉框
        // 触发学生加载 (handleCourseSelectionChange 也会做，但这里是为了确保路由驱动)
        const course = courseStore.userCourses.find((c) => c._id === newCourseIdParam)
        courseStore.setCurrentCourse(course || null)
        if (course) {
          await studentStore.fetchStudentsInCourse(newCourseIdParam)
          // 学生选中状态将由 URL 的 studentId 参数和 activeStudentMenuIndex 处理
          // 如果 URL 中没有 studentId，则 currentStudent 会是 null
          if (
            route.params.studentId &&
            studentStore.studentsInCurrentCourse.some((s) => s._id === route.params.studentId)
          ) {
            const student = studentStore.studentsInCurrentCourse.find(
              (s) => s._id === route.params.studentId,
            )
            studentStore.setCurrentStudent(student)
          } else {
            studentStore.setCurrentStudent(null)
          }
        }
      } else {
        console.warn(
          '[MainLayout] Watch: Course ID from route params not found in store. Navigating to Welcome.',
        )
        selectedCourseId.value = null
        handleCourseSelectionChange(null) // 清空并导航到欢迎页
      }
    } else if (!newCourseIdParam && selectedCourseId.value) {
      // URL 中的 courseId 消失了 (例如从学生页返回到 Welcome 页)，但下拉框可能还有值
      // selectedCourseId.value = null; // 清空下拉框
      // handleCourseSelectionChange(null); // 触发清空逻辑
    }
  },
  { immediate: false },
) // immediate: false 因为 onMounted 会处理初始状态
</script>

<style scoped>
.sidebar-header {
  background-color: #263445;
}
.el-form-item--small .el-form-item__label {
  /* 调整 label 颜色 */
  color: #bfcbd9;
}
.el-menu-vertical-students {
  border-right: none;
}
.el-menu-item:hover {
  background-color: #263445 !important;
}
.student-menu-item.is-active {
  background-color: #1f2d3d !important;
  color: #409eff !important;
}
.student-menu-item {
  display: flex !important;
  align-items: center !important;
}
.student-name {
  flex-grow: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-right: 5px;
}
.student-status-icons-simple {
  display: flex;
  align-items: center;
  margin-left: auto;
  gap: 4px; /* 图标间距 */
}
.student-menu-item .el-tag {
  margin-left: 8px;
  flex-shrink: 0;
}
.loading-placeholder,
.no-students-placeholder,
.loading-placeholder-small {
  color: #8492a6;
  font-size: 13px;
  text-align: center;
  padding: 15px 0;
}
.loading-placeholder-small {
  padding: 8px 0;
  font-size: 12px;
}
.menu-header-title {
  opacity: 0.7;
  font-size: 12px;
  height: 30px;
  line-height: 30px;
  padding-left: 20px !important;
  pointer-events: none; /* 不可点击 */
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
