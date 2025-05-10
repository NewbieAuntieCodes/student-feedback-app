// frontend/src/components/course/CreateCourseModal.vue
<template>
  <AppModal
    :visible="props.visible"
    :title="isEdit ? '编辑课程' : '创建新课程'"
    width="450px"
    :confirm-loading="isSubmitting"
    @update:visible="$emit('update:visible', $event)"
    @confirm="handleFormSubmit"
    @closed="$emit('closed')"
  >
    <template #body>
      <el-form
        ref="courseFormElRef"
        :model="form"
        :rules="courseRules"
        label-width="80px"
        label-position="right"
      >
        <el-form-item label="课程名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入课程名称" />
        </el-form-item>
        <el-form-item v-if="submissionError">
          <el-alert type="error" :title="submissionError" show-icon :closable="false" />
        </el-form-item>
      </el-form>
    </template>
  </AppModal>
</template>

<script setup>
import { ref, watch, reactive, computed } from 'vue' // **** 添加 computed 导入 ****
import { ElForm, ElFormItem, ElInput, ElAlert, ElMessage } from 'element-plus'
import AppModal from '@/components/common/AppModal.vue'
import { useForm } from '@/composables/useForm'
import { useCourseStore } from '@/store/courseStore'

const props = defineProps({
  visible: Boolean, // visible prop 本身是 boolean，MainLayout 中传递时，如果是 ref，Vue 会自动解包
  courseToEdit: {
    type: Object,
    default: null,
  },
})
const emit = defineEmits(['update:visible', 'course-created', 'course-updated', 'closed'])

const courseStore = useCourseStore()
const courseFormElRef = ref(null)

const getInitialState = () => ({
  _id: null,
  name: '',
})

// **** 使用 computed 正确定义 isEdit ****
const isEdit = computed(() => !!(props.courseToEdit && props.courseToEdit._id))

const submitAction = async (formData) => {
  // formData 来自 useForm，只包含表单字段，例如 { name: '...' }
  // props.courseToEdit 包含完整的课程对象，包括 _id
  let success = false
  let resultCourse = null

  if (isEdit.value) {
    // 正确使用 isEdit.value
    // **** 确保 props.courseToEdit 存在并且有 _id ****
    if (!props.courseToEdit || !props.courseToEdit._id) {
      throw new Error('编辑模式下 courseToEdit 或其 _id 未定义')
    }
    resultCourse = await courseStore.updateCourse(props.courseToEdit._id, { name: formData.name })
    success = !!resultCourse // updateCourse 应该返回 true/false 或更新后的对象
    if (!success) throw new Error(courseStore.updateCourseError || '更新课程失败')
    emit('course-updated', resultCourse) // 如果 updateCourse 返回更新后的对象
  } else {
    resultCourse = await courseStore.createCourse({ name: formData.name })
    success = !!resultCourse
    if (!success) throw new Error(courseStore.createCourseError || '创建课程失败')
    emit('course-created', resultCourse)
  }
  return resultCourse // useForm 需要这个来判断操作是否成功
}

const {
  form,
  isSubmitting,
  submissionError,
  // submissionSuccess, // 这个变量似乎没在模板中使用，可以按需保留
  handleSubmit,
  resetForm,
  setFormData,
} = useForm(getInitialState, submitAction, courseFormElRef)

const courseRules = reactive({
  name: [{ required: true, message: '课程名称不能为空', trigger: 'blur' }],
})

watch(
  () => props.visible,
  (newVal) => {
    if (newVal) {
      // submissionError.value = null; // useForm 应该会处理错误状态的重置
      // submissionSuccess.value = false;
      if (isEdit.value && props.courseToEdit) {
        // 正确使用 isEdit.value
        setFormData({ _id: props.courseToEdit._id, name: props.courseToEdit.name })
      } else {
        resetForm()
      }
    }
  },
  // { immediate: true } // 根据需要决定是否立即执行，如果 visible 初始为 true
)

const handleFormSubmit = async () => {
  const success = await handleSubmit() // handleSubmit 来自 useForm
  if (success) {
    ElMessage.success(isEdit.value ? '课程更新成功！' : '课程创建成功！') // 正确使用 isEdit.value
    emit('update:visible', false)
    // emit('closed'); // AppModal 的 @closed 应该已经触发了，这里可以不重复，除非逻辑需要
  }
  // submissionError 会由 useForm 更新，并在模板的 el-alert 中显示
}
</script>
