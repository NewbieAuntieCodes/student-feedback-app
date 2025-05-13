//src/layouts/AppSidebar.vue
<template>
  <el-aside width="280px" class="app-sidebar">
    <div class="sidebar-actions">
      <el-button
        type="primary"
        size="small"
        @click="emitOpenCreateCourseDialog"
        :icon="CirclePlus"
        data-testid="create-course-btn"
        class="create-course-btn"
      >
        创建新课程
      </el-button>
    </div>

    <el-scrollbar class="sidebar-menu" :native="false">
      <div class="course-group">
        <h4 class="group-title">正在上课</h4>
        <div
          v-if="
            courseStore.isLoading ||
            (activeCourses.length > 0 &&
              studentStore.isLoadingAllActive &&
              !allActiveStudentsLoadedOnce)
          "
          class="loading-placeholder"
        >
          <el-icon class="is-loading"><Loading /></el-icon> 加载中...
        </div>
        <div v-else-if="activeCourses.length > 0">
          <div v-for="course in activeCourses" :key="course._id" class="course-section">
            <div class="course-header-active">
              <span class="course-name-active" :title="course.name">{{ course.name }}</span>
              <el-tooltip content="添加学生到本课程" placement="top">
                <el-button
                  text
                  circle
                  type="primary"
                  size="small"
                  @click.stop="emitOpenAddStudentDialog(course)"
                  :icon="User"
                  class="add-student-btn-inline"
                  data-testid="add-student-btn-inline"
                />
              </el-tooltip>
            </div>
            <div
              v-if="studentStore.isLoadingAllActive && !studentsByCourseId(course._id).length"
              class="loading-placeholder indented"
            >
              <el-icon class="is-loading"><Loading /></el-icon> 学生加载中...
            </div>
            <ul v-else-if="studentsByCourseId(course._id).length > 0" class="student-list">
              <li
                v-for="student in studentsByCourseId(course._id)"
                :key="student._id"
                @click="selectStudent(course, student)"
                :class="{ 'is-active': isActiveStudent(course._id, student._id) }"
                class="student-item"
                :title="student.name"
              >
                <span class="student-info">
                  <span class="student-name">{{ student.name }}</span>
                  <el-tag size="small" type="info" effect="plain" class="student-grade-badge">{{
                    student.grade || 'N/A'
                  }}</el-tag>
                </span>
                <span class="student-status-indicators">
                  <el-tooltip v-if="student.status === 'learning'" content="进行中" placement="top">
                    <span class="status-dot learning"></span>
                  </el-tooltip>
                  <el-tooltip
                    v-if="student.status === 'completed'"
                    content="已学完该课程"
                    placement="top"
                  >
                    <span class="status-dot completed"></span>
                  </el-tooltip>
                  <el-tooltip v-if="student.needsAttention" content="需关注" placement="top">
                    <el-icon color="#E6A23C" :size="14"><Warning /></el-icon>
                  </el-tooltip>
                  <el-tooltip v-if="student.specialAttention" content="特关注" placement="top">
                    <el-icon color="#F56C6C" :size="14"><Star /></el-icon>
                  </el-tooltip>
                </span>
              </li>
            </ul>
            <p
              v-else-if="
                !studentStore.isLoadingAllActive ||
                (studentStore.isLoadingAllActive && allActiveStudentsLoadedOnce)
              "
              class="no-students-placeholder indented"
            >
              该课程暂无学生
            </p>
          </div>
        </div>
        <p v-else-if="!courseStore.isLoading" class="no-courses-placeholder">暂无正在上课的课程</p>
      </div>

      <div class="course-group">
        <h4 class="group-title">已完课</h4>
        <div
          v-if="courseStore.isLoading && completedCourses.length === 0"
          class="loading-placeholder"
        >
          <el-icon class="is-loading"><Loading /></el-icon> 加载中...
        </div>
        <el-collapse
          v-else-if="completedCourses.length > 0"
          v-model="completedCourseExpandedNames"
          @change="handleCompletedCourseExpand"
          accordion
        >
          <el-collapse-item
            v-for="course in completedCourses"
            :key="course._id"
            :name="course._id"
            class="course-item"
          >
            <template #title>
              <span class="course-name" :title="course.name">{{ course.name }}</span>
            </template>
            <div
              v-if="studentStore.isLoading && courseToLoadStudents === course._id"
              class="loading-placeholder indented"
            >
              <el-icon class="is-loading"><Loading /></el-icon> 加载学生...
            </div>
            <ul v-else-if="studentsByCourseId(course._id).length > 0" class="student-list">
              <li
                v-for="student in studentsByCourseId(course._id)"
                :key="student._id"
                @click="selectStudent(course, student)"
                :class="{ 'is-active': isActiveStudent(course._id, student._id) }"
                class="student-item"
                :title="student.name"
              >
                <span class="student-info">
                  <span class="student-name">{{ student.name }}</span>
                  <el-tag size="small" type="info" effect="plain" class="student-grade-badge">{{
                    student.grade || 'N/A'
                  }}</el-tag>
                </span>
                <span class="student-status-indicators">
                  <el-tooltip
                    v-if="student.status === 'learning'"
                    content="进行中 (历史状态)"
                    placement="top"
                  >
                    <span class="status-dot learning-history"></span>
                  </el-tooltip>
                  <el-tooltip
                    v-if="student.status === 'completed'"
                    content="已学完该课程"
                    placement="top"
                  >
                    <span class="status-dot completed"></span>
                  </el-tooltip>
                  <el-tooltip v-if="student.needsAttention" content="需关注" placement="top">
                    <el-icon color="#E6A23C" :size="14"><Warning /></el-icon>
                  </el-tooltip>
                  <el-tooltip v-if="student.specialAttention" content="特关注" placement="top">
                    <el-icon color="#F56C6C" :size="14"><Star /></el-icon>
                  </el-tooltip>
                </span>
              </li>
            </ul>
            <p
              v-else-if="
                studentStore.allStudentsByCourse.hasOwnProperty(course._id) &&
                studentsByCourseId(course._id).length === 0 &&
                !(studentStore.isLoading && courseToLoadStudents === course._id)
              "
              class="no-students-placeholder indented"
            >
              该课程暂无学生
            </p>
            <p
              v-else-if="!(studentStore.isLoading && courseToLoadStudents === course._id)"
              class="no-students-placeholder indented"
            >
              点击展开加载学生
            </p>
          </el-collapse-item>
        </el-collapse>
        <p v-else-if="!courseStore.isLoading" class="no-courses-placeholder">暂无已完课的课程</p>
      </div>
    </el-scrollbar>
  </el-aside>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useCourseStore } from '@/store/courseStore'
