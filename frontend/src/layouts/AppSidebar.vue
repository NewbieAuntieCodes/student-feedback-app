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
            (studentStore.isLoadingAllActive &&
              !allActiveStudentsLoadedOnce &&
              coursesForOngoingSection.length === 0)
          "
          class="loading-placeholder"
        >
          <el-icon class="is-loading"><Loading /></el-icon> 加载中...
        </div>
        <div v-else-if="coursesForOngoingSection.length > 0">
          <div v-for="course in coursesForOngoingSection" :key="course._id" class="course-section">
            <div
              class="course-header-active"
              @click="selectCourse(course._id)"
              :class="{ 'is-active-course': isActiveCourse(course._id) }"
            >
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
                !studentStore.isLoadingAllActive ||
                (studentStore.isLoadingAllActive && allActiveStudentsLoadedOnce)
              "
              class="no-students-placeholder indented"
            >
              该课程暂无进行中的学生
            </p>
            <div
              v-else-if="studentStore.isLoadingAllActive && !allActiveStudentsLoadedOnce"
              class="loading-placeholder indented"
            >
              <el-icon class="is-loading"><Loading /></el-icon> 学生加载中...
            </div>
          </div>
        </div>
        <p
          v-else-if="
            !courseStore.isLoading || (courseStore.isLoading && allActiveStudentsLoadedOnce)
          "
          class="no-courses-placeholder"
        >
          暂无正在上课的课程
        </p>
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
              <div
                class="course-collapse-title-wrapper"
                @click.stop="selectCourse(course._id)"
                :class="{ 'is-active-course': isActiveCourse(course._id) }"
              >
                <span class="course-name" :title="course.name"
                  >{{ course.name }} ({{
                    completedStudentsInCourse(course._id).length
                  }}
                  位已完成)</span
                >
              </div>
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
              该课程暂无已完成的学生
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
import { CirclePlus, Loading, User, WarningFilled, StarFilled } from '@element-plus/icons-vue'

const courseStore = useCourseStore()
const studentStore = useStudentStore()
const router = useRouter()
const route = useRoute()

// --- 状态和 Refs ---
const allActiveStudentsLoadedOnce = ref(false)
const completedCourseExpandedNames = ref('')
const courseToLoadStudents = ref(null)

// --- 辅助函数 ---
const getStudentsInCourseFromStore = (courseId) => {
  if (!courseId) return []
  return studentStore.studentsInCourse(courseId) || [] // 确保总是返回数组
}

const ongoingStudentsInCourse = (courseId) => {
  return getStudentsInCourseFromStore(courseId).filter((student) => student.status === 'ongoing')
}

const completedStudentsInCourse = (courseId) => {
  return getStudentsInCourseFromStore(courseId).filter((student) => student.status === 'completed')
}

// --- 计算属性 ---
// “正在上课”区域显示的课程: 直接使用所有 active 状态的课程
const coursesForOngoingSection = computed(() => {
  // console.log('[AppSidebar] Recalculating coursesForOngoingSection. activeCourses from store:', JSON.parse(JSON.stringify(courseStore.activeCourses)));
  return courseStore.activeCourses
})

