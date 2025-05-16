<template>
  <el-aside width="300px" class="right-sidebar-container" v-if="showPanel">
    <el-scrollbar style="flex-grow: 1; padding: 15px">
      <h3>信息栏</h3>

      <div v-if="courseStore.currentCourse">
        <h4>当前课程: {{ courseStore.currentCourse.name }}</h4>
        <p>ID: {{ courseStore.currentCourse._id }}</p>
        <p>状态: {{ courseStore.currentCourse.status === 'active' ? '正在上课' : '已完课' }}</p>
        <el-button
          size="small"
          @click="handleEditCourse"
          type="primary"
          plain
          :icon="EditPen"
          style="margin-top: 5px; margin-right: 10px"
          >编辑课程</el-button
        >
        <el-button
          size="small"
          @click="handleDeleteCourse"
          type="danger"
          plain
          :icon="DeleteIcon"
          style="margin-top: 5px"
          >删除课程</el-button
        >
      </div>

      <el-divider v-if="courseStore.currentCourse && studentStore.currentStudent" />

      <div v-if="studentStore.currentStudent">
        <h4>当前学生: {{ studentStore.currentStudent.name }}</h4>
        <p>ID: {{ studentStore.currentStudent._id }}</p>
        <p>年级: {{ studentStore.currentStudent.grade || 'N/A' }}</p>
        <p>状态: {{ studentStore.currentStudent.status === 'ongoing' ? '进行中' : '已完成' }}</p>
        <el-button
          size="small"
          type="primary"
          plain
          :icon="EditPen"
          @click="triggerEditStudent"
          style="margin-top: 10px; margin-right: 10px"
          >编辑学生</el-button
        >
        <el-button
          size="small"
          type="danger"
          plain
          :icon="DeleteIcon"
          @click="triggerDeleteStudent"
          style="margin-top: 10px"
          >删除学生</el-button
        >
      </div>

      <div v-if="!courseStore.currentCourse && !studentStore.currentStudent">
        <p>请从左侧选择一个课程或学生以查看更多信息。</p>
      </div>
    </el-scrollbar>
  </el-aside>
</template>

<script setup>
import { computed } from 'vue'
import { ElAside, ElScrollbar, ElButton, ElDivider, ElMessage, ElMessageBox } from 'element-plus'
import { EditPen, Delete as DeleteIcon } from '@element-plus/icons-vue'
import { useCourseStore } from '@/store/courseStore'
import { useStudentStore } from '@/store/studentStore'
import { useStudentInteractions } from '@/composables/useStudentInteractions' // 确保路径正确
import { useRouter } from 'vue-router'

// const emit = defineEmits(['edit-course', 'delete-course'])
const emit = defineEmits(['edit-course'])

const courseStore = useCourseStore()
const studentStore = useStudentStore()
const router = useRouter() // 如果删除成功后需要导航

const { handleDeleteStudent } = useStudentInteractions() // 获取交互函数

// 处理课程编辑 (通常是 emit 事件给父组件)
const handleEditCourse = () => {
  if (courseStore.currentCourse) {
    emit('edit-course', courseStore.currentCourse)
  }
}

// 处理课程删除 (直接调用 store action，或通过 composable)
const handleDeleteCourse = async () => {
  // <--- 【确保这个方法存在】
  if (!courseStore.currentCourse) return
  try {
    await ElMessageBox.confirm(
      `确定要删除课程 "${courseStore.currentCourse.name}" 吗？相关数据将一并处理。`,
      '警告：删除课程',
      { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning' },
    )
    const success = await courseStore.deleteCourse(courseStore.currentCourse._id)
    if (success) {
      ElMessage.success('课程删除成功！')
      studentStore.setCurrentStudent(null) // 清空学生选择
      router.push({ name: 'WelcomePage' }) // 导航到欢迎页
    } else {
      ElMessage.error(courseStore.deleteCourseError || '删除课程失败')
    }
  } catch (action) {
    if (action === 'cancel') {
      ElMessage.info('删除课程操作已取消。')
    } else {
      console.error('Error during course deletion:', action)
      ElMessage.error('删除课程操作时发生错误。')
    }
  }
}

// 从 composable 中获取删除学生的交互逻辑
const { handleDeleteStudent: execStudentDeletion } = useStudentInteractions() // <--- 【确保导入并解构】

// 触发学生删除的方法 (模板中绑定的是这个)
const triggerDeleteStudent = () => {
  // <--- 【确保这个方法存在】
  if (studentStore.currentStudent) {
    // execStudentDeletion(studentStore.currentStudent) // 调用从 composable 中获取的函数
    console.log(
      '[AppInfoPanel triggerDeleteStudent] Current student:',
      JSON.parse(JSON.stringify(studentStore.currentStudent)),
    ) // 【建议添加日志】
    handleDeleteStudent(studentStore.currentStudent) // <--- currentStudent 是否包含有效的 .course 属性？
  } else {
    ElMessage.warning('没有选中的学生可供删除。')
  }
}

// 如果还有编辑学生的按钮，也需要对应的方法
const triggerEditStudent = () => {
  if (studentStore.currentStudent) {
    emit('edit-student', studentStore.currentStudent) // 假设您会 emit 事件
  }
}

// --- 计算属性 ---
const isCourseSelectedOnly = computed(() => {
  return !!courseStore.currentCourse && !studentStore.currentStudent
})

const showPanel = computed(() => {
  return !!courseStore.currentCourse || !!studentStore.currentStudent
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