import { useStudentStore } from '@/store/studentStore'
import { useRouter, useRoute } from 'vue-router'
import {
  ElAside,
  ElButton,
  ElScrollbar,
  ElCollapse,
  ElCollapseItem,
  ElIcon,
  ElTag, // 新增 ElTag
  ElTooltip, // 新增 ElTooltip
} from 'element-plus'
import {
  CirclePlus,
  Loading,
  User,
  Warning, // 确保已导入
  Star, // 确保已导入
  // CircleCheckFilled, // 你可以用这个或者自定义的dot
} from '@element-plus/icons-vue'

const courseStore = useCourseStore()
const studentStore = useStudentStore()
const router = useRouter()
const route = useRoute()

const activeCourses = computed(() => courseStore.activeCourses)
const completedCourses = computed(() => courseStore.completedCourses)

// 用于跟踪“正在上课”的学生是否已至少完成一次批量加载的标记
const allActiveStudentsLoadedOnce = ref(false) // 新增

// activeCourseExpandedNames 不再需要，因为“正在上课”课程不再是折叠项
const completedCourseExpandedNames = ref('') // 仅用于“已完课”课程的折叠

const courseToLoadStudents = ref(null) // 用于“已完课”课程的学生懒加载

const studentsByCourseId = (courseId) => {
  if (!courseId) return []
  return studentStore.studentsInCourse(courseId)
}

// 监听 studentStore.isLoadingAllActive 状态，以更新 allActiveStudentsLoadedOnce
watch(
  () => studentStore.isLoadingAllActive,
  (newValue, oldValue) => {
    if (oldValue === true && newValue === false) {
      allActiveStudentsLoadedOnce.value = true
    }
  },
)

