<template>
  <el-aside width="280px" class="right-sidebar-container" v-if="showPanel">
    <el-scrollbar style="flex-grow: 1; padding: 15px">
      <h3>信息栏</h3>
      <div v-if="courseStore.currentCourse">
        <h4>当前课程: {{ courseStore.currentCourse.name }}</h4>
        <p>ID: {{ courseStore.currentCourse._id }}</p>
        <el-button
          size="small"
          @click="emit('edit-course', courseStore.currentCourse)"
          type="primary"
          plain
          :icon="EditPen"
          style="margin-top: 5px"
          >编辑课程</el-button
        >
        <el-button
          size="small"
          @click="emit('delete-course', courseStore.currentCourse)"
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
</template>

<script setup>
import { computed } from 'vue'
import { ElAside, ElScrollbar, ElButton, ElDivider } from 'element-plus'
import { EditPen, Delete } from '@element-plus/icons-vue'
import { useCourseStore } from '@/store/courseStore'
import { useStudentStore } from '@/store/studentStore'

const emit = defineEmits(['edit-course', 'delete-course'])

const courseStore = useCourseStore()
const studentStore = useStudentStore()

const showPanel = computed(() => {
  return !!courseStore.currentCourse // 或者更复杂的逻辑
})
</script>

<style scoped>
.right-sidebar-container {
  background-color: #fff;
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
</style>
