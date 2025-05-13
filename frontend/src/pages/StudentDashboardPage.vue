<template>
  <div class="student-dashboard-page">
    <div v-if="studentStore.selectedStudent && courseStore.selectedCourse" class="dashboard-header">
      <h3>{{ currentStudentName }} - {{ currentCourseName }}</h3>
    </div>
    <div v-else-if="!props.studentId || !props.courseId" class="dashboard-placeholder">
      <p>请先从左侧选择课程和学生。</p>
    </div>
    <div v-else class="dashboard-placeholder">
      <el-icon class="is-loading" :size="20"><Loading /></el-icon>
      <p>正在加载学生数据...</p>
    </div>

    <el-tabs
      v-if="props.studentId && props.courseId"
      v-model="activeTabName"
      class="dashboard-tabs"
      @tab-click="handleTabClick"
    >
      <el-tab-pane label="课堂反馈" name="feedback"></el-tab-pane>
      <el-tab-pane label="学生档案" name="profile"></el-tab-pane>
      <el-tab-pane label="月度总结" name="summary"></el-tab-pane>
    </el-tabs>

    <div class="tab-content" v-if="props.studentId && props.courseId">
      <router-view v-slot="{ Component, route }">
        <transition name="fade-fast" mode="out-in">
          <component :is="Component" :key="route.fullPath" />
        </transition>
      </router-view>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useStudentStore } from '../store/studentStore'
import { useCourseStore } from '../store/courseStore'
import { Loading } from '@element-plus/icons-vue' // 引入 Loading 图标

const props = defineProps({
  courseId: String,
  studentId: String,
})

const router = useRouter()
const route = useRoute()
const studentStore = useStudentStore()
const courseStore = useCourseStore()

const activeTabName = ref('feedback') // 默认激活的标签页

const currentStudentName = computed(() => studentStore.selectedStudent?.name || '未知学生')
const currentCourseName = computed(() => courseStore.selectedCourse?.name || '未知课程')

const updateActiveTabFromRoute = () => {
  // console.log(`[StudentDashboardPage] updateActiveTabFromRoute triggered. Route name: ${route.name}`);
  // console.log(`[StudentDashboardPage] Props received: courseId=${props.courseId}, studentId=${props.studentId}`);
  // console.log(`[StudentDashboardPage] Store state: selectedCourseId=${courseStore.selectedCourse?._id}, selectedStudentId=${studentStore.selectedStudent?._id}`);

  // 1. 同步当前课程
  if (
    props.courseId &&
    (!courseStore.selectedCourse || courseStore.selectedCourse._id !== props.courseId)
  ) {
    // console.warn(`[StudentDashboardPage] Course data for ${props.courseId} (props) mismatched/missing in store. Attempting to find in userCourses list.`);
    console.log(
      '[StudentDashboardPage] courseStore.userCourses before find:',
      JSON.parse(JSON.stringify(courseStore.userCourses)),
    ) // 调试输出：查看 userCourses 的内容

    const courseFromList = courseStore.userCourses.find((c) => c._id === props.courseId)

    if (courseFromList) {
      // console.log('[StudentDashboardPage] Found course in userCourses, setting it as current:', JSON.parse(JSON.stringify(courseFromList)));
      courseStore.setCurrentCourse(courseFromList)
    } else {
      // console.warn(`[StudentDashboardPage] Course with ID ${props.courseId} not found in courseStore.userCourses. This might be okay if MainLayout/AppInit handles fetching it later or if it's a new course not yet in the list.`);
    }
  }

  // 2. 同步当前学生 (基于已同步或已存在的 selectedCourse)
  if (
    props.studentId &&
    (!studentStore.selectedStudent || studentStore.selectedStudent._id !== props.studentId)
  ) {
    // console.warn(`[StudentDashboardPage] Student data for ${props.studentId} (props) mismatched/missing in store. Attempting to find in studentsInCurrentCourse list.`);

    // 确保 courseStore.selectedCourse 是最新的，因为 studentsInCurrentCourse 依赖它
    const currentSelectedCourse = courseStore.selectedCourse
    if (currentSelectedCourse && currentSelectedCourse._id === props.courseId) {
      // 再次确认课程ID匹配
      const currentCourseStudents = studentStore.studentsInCurrentCourse // 这个 getter 现在应该总是返回数组

      console.log(
        `[StudentDashboardPage] studentStore.studentsInCurrentCourse for course ${props.courseId} before find:`,
        JSON.parse(JSON.stringify(currentCourseStudents)),
      ) // 调试输出

      if (Array.isArray(currentCourseStudents)) {
        const studentFromList = currentCourseStudents.find((s) => s._id === props.studentId)

        if (studentFromList) {
          // console.log('[StudentDashboardPage] Found student in studentsInCurrentCourse, setting it as current:', JSON.parse(JSON.stringify(studentFromList)));
          studentStore.setCurrentStudent(studentFromList)
        } else {
          // console.warn(`[StudentDashboardPage] Student with ID ${props.studentId} not found in students for course ${props.courseId}. The student list might be empty or student doesn't belong to this course according to current store state.`);
        }
      } else {
        // 理论上，由于 getter 的修改，这里不应该再是 undefined，而应该是 []
        console.error(
          '[StudentDashboardPage] studentStore.studentsInCurrentCourse did NOT return an array. Value:',
          currentCourseStudents,
        )
      }
    } else {
      // console.warn(`[StudentDashboardPage] Cannot find student because current selected course in store (ID: ${currentSelectedCourse?._id}) does not match props.courseId (${props.courseId}). Waiting for course to sync.`);
    }
  }

  // 3. 根据当前路由名称更新激活的 tab
  const routeName = route.name
  if (routeName === 'StudentClassFeedback') {
    activeTabName.value = 'feedback'
  } else if (routeName === 'StudentProfileTab') {
    activeTabName.value = 'profile'
  } else if (routeName === 'StudentMonthlySummaryTab') {
    activeTabName.value = 'summary'
  }
  // console.log(`[StudentDashboardPage] Active tab set to: ${activeTabName.value}`);
}

