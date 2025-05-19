<template>
  <div class="course-management-panel" style="padding: 15px; border-bottom: 1px solid #2a394b">
    <el-form-item label="选择课程:" label-position="top" style="margin-bottom: 5px; color: #bfcbd9">
      <el-select
        v-model="selectedCourseId"
        placeholder="选择课程"
        style="width: 100%"
        clearable
        filterable
        @change="onCourseSelectionChange"
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
      @click="emit('open-create-course-dialog')"
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
      @click="emit('open-add-student-dialog')"
      style="width: 100%; margin-top: 8px"
      :icon="UserIcon"
    >
      添加学生到当前课程
    </el-button>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { ElSelect, ElOption, ElButton, ElFormItem } from 'element-plus'
import { CirclePlusFilled, User as UserIcon } from '@element-plus/icons-vue' // Renamed User to UserIcon
import { useCourseStore } from '@/store/courseStore'
import { useStudentStore } from '@/store/studentStore' // Needed to clear students on course change
import { useRouter, useRoute } from 'vue-router'

const props = defineProps({
  modelValue: String, // For v-model binding of selectedCourseId from parent
})
const emit = defineEmits([
  'update:modelValue',
  'course-selected',
  'open-create-course-dialog',
  'open-add-student-dialog',
])

const courseStore = useCourseStore()
const studentStore = useStudentStore()
const router = useRouter()
const route = useRoute()

const selectedCourseId = ref(props.modelValue)

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue !== selectedCourseId.value) {
      selectedCourseId.value = newValue
    }
  },
)

const onCourseSelectionChange = (courseId) => {
  emit('update:modelValue', courseId) // Update parent's v-model
  emit('course-selected', courseId) // Emit event for parent to handle student fetching etc.
}
</script>

<style scoped>
/* Styles for CourseManagementPanel */
.el-form-item--small .el-form-item__label {
  color: #bfcbd9; /* Ensure label color is correct */
}
</style>