// `handleCompletedCourseExpand` 函数基本保持不变，它用于懒加载“已完课”课程的学生
const handleCompletedCourseExpand = async (expandedCourseIdArrayOrId) => {
  // ElCollapse 在 accordion 模式下，change 事件的参数是当前展开项的 name (string) 或空字符串 (如果都折叠了)
  // 非 accordion 模式下是 name 组成的数组。 此处 v-model 对应 accordion，所以是 string
  const courseId = Array.isArray(expandedCourseIdArrayOrId)
    ? expandedCourseIdArrayOrId[0] // 虽然不太可能在 accordion 模式下是数组，但做个兼容
    : expandedCourseIdArrayOrId

  completedCourseExpandedNames.value = courseId || '' // 更新 v-model 绑定的值

  if (courseId) {
    const course = completedCourses.value.find((c) => c._id === courseId)
    if (course) {
      // 检查该课程的学生是否已加载
      // 并且确保不是正在为这个课程加载学生
      const studentsAlreadyLoaded =
        studentStore.allStudentsByCourse[course._id] &&
        studentStore.allStudentsByCourse[course._id].length > 0
      const studentsAttemptedButEmpty =
        studentStore.allStudentsByCourse.hasOwnProperty(course._id) &&
        studentStore.allStudentsByCourse[course._id].length === 0

      if (
        !studentsAlreadyLoaded &&
        !studentsAttemptedButEmpty && // 仅当学生数据完全不存在时才加载
        courseToLoadStudents.value !== course._id
      ) {
        courseToLoadStudents.value = course._id
        console.log(
          `[AppSidebar] Lazily fetching students for completed course: ${course.name} (ID: ${course._id})`,
        )
        try {
          await studentStore.fetchStudentsInCourseAndSetCurrent(course._id, null)
          console.log(`[AppSidebar] Students fetched for ${course.name}`)
        } catch (error) {
          console.error(
            `[AppSidebar] Error fetching students for completed course ${course._id}:`,
            error,
          )
        } finally {
          if (courseToLoadStudents.value === course._id) {
            courseToLoadStudents.value = null
          }
        }
      } else if (studentsAlreadyLoaded || studentsAttemptedButEmpty) {
        console.log(
          `[AppSidebar] Students for completed course ${course.name} already loaded or list is known to be empty.`,
        )
      }
    }
  }
}

const isActiveStudent = (courseId, studentId) => {
  return route.params.courseId === courseId && route.params.studentId === studentId
}

const selectStudent = (course, student) => {
  if (!course || !student || !course._id || !student._id) {
    console.error('[AppSidebar] Invalid course or student object for navigation.')
    return
  }
  // Pinia store 更新应当由路由同步逻辑 (useRouteCourseSync) 或页面自身处理，这里只负责导航
  // if (courseStore.selectedCourse?._id !== course._id) {
  //   courseStore.setCurrentCourse(course); // setCurrentCourse 应该只设置，不触发额外加载
  // }
  // if (studentStore.selectedStudent?._id !== student._id) {
  //   studentStore.setCurrentStudent(student);
  // }

  router.push({
    // 假设你的学生详情页路由名称是 'StudentDashboardPage' 或类似，并且它会重定向到第一个tab
    // 或者直接导航到第一个tab的路由名称
    name: 'StudentClassFeedback', // 确保这是你学生反馈tab的路由名称
    params: { courseId: course._id, studentId: student._id },
  })
}

const emit = defineEmits(['open-create-course-dialog', 'open-add-student-dialog'])

const emitOpenCreateCourseDialog = () => {
  emit('open-create-course-dialog')
}

const emitOpenAddStudentDialog = (course) => {
  if (course && course._id) {
    // AppLayout 会监听这个事件，并把 course 传给 AddStudentModal
    // 可以在 AddStudentModal 打开时，将此 course 设置为默认选中课程
    // courseStore.setCurrentCourse(course); // 可选：如果添加学生时希望课程面板也同步更新选中的课程
    emit('open-add-student-dialog', course)
  } else {
    console.error('[AppSidebar] Cannot open add student dialog, course data is invalid.', course)
  }
}