// “已完课学生”区域显示的课程: 任何课程，只要它至少有1个 completed 学生
const coursesForCompletedSection = computed(() => {
  // console.log('[AppSidebar] Recalculating coursesForCompletedSection. All courses from store:', JSON.parse(JSON.stringify(courseStore.courses)));
  const filtered = courseStore.courses.filter((course) => {
    const completedCount = completedStudentsInCourse(course._id).length
    // if (completedCount > 0) {
    //   console.log(`[AppSidebar] Course ${course.name} has ${completedCount} completed students.`);
    // }
    return completedCount > 0
  })
  // console.log('[AppSidebar] coursesForCompletedSection result:', JSON.parse(JSON.stringify(filtered)));
  return filtered
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
    const course = courseStore.courses.find((c) => c._id === courseId)
    if (course) {
      const studentsInStore = getStudentsInCourseFromStore(course._id)
      const needsLazyLoad =
        course.status === 'completed' &&
        !studentStore.allStudentsByCourse.hasOwnProperty(course._id) && // 检查是否已尝试加载
        courseToLoadStudents.value !== course._id

      const needsRetryLoadForEmptyCompleted =
        course.status === 'completed' &&
        studentStore.allStudentsByCourse.hasOwnProperty(course._id) &&
        studentsInStore.length === 0 && // 本地有记录但列表为空
        courseToLoadStudents.value !== course._id

      if (needsLazyLoad || needsRetryLoadForEmptyCompleted) {
        courseToLoadStudents.value = course._id
        // console.log(`[AppSidebar] Lazily fetching students for completed course in '已完课学生' section: ${course.name} (ID: ${course._id})`);
        try {
          await studentStore.fetchStudentsInCourseAndSetCurrent(course._id, null)
          // console.log(`[AppSidebar] Students fetched for ${course.name}`);
        } catch (error) {
          console.error(`[AppSidebar] Error fetching students for course ${course._id}:`, error)
        } finally {
          if (courseToLoadStudents.value === course._id) {
            courseToLoadStudents.value = null
          }
        }
      } else {
        //  console.log(`[AppSidebar] Students for course ${course.name} in '已完课学生' section already loaded or course is active.`);
      }
    }
  }
}

// --- 【新增】方法 ---
const selectCourse = async (courseId) => {
  if (!courseId) {
    console.warn('[AppSidebar selectCourse] courseId is missing.')
    return
  }

  console.log(`[AppSidebar selectCourse] Selecting course with ID: ${courseId}`)

  // 1. 调用 store action 来获取课程详情并设置 currentCourse
  // 这个 action 应该是异步的，并且会处理加载状态和错误
  await courseStore.selectCourse(courseId)
  // courseStore.selectCourse 内部应该在成功获取课程详情后，
  // 如果之前有选中的学生，会清空 studentStore.currentStudent，
  // 因为我们现在只选中了课程。

  // 2. 处理路由跳转逻辑
  // 只有当 courseStore.currentCourse 成功被设置（即课程有效且已加载）后才考虑跳转
  if (courseStore.currentCourse && courseStore.currentCourse._id === courseId) {
    // 检查当前路由是否需要改变：
    // - 如果当前不在 WelcomePage
    // - 或者当前路由的 courseId 与新选的不同 (虽然 selectCourse 应该已经更新了 store)
    // - 或者当前路由仍有 studentId (因为我们只选中了课程，应清除学生上下文)
    const needsNavigation =
      route.name !== 'WelcomePage' || // 如果当前不是 WelcomePage
      (route.params.courseId && route.params.courseId !== courseId) || // 如果当前路由的 courseId 不匹配
      route.params.studentId // 如果当前路由还有 studentId

    if (needsNavigation) {
      console.log('[AppSidebar selectCourse] Navigating to WelcomePage.')
      // 确保在跳转前，如果 studentStore 中还有 currentStudent，则清空它
      // (虽然 courseStore.selectCourse 内部也可能处理了，但这里可以再次确认)
      if (studentStore.currentStudent) {
        studentStore.setCurrentStudent(null)
      }
      router.push({ name: 'WelcomePage' }) // 导航到 WelcomePage，不带任何参数
    } else {
      // 如果当前已经是 WelcomePage 并且没有 studentId，
      // 或者已经是目标课程的某个页面但没有 studentId (这种情况比较少见，除非您有专门的课程概览页)
      // 可能不需要强制跳转，因为状态已经通过 store 更新了。
      // 但如果WelcomePage会根据 courseStore.currentCourse显示不同内容，则可能不需要跳转。
      // 鉴于WelcomePage是静态的，且我们清空了studentId，跳转到WelcomePage通常是合理的。
      console.log(
        '[AppSidebar selectCourse] Already on a suitable page or no navigation needed based on current logic.',
      )
    }
  } else {
    // 如果 courseStore.selectCourse 执行后，currentCourse 没有被正确设置，
    // (例如课程ID无效，API调用失败等)，则不进行导航或导航到错误/默认页面。
    // courseStore.selectCourse 内部应该已经处理了错误状态。
    console.warn(
      `[AppSidebar selectCourse] currentCourse in store is not set correctly after selecting course ${courseId}. No navigation will occur.`,
    )
  }
}
const isActiveStudent = (courseId, studentId) => {
  return route.params.courseId === courseId && route.params.studentId === studentId
}

