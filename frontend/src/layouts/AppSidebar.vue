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
            (studentStore.isLoadingAllActive && !allActiveStudentsLoadedOnce)
          "
          class="loading-placeholder"
        >
          <el-icon class="is-loading"><Loading /></el-icon> 加载中...
        </div>
        <div v-else-if="coursesForOngoingSection.length > 0">
          <div v-for="course in coursesForOngoingSection" :key="course._id" class="course-section">
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
                />
              </el-tooltip>
            </div>
            <ul
              v-if="ongoingStudentsInCourse(course._id).length > 0"
              class="student-list ongoing-students"
            >
              <li
                v-for="student in ongoingStudentsInCourse(course._id)"
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
                  <el-tooltip v-if="student.status === 'ongoing'" content="进行中" placement="top"
                    ><span class="status-dot learning"></span
                  ></el-tooltip>
                  <el-tooltip v-if="student.needsAttention" content="需关注" placement="top"
                    ><el-icon :size="16" class="status-icon needs-attention-icon"
                      ><WarningFilled /></el-icon
                  ></el-tooltip>
                  <el-tooltip v-if="student.specialAttention" content="特关注" placement="top"
                    ><el-icon :size="16" class="status-icon special-attention-icon"
                      ><StarFilled /></el-icon
                  ></el-tooltip>
                </span>
              </li>
            </ul>
            <p
              v-else-if="
                !studentStore.isLoadingAllActive && ongoingStudentsInCourse(course._id).length === 0
              "
              class="no-students-placeholder indented"
            >
              该课程暂无进行中的学生
            </p>
          </div>
        </div>
        <p v-else-if="!courseStore.isLoading" class="no-courses-placeholder">暂无正在上课的课程</p>
      </div>

      <div class="course-group">
        <h4 class="group-title">已完课学生</h4>
        <div
          v-if="
            courseStore.isLoading &&
            coursesForCompletedSection.length === 0 &&
            !allActiveStudentsLoadedOnce
          "
          class="loading-placeholder"
        >
          <el-icon class="is-loading"><Loading /></el-icon> 加载中...
        </div>
        <el-collapse
          v-else-if="coursesForCompletedSection.length > 0"
          v-model="completedCourseExpandedNames"
          @change="handleCompletedCourseExpand"
          accordion
        >
          <el-collapse-item
            v-for="course in coursesForCompletedSection"
            :key="`completed-${course._id}`"
            :name="course._id"
            class="course-item"
          >
            <template #title>
              <span class="course-name" :title="course.name"
                >{{ course.name }} ({{
                  completedStudentsInCourse(course._id).length
                }}
                位已完成)</span
              >
            </template>
            <div
              v-if="
                studentStore.isLoading &&
                courseToLoadStudents === course._id &&
                completedStudentsInCourse(course._id).length === 0
              "
              class="loading-placeholder indented"
            >
              <el-icon class="is-loading"><Loading /></el-icon> 加载学生...
            </div>
            <ul
              v-else-if="completedStudentsInCourse(course._id).length > 0"
              class="student-list completed-students"
            >
              <li
                v-for="student in completedStudentsInCourse(course._id)"
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
                  <el-tooltip content="已学完" placement="top"
                    ><span class="status-dot completed"></span
                  ></el-tooltip>
                  <el-tooltip v-if="student.needsAttention" content="需关注" placement="top"
                    ><el-icon :size="16" class="status-icon needs-attention-icon"
                      ><WarningFilled /></el-icon
                  ></el-tooltip>
                  <el-tooltip v-if="student.specialAttention" content="特关注" placement="top"
                    ><el-icon :size="16" class="status-icon special-attention-icon"
                      ><StarFilled /></el-icon
                  ></el-tooltip>
                </span>
              </li>
            </ul>
            <p
              v-else-if="
                !studentStore.isLoading &&
                !(courseToLoadStudents === course._id) &&
                completedStudentsInCourse(course._id).length === 0
              "
              class="no-students-placeholder indented"
            >
              该课程暂无已完成的学生 (或正在加载)
            </p>
          </el-collapse-item>
        </el-collapse>
        <p
          v-else-if="
            !courseStore.isLoading || (courseStore.isLoading && allActiveStudentsLoadedOnce)
          "
          class="no-courses-placeholder"
        >
          暂无已完课的学生
        </p>
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
  ElTag,
  ElTooltip,
} from 'element-plus'
import {
  CirclePlus,
  Loading,
  User,
  WarningFilled, // 确保已导入实心图标
  StarFilled, // 确保已导入实心图标
} from '@element-plus/icons-vue'