onMounted(() => {
  // console.log('StudentDashboardPage: Component Mounted.');
  updateActiveTabFromRoute()
})

watch(
  () => route.name,
  (newName, oldName) => {
    if (newName !== oldName) {
      // console.log(`StudentDashboardPage: Route name changed from ${oldName} to ${newName}.`);
      updateActiveTabFromRoute()
    }
  },
)

watch(
  () => [props.courseId, props.studentId],
  ([newCourseId, newStudentId], [oldCourseId, oldStudentId]) => {
    if (newCourseId !== oldCourseId || newStudentId !== oldStudentId) {
      // console.log(`StudentDashboardPage: Props changed. New courseId: ${newCourseId}, new studentId: ${newStudentId}`);
      updateActiveTabFromRoute()
    }
  },
  { deep: true },
)

const handleTabClick = (tab) => {
  const tabName = tab.props.name
  let targetRouteName = ''

  if (tabName === 'feedback') {
    targetRouteName = 'StudentClassFeedback'
  } else if (tabName === 'profile') {
    targetRouteName = 'StudentProfileTab'
  } else if (tabName === 'summary') {
    targetRouteName = 'StudentMonthlySummaryTab'
  }

  if (targetRouteName && targetRouteName !== route.name) {
    router.push({
      name: targetRouteName,
      params: {
        courseId: props.courseId, // 从 props 获取，确保是最新的
        studentId: props.studentId, // 从 props 获取
      },
    })
  }
}
</script>

<style scoped>
.student-dashboard-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  /* padding is removed conflitto allow tab-content to control its own padding better */
}
.dashboard-header {
  padding: 15px 20px; /* Added padding for the header */
  border-bottom: 1px solid #e4e7ed;
  flex-shrink: 0; /* Prevent header from shrinking */
}
.dashboard-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}
.dashboard-placeholder {
  text-align: center;
  padding: 40px 20px;
  color: #909399;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
}
.dashboard-tabs {
  flex-shrink: 0;
  padding: 0 20px; /* Add padding to tabs container */
}
:deep(.el-tabs__header) {
  margin-bottom: 0;
}
:deep(.el-tabs__nav-wrap::after) {
  height: 1px;
  background-color: #e4e7ed; /* Ensure line is visible */
}
.tab-content {
  flex-grow: 1;
  overflow-y: auto;
  padding: 20px; /* Content padding */
}
.fade-fast-enter-active,
.fade-fast-leave-active {
  transition: opacity 0.15s ease;
}
.fade-fast-enter-from,
.fade-fast-leave-to {
  opacity: 0;
}
</style>