const isActiveCourse = (courseId) => {
  // 当前选中的课程 (courseStore.currentCourse) 且没有选中学生 (studentStore.currentStudent 为 null)
  // 或者当前路由只精确匹配到 courseId，没有 studentId
  return (
    courseStore.currentCourse &&
    courseStore.currentCourse._id === courseId &&
    !studentStore.currentStudent
  )
  // 或者可以更简单地只基于 store.currentCourse
  // return courseStore.currentCourse && courseStore.currentCourse._id === courseId;
}
// --- 结束 【新增】方法 ---

// --- 【修改】selectStudent 方法 ---
// 当选中学生时，也应该确保对应的课程是选中的（虽然当前UI结构可能已经保证了）
// 并且清除仅选中课程的高亮状态
const selectStudent = async (course, student) => {
  // 改为 async
  if (!course || !student || !course._id || !student._id) {
    console.error('[AppSidebar] Invalid course or student object for navigation.')
    return
  }
  // 先确保课程是选中的 (如果 store 逻辑复杂，这一步可以保证状态正确)
  // 如果 courseStore.selectCourse 内部处理学生加载会冲突，则需要调整
  // 鉴于 selectCourse 内部会加载学生，这里可能只需要设置学生
  if (!courseStore.currentCourse || courseStore.currentCourse._id !== course._id) {
    await courseStore.selectCourse(course._id) // 确保课程详情已加载
  }
  // 然后设置当前学生
  studentStore.setCurrentStudent(student) // 【新增】明确设置当前学生

  router.push({
    name: 'StudentClassFeedback', // 或者您的学生档案页 StudentProfileTabPage
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
  async (newParams, oldParams) => {
    const newCourseId = newParams.courseId
    const newStudentId = newParams.studentId

    // --- 1. 处理“已完课学生”区域的展开和懒加载 ---
    if (newCourseId) {
      const targetCourseInCompletedSection = coursesForCompletedSection.value.find(
        (c) => c._id === newCourseId,
      )

      if (targetCourseInCompletedSection) {
        if (completedCourseExpandedNames.value !== newCourseId) {
          completedCourseExpandedNames.value = newCourseId
        }
        // 确保 handleCompletedCourseExpand 内部有逻辑避免重复或无效加载
        await handleCompletedCourseExpand(newCourseId)
      }
    } else {
      // 如果路由中没有 courseId，可能需要收起所有已完课课程的展开项
      // completedCourseExpandedNames.value = ''; // 取决于您的产品逻辑
    }

    // --- 2. 根据路由参数处理课程和学生的选中状态 ---
    if (newCourseId && !newStudentId) {
      // 情况 A: 路由中只有 courseId
      console.log(`[Watch Route Params] Only courseId (${newCourseId}) detected.`)
      if (
        !courseStore.currentCourse ||
        courseStore.currentCourse._id !== newCourseId ||
        studentStore.currentStudent // 如果之前选中了学生，现在只选课程，则需要更新
      ) {
        await selectCourse(newCourseId) // 本地定义的 selectCourse 方法
      }
    } else if (newCourseId && newStudentId) {
      // 情况 B: 路由中同时有 courseId 和 studentId
      console.log(
        `[Watch Route Params] CourseId (${newCourseId}) and StudentId (${newStudentId}) detected.`,
      )

      // 确保课程被选中并加载了详情
      if (!courseStore.currentCourse || courseStore.currentCourse._id !== newCourseId) {
        await courseStore.selectCourse(newCourseId) // 调用 store action, 它会加载课程和学生
      }

      // 在课程和其学生都已加载的前提下, 确保学生被选中
      // courseStore.selectCourse 应该已经触发了 studentStore.fetchStudentsInCourseAndSetCurrent
      // 我们需要等待 studentStore 更新完毕
      // 一个简单的方式是再次调用，或者依赖 studentStore 内部的逻辑来设置 currentStudent
      // 为确保，可以在 studentStore.fetchStudentsInCourseAndSetCurrent 内部，如果 studentId 存在，就设置 currentStudent
      // 或者在这里显式设置，但要确保学生数据已存在于 studentStore.studentsInCourse(newCourseId)
      // 此处假设 courseStore.selectCourse 已经处理了学生加载和可能的 studentId 选中
      // 如果 studentStore.fetchStudentsInCourseAndSetCurrent(courseId, studentId) 在 courseStore.selectCourse 中被调用
      // 并且它在找到学生后会设置 studentStore.currentStudent，那么这里的逻辑可能只需要确保 courseStore.selectCourse 被调用
      // 为保险起见，可以再调用一次 studentStore 的方法来确保 studentId 被设置
      if (courseStore.currentCourse && courseStore.currentCourse._id === newCourseId) {
        // 检查学生是否已经是当前学生，或者尝试设置
        if (!studentStore.currentStudent || studentStore.currentStudent._id !== newStudentId) {
          // 尝试从已加载的学生列表中找到并设置
          const student = studentStore
            .studentsInCourse(newCourseId)
            .find((s) => s._id === newStudentId)
          if (student) {
            studentStore.setCurrentStudent(student)
          } else {
            // 如果学生不在已加载列表，则需要 studentStore.fetchStudentsInCourseAndSetCurrent 来加载并设置
            await studentStore.fetchStudentsInCourseAndSetCurrent(newCourseId, newStudentId)
          }
        }
      }
    } else if (!newCourseId && !newStudentId) {
      // 情况 C: 路由中既没有 courseId 也没有 studentId (例如 /welcome)
      // 清空当前选中的课程和学生
      console.log('[Watch Route Params] No courseId/studentId. Clearing selections.')
      if (courseStore.currentCourse) {
        courseStore.setCurrentCourse(null) // 调用 store action 清空课程
      }
      if (studentStore.currentStudent) {
        studentStore.setCurrentStudent(null) // 调用 store action 清空学生
      }
    }
  },
  { immediate: true, deep: true },
)

onMounted(async () => {
  if (courseStore.courses.length === 0 && !courseStore.isLoading) {
    // console.log('[AppSidebar onMounted] No courses found, fetching user courses with active students...');
    await courseStore.fetchUserCourses({ loadStudentsForActive: true })
  } else if (
    courseStore.activeCourses.length > 0 &&
    !studentStore.isLoadingAllActive &&
    !allActiveStudentsLoadedOnce.value
  ) {
    // console.log('[AppSidebar onMounted] Active courses exist, ensuring their students are loaded if not already attempted...');
    const activeCourseIds = courseStore.activeCourses.map((c) => c._id)
    // 只为那些尚未在 allStudentsByCourse 中有记录的 active 课程加载学生
    const coursesToLoadStudentsFor = activeCourseIds.filter(
      (id) => !studentStore.allStudentsByCourse.hasOwnProperty(id),
    )
    if (coursesToLoadStudentsFor.length > 0) {
      // console.log('[AppSidebar onMounted] Fetching students for active courses that were not loaded yet:', coursesToLoadStudentsFor);
      await studentStore.fetchAllStudentsForCourses(coursesToLoadStudentsFor)
    } else {
      allActiveStudentsLoadedOnce.value = true // 所有 active 课程的学生记录都已存在（可能为空数组）
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

/* 【新增】课程高亮样式 */
.course-header-active.is-active-course,
.course-collapse-title-wrapper.is-active-course {
  background-color: #d9ecff; /* 淡蓝色背景作为课程选中高亮 */
  /* border-left: 3px solid #409eff; */ /* 左侧边框高亮 */
  /* color: #409eff; */ /* 文本颜色高亮 */
}
.course-header-active.is-active-course .course-name-active,
.course-collapse-title-wrapper.is-active-course .course-name {
  font-weight: 600; /* 加粗字体 */
}

/* 【调整】学生选中时的样式，确保与课程选中样式有区分或协调 */
.student-item.is-active {
  background-color: #409eff !important; /* Element Plus 主题色 */
  color: #fff !important;
  font-weight: 500;
}
.student-item.is-active .student-name,
.student-item.is-active .student-grade-badge {
  color: #fff !important;
}
</style>