// 当路由变化时，确保“已完课”课程的折叠状态与当前选中的学生对应课程一致
watch(
  () => route.params,
  (newParams) => {
    if (newParams.courseId) {
      const targetCourseIsCompleted = completedCourses.value.some(
        (c) => c._id === newParams.courseId,
      )
      if (targetCourseIsCompleted) {
        if (completedCourseExpandedNames.value !== newParams.courseId) {
          completedCourseExpandedNames.value = newParams.courseId
          // 如果学生数据未加载 (例如直接通过URL访问)，则触发加载
          // 检查 allStudentsByCourse[newParams.courseId] 是否存在且有内容
          const studentsForCompletedCourse = studentStore.allStudentsByCourse[newParams.courseId]
          if (!studentsForCompletedCourse || studentsForCompletedCourse.length === 0) {
            // 进一步检查是否是因为尚未尝试加载
            if (!studentStore.allStudentsByCourse.hasOwnProperty(newParams.courseId)) {
              handleCompletedCourseExpand(newParams.courseId)
            }
          }
        }
      } else {
        // 如果选中的学生属于一个“正在上课”的课程，则不需要操作折叠面板
        // 也可以选择性地折叠所有“已完课”课程
        // completedCourseExpandedNames.value = ''; // 可选
      }
    } else {
      // 没有选中课程，可以折叠所有“已完课”
      // completedCourseExpandedNames.value = ''; // 可选
    }
  },
  { immediate: true, deep: true }, // immediate: true 确保组件加载时基于当前路由设置状态
)

// 组件挂载时，确保课程数据被加载。
// 最佳实践是在 App.vue 或布局组件中统一进行初始数据加载。
// 此处作为一个补充或后备。
onMounted(async () => {
  if (courseStore.courses.length === 0 && !courseStore.isLoading) {
    console.log(
      '[AppSidebar onMounted] No courses found, fetching user courses with active students...',
    )
    await courseStore.fetchUserCourses({ loadStudentsForActive: true })
  } else if (
    activeCourses.value.length > 0 &&
    !studentStore.isLoadingAllActive &&
    !allActiveStudentsLoadedOnce.value
  ) {
    // 如果课程已存在，但“正在上课”的学生数据可能未加载（例如，在 fetchUserCourses 时 loadStudentsForActive 为 false）
    // 则再次尝试加载“正在上课”课程的学生
    console.log(
      '[AppSidebar onMounted] Active courses exist, ensuring their students are loaded...',
    )
    const activeCourseIds = activeCourses.value.map((c) => c._id)
    const needsLoading = activeCourseIds.some((id) => !studentStore.allStudentsByCourse[id])
    if (needsLoading) {
      await studentStore.fetchAllStudentsForCourses(activeCourseIds)
    } else {
      allActiveStudentsLoadedOnce.value = true // 如果所有学生都已存在，也标记为已加载过
    }
  } else if (studentStore.isLoadingAllActive === false && activeCourses.value.length > 0) {
    // 如果 studentStore.isLoadingAllActive 已经是 false，说明加载尝试已完成，标记一下
    allActiveStudentsLoadedOnce.value = true
  }
})
</script>

<style scoped>
.app-sidebar {
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #fdfdfd; /* 更淡的背景 */
  font-size: 13px; /* 整体字体略微调小 */
}

.sidebar-actions {
  padding: 10px 15px;
  flex-shrink: 0;
  border-bottom: 1px solid #eef0f2; /* 更淡的分割线 */
  background-color: #fff;
}
.create-course-btn {
  width: auto; /* 不再占满整行 */
  /* margin-bottom: 0; */ /* 如果需要更紧凑 */
}

.sidebar-menu {
  flex-grow: 1;
}

.course-group {
  margin-bottom: 5px; /* 组间距 */
}

.group-title {
  font-size: 12px;
  color: #888; /* 标题颜色调深一些 */
  padding: 10px 15px 8px 15px;
  margin: 0;
  font-weight: 600; /* 标题加粗一点 */
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background-color: #f7f8fa; /* 分组标题背景 */
  border-top: 1px solid #eef0f2;
  border-bottom: 1px solid #eef0f2;
}
.course-group:first-of-type .group-title {
  border-top: none; /* 第一个分组无上边框 */
}

