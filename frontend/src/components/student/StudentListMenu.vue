//src/components/student/StudentListMenu.vue
<template>
  <el-scrollbar style="flex-grow: 1" class="student-list-menu-scrollbar">
    <div v-if="isLoadingCourses && (!courses || courses.length === 0)" class="placeholder-text">
      加载课程中...
    </div>
    <div
      v-else-if="!selectedCourseId && !isLoadingCourses"
      class="placeholder-text"
      style="padding-top: 20px"
    >
      请先选择一个课程
    </div>
    <div v-else-if="isLoadingStudents && selectedCourseId" class="placeholder-text small">
      <el-icon class="is-loading" :size="16"><Loading /></el-icon> 加载学生...
    </div>
    <el-menu
      :default-active="activeStudentRoute"
      class="el-menu-vertical-students"
      background-color="#304156"
      text-color="#bfcbd9"
      active-text-color="#409EFF"
      v-else-if="selectedCourseId && students.length > 0"
    >
      <el-menu-item class="menu-header-title">
        <span>当前课程学生:</span>
      </el-menu-item>
      <el-menu-item
        v-for="student in students"
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
      v-else-if="selectedCourseId && !isLoadingStudents && students.length === 0"
      class="placeholder-text"
    >
      该课程下暂无学生
    </div>
  </el-scrollbar>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElScrollbar, ElMenu, ElMenuItem, ElIcon, ElTag, ElTooltip } from 'element-plus'
import {
  Avatar,
  Loading,
  CircleCheckFilled,
  WarningFilled,
  StarFilled,
} from '@element-plus/icons-vue'

const props = defineProps({
  selectedCourseId: String,
  students: {
    type: Array,
    default: () => [],
  },
  isLoadingCourses: Boolean,
  isLoadingStudents: Boolean,
  courses: Array, // Pass courses to determine if any course is selected
})

const router = useRouter()
const route = useRoute()

const activeStudentRoute = computed(() => {
  if (
    route.name &&
    (route.name === 'StudentDashboard' ||
      route.name.startsWith('StudentClassFeedback') ||
      route.name.startsWith('StudentProfileTab') ||
      route.name.startsWith('StudentMonthlySummaryTab'))
  ) {
    const { courseId, studentId } = route.params
    if (courseId && studentId && courseId === props.selectedCourseId) {
      // Construct the base path for the student dashboard which then redirects
      return `/courses/${courseId}/students/${studentId}`
    }
  }
  return ''
})

const generateStudentRoute = (courseId, studentId) => {
  // This should match the path for StudentDashboard or its default redirect target
  return `/courses/${courseId}/students/${studentId}`
}

const navigateToStudent = (courseId, studentId) => {
  const targetRoute = generateStudentRoute(courseId, studentId)
  // Check if current route already points to this student's dashboard (or one of its tabs)
  if (!route.fullPath.startsWith(targetRoute)) {
    router.push(targetRoute)
  }
}
</script>

<style scoped>
.student-list-menu-scrollbar {
  background-color: #304156; /* Match aside background */
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
  height: 40px; /* Adjust height as needed */
  line-height: 40px;
}
.student-name {
  flex-grow: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0 8px;
}
.student-status-icons-simple {
  display: flex;
  align-items: center;
  gap: 4px;
}
.student-menu-item .el-tag {
  margin-left: 8px;
  flex-shrink: 0;
}
.placeholder-text {
  color: #8492a6;
  font-size: 13px;
  text-align: center;
  padding: 15px 0;
}
.placeholder-text.small {
  padding: 8px 0;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.placeholder-text.small .el-icon {
  margin-right: 5px;
}
.menu-header-title {
  opacity: 0.7;
  font-size: 12px;
  height: 30px;
  line-height: 30px;
  padding-left: 20px !important;
  pointer-events: none;
  color: #bfcbd9 !important; /* Ensure text color */
  background-color: #304156 !important; /* Ensure background color */
}
.menu-header-title:hover {
  background-color: #304156 !important;
}
</style>