const courseStore = useCourseStore()
const studentStore = useStudentStore()
const router = useRouter()
const route = useRoute()

// --- 状态和 Refs ---
const allActiveStudentsLoadedOnce = ref(false) // 跟踪“正在上课”的学生是否已至少完成一次批量加载
const completedCourseExpandedNames = ref('') // 用于“已完课学生”区域的课程折叠项 v-model
const courseToLoadStudents = ref(null) // 用于懒加载“已完课学生”区域中，本身是 completed 状态课程的学生

// --- 辅助函数 ---
// 获取指定课程下的所有学生 (从 store)
const getStudentsInCourseFromStore = (courseId) => {
  if (!courseId) return []
  return studentStore.studentsInCourse(courseId) // 假设 studentStore.studentsInCourse(courseId) 返回原始学生数组
}

// 获取指定课程下的进行中学生
const ongoingStudentsInCourse = (courseId) => {
  return getStudentsInCourseFromStore(courseId).filter((student) => student.status === 'ongoing')
}

// 获取指定课程下的已完成学生
const completedStudentsInCourse = (courseId) => {
  return getStudentsInCourseFromStore(courseId).filter((student) => student.status === 'completed')
}

// --- 计算属性 ---
// “正在上课”区域显示的课程 (课程本身 active 且至少有1个 ongoing 学生)
const coursesForOngoingSection = computed(() => {
  return courseStore.activeCourses.filter((course) => {
    return ongoingStudentsInCourse(course._id).length > 0
  })
})

// “已完课学生”区域显示的课程 (任何课程，只要它至少有1个 completed 学生)
const coursesForCompletedSection = computed(() => {
  return courseStore.courses.filter((course) => {
    // 检查所有课程
    return completedStudentsInCourse(course._id).length > 0
  })
})

// --- 方法 ---
watch(
  () => studentStore.isLoadingAllActive,
  (newValue, oldValue) => {
    if (oldValue === true && newValue === false) {
      allActiveStudentsLoadedOnce.value = true
    }
  },
)