/* “正在上课”课程区域样式 */
.course-section {
  background-color: #fff;
  /* border-bottom: 1px solid #f5f5f5; */ /* 每个课程块下的细线，可选 */
}
.course-header-active {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 15px;
  font-weight: 500;
  font-size: 14px;
  color: #333;
  border-bottom: 1px solid #f0f2f5; /* 课程名下的分割线 */
}
.course-name-active {
  flex-grow: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: default; /* 如果课程名本身不可点击 */
}
.add-student-btn-inline.el-button.is-text {
  /* 确保text button样式 */
  padding: 5px; /* 调整图标按钮的内边距 */
  margin-left: 8px;
  color: #409eff; /* 图标颜色 */
}
.add-student-btn-inline.el-button.is-text:hover {
  background-color: #ecf5ff;
}

/* “已完课”课程的 el-collapse 样式 */
.course-item :deep(.el-collapse-item__header) {
  font-size: 14px;
  font-weight: 500;
  padding-left: 15px;
  padding-right: 15px;
  height: 38px;
  line-height: 38px;
  border-bottom: 1px solid #f0f2f5; /* 统一用更淡的分割线 */
  background-color: #fff;
  color: #333;
}
.course-item :deep(.el-collapse-item__header:hover) {
  background-color: #f9f9f9;
}
.course-item :deep(.el-collapse-item__wrap) {
  border-bottom: none;
  background-color: #fcfcfc; /* 学生列表背景 */
}
.course-item :deep(.el-collapse-item__content) {
  padding-top: 5px;
  padding-bottom: 5px;
  padding-left: 0;
  padding-right: 0;
}
.course-name {
  /* el-collapse 标题内的课程名 */
  flex-grow: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 学生列表通用样式 */
.student-list {
  list-style: none;
  padding-left: 0;
  margin: 0;
}
.student-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 15px 7px 25px; /* 左侧缩进多一点 */
  cursor: pointer;
  font-size: 13px;
  color: #555;
  border-bottom: 1px solid #f5f7fa; /* 学生项之间的分割线，非常淡 */
  transition: background-color 0.2s ease;
}
.student-item:last-child {
  border-bottom: none;
}
.student-item:hover {
  background-color: #ecf5ff;
}
.student-item.is-active {
  background-color: #409eff !important;
  color: #fff !important;
  font-weight: 500;
}
.student-item.is-active .student-name,
.student-item.is-active .student-grade-badge {
  color: #fff !important;
}
.student-item.is-active .student-grade-badge {
  background-color: rgba(255, 255, 255, 0.2); /* 激活时徽章背景 */
}

.student-info {
  display: flex;
  align-items: center;
  flex-grow: 1;
  overflow: hidden; /* 防止内容溢出影响布局 */
}
.student-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-right: 6px;
}
.student-grade-badge {
  flex-shrink: 0; /* 防止被压缩 */
  font-size: 11px;
  height: 18px;
  line-height: 18px;
  padding: 0 5px;
}
.student-status-indicators {
  display: flex;
  align-items: center;
  gap: 6px; /* 图标间距 */
  margin-left: 8px; /* 和学生信息隔开 */
  flex-shrink: 0;
}
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}
.status-dot.learning {
  background-color: #67c23a; /* 绿色 - 进行中 */
}
.status-dot.completed {
  background-color: #909399; /* 灰色 - 已完成 */
}
.status-dot.learning-history {
  /* 已完课课程中的学生，如果之前是进行中 */
  background-color: #c0c4cc; /* 更淡的灰色 */
}

/* 加载及占位符样式 */
.loading-placeholder,
.no-courses-placeholder,
.no-students-placeholder {
  padding: 10px 15px;
  color: #aaa;
  font-size: 12px;
  text-align: center;
}
.loading-placeholder.indented,
.no-students-placeholder.indented {
  padding-left: 25px;
  text-align: left;
}
.loading-placeholder .el-icon,
.no-students-placeholder .el-icon {
  margin-right: 4px;
  vertical-align: middle;
}

:deep(.el-scrollbar__wrap) {
  overflow-x: hidden;
}
</style>
