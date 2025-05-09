<template>
  <div>
    <h4>月度总结区</h4>
    <p>学生ID: {{ studentId }} (课程ID: {{ courseId }})</p>
    <p v-if="studentStore.selectedStudent">
      正在为 {{ studentStore.selectedStudent.name }} 查看月度总结。
    </p>
    <p v-if="!studentStore.selectedStudent" style="color: red">
      无法加载月度总结，当前未选中学生或学生数据丢失。
    </p>
  </div>
</template>

<script setup>
import { useStudentStore } from '../../store/studentStore' // 引入 studentStore

defineProps({
  courseId: String,
  studentId: String,
})

const studentStore = useStudentStore() // 使用 store 获取学生信息
</script>

<style scoped>
/* 可以添加一些 scoped 样式 */
div {
  padding: 10px;
}
</style>
