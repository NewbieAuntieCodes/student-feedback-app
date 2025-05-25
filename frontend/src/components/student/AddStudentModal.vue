// frontend/src/components/student/AddStudentModal.vue
<template>
  <AppModal
    :visible="visible"
    title="为课程添加新学生"
    width="450px"
    :confirm-loading="isSubmitting"
    @update:visible="$emit('update:visible', $event)"
    @confirm="handleFormSubmit"
    @closed="handleModalClosed"
  >
    <template #body>
      <div v-if="targetCourse" style="margin-bottom: 15px">
        <strong>课程: {{ targetCourse.name }}</strong>
      </div>
      <el-form
        ref="addStudentFormElRef"
        :model="form"
        :rules="addStudentRules"
        label-width="80px"
        label-position="right"
      >
        <el-form-item label="学生姓名" prop="name">
          <el-input v-model="form.name" placeholder="请输入学生姓名" />
        </el-form-item>
        <el-form-item label="年级" prop="grade">
          <el-input v-model="form.grade" placeholder="例如: 高一 / 三年级" />
        </el-form-item>
        <el-form-item v-if="submissionError">
          <el-alert type="error" :title="submissionError" show-icon :closable="false" />
        </el-form-item>
      </el-form>
    </template>
  </AppModal>
</template>

<script setup>
import { ref, watch, reactive, computed } from 'vue' // 确保导入 computed
import { ElForm, ElFormItem, ElInput, ElAlert, ElMessage } from 'element-plus'
import AppModal from '@/components/common/AppModal.vue'
import { useForm } from '@/composables/useForm.js'
import { useStudentStore } from '@/store/studentStore'

const props = defineProps({
  visible: Boolean,
  targetCourse: {
    // The course to add student to
    type: Object,
    default: null, // 改为 default: null，并在使用前检查
  },
})
const emit = defineEmits(['update:visible', 'student-added', 'closed'])

const studentStore = useStudentStore()
const addStudentFormElRef = ref(null)

const getInitialState = () => ({
  name: '',
  grade: '',
})

// 只有当 targetCourse 存在时才尝试提交
const canSubmit = computed(() => !!props.targetCourse?._id)

const submitAction = async (formData) => {
  if (!canSubmit.value) {
    // 使用计算属性检查
    ElMessage.error('未指定目标课程，无法添加学生。')
    throw new Error('未指定目标课程')
  }
  const studentData = { name: formData.name, grade: formData.grade }
  const addedStudent = await studentStore.addStudentToCourse(
    props.targetCourse._id, // 确保 targetCourse 不是 null
    studentData,
  )
  if (!addedStudent) {
    throw new Error(studentStore.addStudentError || '添加学生失败')
  }
  // emit('student-added', addedStudent); // student-added事件由handleFormSubmit成功后emit
  return addedStudent // 返回结果给 useForm
}

const {
  form,
  // formRef, // 我们直接使用 addStudentFormElRef
  isSubmitting,
  submissionError,
  submissionSuccess, // 可以用来在成功后显示一些UI反馈
  handleSubmit,
  resetForm,
} = useForm(getInitialState, submitAction, addStudentFormElRef) // 将 addStudentFormElRef 传递给 useForm

const addStudentRules = reactive({
  name: [{ required: true, message: '学生姓名不能为空', trigger: 'blur' }],
  // grade 字段的规则可以根据需要添加，例如：
  // grade: [{ required: false, message: '请输入年级', trigger: 'blur' }],
})

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      // submissionError.value = null; // useForm 内部会处理
      // submissionSuccess.value = false; // useForm 内部会处理
      resetForm() // 每次打开时重置表单
    }
  },
)

const handleFormSubmit = async () => {
  if (!props.targetCourse) {
    ElMessage.error('目标课程信息缺失，无法提交。')
    return
  }
  const success = await handleSubmit() // handleSubmit 来自 useForm
  if (success) {
    ElMessage.success(
      `学生 "${form.name}" 已成功添加到课程 "${props.targetCourse.name}"！` 
    )
    emit('student-added', form) // 可以在这里传递添加成功的学生数据（虽然useForm中已有）
    emit('update:visible', false) // 关闭模态框
    // emit('closed'); // AppModal 的 @closed 会自动触发，这里不用重复 emit
  } else if (submissionError.value) {
    // ElMessage.error(submissionError.value); // 错误已在表单内用 el-alert 显示
  }
}

const handleModalClosed = () => {
  emit('closed') // 确保父组件的 @closed 处理器被调用
}
</script>
