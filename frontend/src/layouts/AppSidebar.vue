<template>
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
      :model-value="selectedCourseId"
      @update:modelValue="handleCourseSelection"
      @course-selected="handleCourseSelectedInternal"
      @open-create-course-dialog="emit('open-create-course-dialog')"
      @open-add-student-dialog="emit('open-add-student-dialog')"
    />
    <StudentListMenu
      :selectedCourseId="selectedCourseId"
      :students="studentStore.studentsInCurrentCourse"
      :isLoadingCourses="courseStore.isLoading && courseStore.userCourses.length === 0"
      :isLoadingStudents="studentStore.isLoading && !!selectedCourseId"
      :courses="courseStore.userCourses"
    />
  </el-aside>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElAside } from 'element-plus'
import CourseManagementPanel from '@/components/course/CourseManagementPanel.vue'
import StudentListMenu from '@/components/student/StudentListMenu.vue'
import { useCourseStore } from '@/store/courseStore'
import { useStudentStore } from '@/store/studentStore'

const emit = defineEmits([
  'course-selected-sidebar',
  'open-create-course-dialog',
  'open-add-student-dialog',
])

const courseStore = useCourseStore()
const studentStore = useStudentStore()
const route = useRoute()
const router = useRouter()

const selectedCourseId = ref(null)

// 当课程管理面板的 v-model 更新时
const handleCourseSelection = (courseId) => {
  selectedCourseId.value = courseId
  // 触发一个更通用的事件，让父组件知道课程变了
  emit('course-selected-sidebar', courseId)
}

// CourseManagementPanel 可能会直接 emit 'course-selected'
const handleCourseSelectedInternal = (courseId) => {
  selectedCourseId.value = courseId
  emit('course-selected-sidebar', courseId)
}

// 从路由参数初始化或当 store 课程列表加载后
const initializeSelectedCourse = () => {
  const courseIdFromRoute = route.params.courseId
  if (courseIdFromRoute && courseStore.userCourses.some((c) => c._id === courseIdFromRoute)) {
    selectedCourseId.value = courseIdFromRoute
  } else if (courseStore.userCourses.length > 0) {
    // 可选：如果路由中没有，但有课程列表，默认选中第一个或不选
    // selectedCourseId.value = courseStore.userCourses[0]._id;
    // emit('course-selected-sidebar', selectedCourseId.value);
  }
}

onMounted(async () => {
  if (courseStore.userCourses.length === 0) {
    await courseStore.fetchUserCourses()
  }
  initializeSelectedCourse()
})

watch(
  () => route.params.courseId,
  (newCourseId) => {
    if (newCourseId && courseStore.userCourses.some((c) => c._id === newCourseId)) {
      if (selectedCourseId.value !== newCourseId) {
        selectedCourseId.value = newCourseId
        // 不需要 emit，因为这是响应路由变化，父组件的 watch 会处理
      }
    } else if (!newCourseId && selectedCourseId.value) {
      // 如果路由清除了课程ID
      selectedCourseId.value = null
    }
  },
)

// 监听 Pinia store 中课程列表的变化，以便在课程被异步加载后初始化 selectedCourseId
watch(
  () => courseStore.userCourses,
  (newCourses) => {
    if (newCourses.length > 0 && !selectedCourseId.value && route.params.courseId) {
      initializeSelectedCourse()
    }
  },
  { deep: true },
)
</script>

<style scoped>
.sidebar-container {
  transition: width 0.28s;
  box-shadow: 2px 0 6px rgba(0, 21, 41, 0.35);
}
</style>