const handleCompletedCourseExpand = async (expandedCourseIdArrayOrId) => {
  const courseId = Array.isArray(expandedCourseIdArrayOrId)
    ? expandedCourseIdArrayOrId[0]
    : expandedCourseIdArrayOrId

  completedCourseExpandedNames.value = courseId || ''

  if (courseId) {
    const course = courseStore.courses.find((c) => c._id === courseId) // 从所有课程中查找
    if (course) {
      // 只有当这个课程本身是 'completed' 状态，并且其学生数据尚未加载时，才尝试懒加载
      // 对于 active 课程，其学生（包括 completed 的）应该已经通过 fetchAllStudentsForCourses 加载了
      const studentsInStore = getStudentsInCourseFromStore(course._id)
      const needsLazyLoad =
        course.status === 'completed' &&
        !studentStore.allStudentsByCourse.hasOwnProperty(course._id) &&
        courseToLoadStudents.value !== course._id

      // 或者，如果课程是 completed，且本地虽有记录但学生列表为空，也可能需要重新尝试加载
      const needsRetryLoadForEmptyCompleted =
        course.status === 'completed' &&
        studentStore.allStudentsByCourse.hasOwnProperty(course._id) &&
        studentsInStore.length === 0 &&
        courseToLoadStudents.value !== course._id

      if (needsLazyLoad || needsRetryLoadForEmptyCompleted) {
        courseToLoadStudents.value = course._id
        console.log(
          `[AppSidebar] Lazily fetching students for completed course in '已完课学生' section: ${course.name} (ID: ${course._id})`,
        )
        try {
          await studentStore.fetchStudentsInCourseAndSetCurrent(course._id, null)
          console.log(`[AppSidebar] Students fetched for ${course.name}`)
        } catch (error) {
          console.error(`[AppSidebar] Error fetching students for course ${course._id}:`, error)
        } finally {
          if (courseToLoadStudents.value === course._id) {
            courseToLoadStudents.value = null
          }
        }
      } else {
        console.log(
          `[AppSidebar] Students for course ${course.name} in '已完课学生' section already loaded or course is active.`,
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
  router.push({
    name: 'StudentClassFeedback',
    params: { courseId: course._id, studentId: student._id },
  })
}

const emit = defineEmits(['open-create-course-dialog', 'open-add-student-dialog'])

const emitOpenCreateCourseDialog = () => {
  emit('open-create-course-dialog')
}

const emitOpenAddStudentDialog = (course) => {
  if (course && course._id) {
    emit('open-add-student-dialog', course)
  } else {
    console.error('[AppSidebar] Cannot open add student dialog, course data is invalid.', course)
  }
}

watch(
  () => route.params,
  (newParams) => {
    if (newParams.courseId) {
      const targetCourseInCompletedSection = coursesForCompletedSection.value.find(
        (c) => c._id === newParams.courseId,
      )
      if (targetCourseInCompletedSection) {
        if (completedCourseExpandedNames.value !== newParams.courseId) {
          completedCourseExpandedNames.value = newParams.courseId
          const students = getStudentsInCourseFromStore(newParams.courseId)
          // 如果课程本身是 completed 状态，且学生未加载，则触发懒加载
          if (
            targetCourseInCompletedSection.status === 'completed' &&
            students.length === 0 &&
            !studentStore.allStudentsByCourse.hasOwnProperty(newParams.courseId)
          ) {
            handleCompletedCourseExpand(newParams.courseId)
          }
        }
      }
    }
  },
  { immediate: true, deep: true },
)

onMounted(async () => {
  if (courseStore.courses.length === 0 && !courseStore.isLoading) {
    console.log(
      '[AppSidebar onMounted] No courses found, fetching user courses with active students...',
    )
    await courseStore.fetchUserCourses({ loadStudentsForActive: true })
  } else if (
    courseStore.activeCourses.length > 0 &&
    !studentStore.isLoadingAllActive &&
    !allActiveStudentsLoadedOnce.value
  ) {
    console.log(
      '[AppSidebar onMounted] Active courses exist, ensuring their students are loaded...',
    )
    const activeCourseIds = courseStore.activeCourses.map((c) => c._id)
    const needsLoading = activeCourseIds.some((id) => !studentStore.allStudentsByCourse[id])
    if (needsLoading) {
      await studentStore.fetchAllStudentsForCourses(activeCourseIds)
    } else {
      allActiveStudentsLoadedOnce.value = true
    }
  } else if (studentStore.isLoadingAllActive === false && courseStore.activeCourses.length > 0) {
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
  gap: 7px; /* 图标间距可以稍微调整 */
  margin-left: 8px;
  flex-shrink: 0;
}
.status-icon {
  /* 通用状态图标样式 */
  vertical-align: middle; /* 确保垂直居中对齐 */
}

.needs-attention-icon svg {
  /* 针对 WarningFilled 内部的 svg */
  /* Element Plus 的 WarningFilled 默认是黄色感叹号在黄色背景三角中 */
  /* 如果想自定义颜色，可能需要更复杂的SVG操作或使用自定义SVG图标 */
  /* 简单的颜色覆盖可能不直接生效在多路径SVG上 */
  /* 我们可以尝试直接给 el-icon 设置颜色，WarningFilled 应该会继承 */
}
.needs-attention-icon {
  color: rgb(255, 190, 12); /* 设置 WarningFilled 图标的整体颜色为黄色 */
  /* 如果想让感叹号本身红色，而背景黄色，需要自定义SVG或覆盖更深层的CSS，
     对于 Element Plus Icons，直接修改内部path颜色比较困难。
     一个折中的办法是给它一个黄色的圆形背景，然后图标本身是警告色。
  */
}
.needs-attention-icon.custom-warning-bg {
  /* 一个自定义背景的尝试 */
  background-color: rgba(255, 236, 180, 0.7); /* 淡黄色背景 */
  border-radius: 50%;
  padding: 2px; /* 给背景一点空间 */
  display: inline-flex; /* 配合 padding 和 border-radius */
  align-items: center;
  justify-content: center;
  width: 20px; /* 固定大小 */
  height: 20px;
}
.needs-attention-icon.custom-warning-bg .el-icon svg {
  /* color: #F56C6C; */ /* 尝试让内部感叹号红色，可能无效 */
}

.special-attention-icon {
  color: #f84f4f; /* 直接将 StarFilled 设置为红色 */
}

/* 如果想实现更复杂的背景和前景分离的图标效果（例如黄底红感叹号），
   最佳方式是使用自定义的 SVG 图标，而不是依赖覆盖 Element Plus 默认图标的颜色。
   对于“特别关注五角星变成红底实心的”，StarFilled 本身就是实心的，设置 color: #F56C6C 即可。
*/
.status-dot {
  width: 9px; /* 稍微增大一点 */
  height: 9px;
  border-radius: 50%;
  display: inline-block;
  box-shadow: 0 0 3px rgba(0, 0, 0, 0.2); /* 加一点阴影使其更突出 */
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
