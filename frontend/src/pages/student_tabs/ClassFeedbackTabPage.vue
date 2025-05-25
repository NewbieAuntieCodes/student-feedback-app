<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useFeedbackStore } from '@/store/feedbackStore'
import { useStudentStore } from '@/store/studentStore'
import { useCourseStore } from '@/store/courseStore'
import { useAuthStore } from '@/store/authStore'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useForm } from '@/composables/useForm' // useForm 仍然在父组件中使用
import dayjs from 'dayjs'

// 导入子组件
import FeedbackForm from './ClassFeedbackTabPage/FeedbackForm.vue'
import FeedbackPreview from './ClassFeedbackTabPage/FeedbackPreview.vue'
import FeedbackHistoryList from './ClassFeedbackTabPage/FeedbackHistoryList.vue'

const classTimeOptions = [
  { value: '0900-1030', label: '09:00 - 10:30' },
  { value: '1040-1210', label: '10:40 - 12:10' },
  { value: '1330-1500', label: '13:30 - 15:00' },
  { value: '1515-1645', label: '15:15 - 16:45' },
  { value: '1700-1830', label: '17:00 - 18:30' },
  { value: '1900-2030', label: '19:00 - 20:30' },
]

const route = useRoute()
const feedbackStore = useFeedbackStore()
const studentStore = useStudentStore()
const courseStore = useCourseStore()
const authStore = useAuthStore()

const currentUser = computed(() => authStore.currentUser)
const currentCourse = computed(() => courseStore.currentCourse)
const currentStudent = computed(() => studentStore.selectedStudent)

const feedbackHistory = computed(() => feedbackStore.feedbackHistory)
const isLoadingHistory = computed(() => feedbackStore.isLoadingHistory)

// --- 表单和预览的状态由父组件管理 ---
const getInitialFeedbackFormState = () => ({
  feedbackDate: dayjs().format('YYYY-MM-DD'),
  classTime: '',
  lastHomeworkStatus: '',
  lastHomeworkFeedback: '',
  lastExtrapolationAssignmentDate: null,
  teachingContent: '',
  classPerformance: '学生上课认真，积极配合。',
  progressMade: '',
  areasForImprovement: '',
  improvementPlan: '',
  punctuality: '优秀',
  extrapolationAbility: '',
  // generatedFeedbackText is not part of the form state directly,
  // it's a separate ref for the preview area.
})

const submitFeedbackAction = async (formData) => {
  const courseId = route.params.courseId
  const studentId = route.params.studentId
  if (!courseId || !studentId) {
    ElMessage.error('课程或学生信息丢失')
    return Promise.reject(new Error('课程或学生信息丢失'))
  }

  const dataToSubmit = {
    feedbackDate: formData.feedbackDate ? dayjs(formData.feedbackDate).toISOString() : null,
    classTime: formData.classTime,
    lastHomeworkStatus: formData.lastHomeworkStatus,
    lastHomeworkFeedback: formData.lastHomeworkFeedback,
    lastExtrapolationAssignmentDate: formData.lastExtrapolationAssignmentDate
      ? dayjs(formData.lastExtrapolationAssignmentDate).toISOString()
      : null,
    generatedFeedbackText: feedbackPreviewText.value, // 提交的是预览文本
    teachingContent: formData.teachingContent,
    classPerformance: formData.classPerformance,
    progressMade: formData.progressMade,
    areasForImprovement: formData.areasForImprovement,
    improvementPlan: formData.improvementPlan,
    punctuality: formData.punctuality,
    extrapolationAbility: formData.extrapolationAbility,
  }

  const success = await feedbackStore.addFeedback(courseId, studentId, dataToSubmit)
  if (!success) {
    return Promise.reject(
      new Error(feedbackStore.submissionError || '提交反馈失败，请检查网络或联系管理员'),
    )
  }
  return success
}

const {
  form: feedbackForm, // This is reactive
  formRef: feedbackFormRef, // Ref for el-form instance
  isSubmitting,
  submissionError,
  submissionSuccess,
  handleSubmit: performSubmit,
  resetForm: resetFeedbackFormInternal,
  setFormData: setFeedbackFormDataInternal,
} = useForm(getInitialFeedbackFormState, submitFeedbackAction)

console.log('feedbackForm from useForm:', feedbackForm) // 检查这个的输出

const feedbackPreviewText = ref('') // 预览文本

// --- 父组件处理子组件emit的事件 ---
// FeedbackForm emits
const handleGeneratePreview = () => {
  generateFeedbackPreview()
}

const handleResetFormInParent = async () => {
  await resetFormVisuals()
}

// FeedbackPreview emits
const handleCopyText = async () => {
  if (!feedbackPreviewText.value) {
    ElMessage.warning('没有可复制的反馈内容。')
    return
  }
  try {
    await navigator.clipboard.writeText(feedbackPreviewText.value)
    ElMessage.success('反馈内容已复制到剪贴板！')
  } catch (err) {
    console.error('复制反馈内容失败:', err)
    ElMessage.error('复制失败，您的浏览器可能不支持此功能或未授予权限。')
  }
}

const handleSubmitFeedbackFromPreview = async () => {
  await handleSubmitFeedback()
}

// FeedbackHistoryList emits
const handleLoadFeedbackFromHistory = (feedbackItem) => {
  loadFeedbackForEditing(feedbackItem)
}

const handleDeleteFeedbackFromHistory = async (feedbackId) => {
  await handleDeleteFeedback(feedbackId)
}

const generateFeedbackPreview = () => {
  const studentName = currentStudent.value?.name || '未知学生'
  const formattedFeedbackDate = feedbackForm.feedbackDate
    ? dayjs(feedbackForm.feedbackDate).format('YYYY年MM月DD日')
    : '未填写日期'

  let preview = `【${studentName} ${formattedFeedbackDate} 教学反馈】\n`
  if (feedbackForm.classTime) {
    preview += `时间：${feedbackForm.classTime}\n`
  }
  preview += `老师：${currentUser.value?.username || 'N/A'}\n`
  preview += `科目：${currentCourse.value?.name || 'N/A'}\n\n`

  // 对 lastExtrapolationAssignmentDate 进行安全处理
  if (feedbackForm.lastExtrapolationAssignmentDate) {
    try {
      const extrapolationDate = dayjs(feedbackForm.lastExtrapolationAssignmentDate)
      if (extrapolationDate.isValid()) {
        preview += `上次举一反三布置时间：${extrapolationDate.format('M月D日')}\n`
      } else {
        // 如果日期字符串存在但无效，可以选择显示原始字符串或特定提示
        preview += `上次举一反三布置时间：${feedbackForm.lastExtrapolationAssignmentDate} (日期格式无法解析)\n`
        console.warn(
          '[ClassFeedbackTabPage] lastExtrapolationAssignmentDate is present but not a valid date for dayjs:',
          feedbackForm.lastExtrapolationAssignmentDate,
        )
      }
    } catch (e) {
      console.error(
        '[ClassFeedbackTabPage] Error processing lastExtrapolationAssignmentDate with dayjs:',
        e,
      )
      preview += `上次举一反三布置时间：(日期处理错误)\n`
    }
  }
  // 如果不希望在 lastExtrapolationAssignmentDate 为空或无效时显示该行，可以移到 if 块内部

  preview += `【完成情况】${feedbackForm.lastHomeworkStatus}\n`
  preview += `【完成反馈】${feedbackForm.lastHomeworkFeedback}\n\n`
  preview += `【本次课堂内容】\n${feedbackForm.teachingContent}\n\n`

  let combinedPerformance = ''
  if (feedbackForm.classPerformance) {
    combinedPerformance += feedbackForm.classPerformance
  }
  if (feedbackForm.progressMade) {
    if (combinedPerformance) combinedPerformance += '\n'
    combinedPerformance += feedbackForm.progressMade
  }
  if (feedbackForm.areasForImprovement) {
    if (combinedPerformance) combinedPerformance += '\n'
    combinedPerformance += feedbackForm.areasForImprovement
  }
  if (feedbackForm.improvementPlan) {
    if (combinedPerformance) combinedPerformance += '\n'
    combinedPerformance += feedbackForm.improvementPlan
  }
  preview += `【本次课堂表现】\n${combinedPerformance}\n\n`
  preview += `【准时度】\n${feedbackForm.punctuality}\n\n`
  preview += `【举一反三】\n${feedbackForm.extrapolationAbility}\n\n`

  feedbackPreviewText.value = preview
}

const handleSubmitFeedback = async () => {
  if (!feedbackPreviewText.value.trim()) {
    ElMessage.warning('请先生成或填写反馈预览内容！')
    return
  }
  const success = await performSubmit() // performSubmit is from useForm
  if (success) {
    ElMessage.success('反馈提交成功！')
    await resetFormVisuals()
    const courseId = route.params.courseId
    const studentId = route.params.studentId
    if (courseId && studentId) {
      await feedbackStore.fetchFeedbackForStudent(courseId, studentId)
    }
  }
}

const resetFormVisuals = async () => {
  await resetFeedbackFormInternal()
  feedbackPreviewText.value = ''
  // 直接访问 reactive 对象的属性
  feedbackForm.feedbackDate = dayjs().format('YYYY-MM-DD')
}

const loadFeedbackForEditing = (feedbackItem) => {
  if (!feedbackItem) return

  // Update the reactive form object directly.
  // useForm's setFormData will internally use getInitialState then assign.
  setFeedbackFormDataInternal({
    lastHomeworkStatus: feedbackItem.lastHomeworkStatus || '',
    lastHomeworkFeedback: feedbackItem.lastHomeworkFeedback || '',
    teachingContent: feedbackItem.teachingContent || '',
    classPerformance: feedbackItem.classPerformance || '',
    progressMade: feedbackItem.progressMade || '',
    areasForImprovement: feedbackItem.areasForImprovement || '',
    improvementPlan: feedbackItem.improvementPlan || '',
    punctuality: feedbackItem.punctuality || '',
    extrapolationAbility: feedbackItem.extrapolationAbility || '',
    lastExtrapolationAssignmentDate: feedbackItem.feedbackDate
      ? dayjs(feedbackItem.feedbackDate).format('YYYY-MM-DD')
      : null,
    classTime: '', // Always clear
    feedbackDate: dayjs().format('YYYY-MM-DD'), // Always today
  })
  // No need to set feedbackForm.value.feedbackDate and classTime again if setFormDataInternal handles it correctly based on above.
  // However, if useForm's setFormData is too generic, direct assignment after is fine:
  // feedbackForm.value.feedbackDate = dayjs().format('YYYY-MM-DD');
  // feedbackForm.value.classTime = '';

  if (feedbackItem.generatedFeedbackText) {
    feedbackPreviewText.value = feedbackItem.generatedFeedbackText
  } else {
    generateFeedbackPreview()
  }
  ElMessage.info('历史反馈已加载，请选择上课时间并重新选择反馈日期后提交。')
}

const handleDeleteFeedback = async (feedbackId) => {
  if (!feedbackId) return
  try {
    await ElMessageBox.confirm(
      '您确定要永久删除这条反馈记录吗？此操作一旦执行将无法撤销。',
      '确认删除反馈',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
      },
    )
    const courseId = route.params.courseId
    const studentId = route.params.studentId
    if (!courseId || !studentId) {
      ElMessage.error('无法确定课程或学生信息，删除失败。')
      return
    }
    const success = await feedbackStore.deleteFeedback(courseId, studentId, feedbackId)
    if (success) {
      ElMessage.success('反馈记录删除成功！')
      await feedbackStore.fetchFeedbackForStudent(courseId, studentId)
    } else {
      ElMessage.error(feedbackStore.error || '删除反馈记录失败，请重试。')
    }
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      console.error('删除反馈时出错:', error)
      ElMessage.error('删除操作时出现意外错误。')
    } else {
      ElMessage.info('删除操作已取消。')
    }
  }
}

onMounted(async () => {
  const courseId = route.params.courseId
  const studentId = route.params.studentId
  if (!courseStore.currentCourse && courseId) {
    await courseStore.selectCourse(courseId)
  }
  if (
    (!studentStore.selectedStudent || studentStore.selectedStudent._id !== studentId) &&
    studentId &&
    courseId
  ) {
    await studentStore.fetchStudentsInCourseAndSetCurrent(courseId, studentId)
  }
  if (studentId && courseId) {
    await feedbackStore.fetchFeedbackForStudent(courseId, studentId)
  }
  await resetFormVisuals()
})

watch(
  () => route.params.studentId,
  async (newStudentId, oldStudentId) => {
    if (newStudentId && newStudentId !== oldStudentId) {
      const courseId = route.params.courseId
      if (courseId) {
        await studentStore.fetchStudentsInCourseAndSetCurrent(courseId, newStudentId)
      }
      await feedbackStore.fetchFeedbackForStudent(courseId, newStudentId)
      await resetFormVisuals()
    } else if (!newStudentId) {
      await resetFormVisuals()
      feedbackStore.clearHistory()
      studentStore.setCurrentStudent(null)
    }
  },
)
</script>

<template>
  <div class="class-feedback-tab-page">
    <el-row :gutter="20">
      <el-col :xs="24" :sm="24" :md="16">
        <FeedbackForm
          :modelValue="feedbackForm"
          @update:modelValue="Object.assign(feedbackForm, $event)"
          :formRef="feedbackFormRef"
          :currentStudent="currentStudent"
          :currentUser="currentUser"
          :currentCourse="currentCourse"
          :classTimeOptions="classTimeOptions"
          @generate-preview="handleGeneratePreview"
          @reset-form="handleResetFormInParent"
        />
      </el-col>

      <el-col :xs="24" :sm="24" :md="8" :lg="8">
        <FeedbackPreview
          v-model="feedbackPreviewText"
          :isSubmitting="isSubmitting"
          :submissionError="submissionError"
          :currentStudent="currentStudent"
          @copy-text="handleCopyText"
          @submit-feedback="handleSubmitFeedbackFromPreview"
        />
      </el-col>
    </el-row>

    <FeedbackHistoryList
      :feedbackHistory="feedbackHistory"
      :isLoadingHistory="isLoadingHistory"
      :currentStudent="currentStudent"
      @load-feedback="handleLoadFeedbackFromHistory"
      @delete-feedback="handleDeleteFeedbackFromHistory"
    />
  </div>
</template>

<style scoped>
.class-feedback-tab-page {
  padding: 15px;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.el-row {
  flex-shrink: 0;
}
.el-col {
  margin-bottom: 15px;
}

/* 其他原有的父组件特定样式可以保留，或者如果它们只与某个子区域相关，则移至子组件 */
@media (max-width: 768px) {
  .el-col {
    margin-bottom: 20px;
  }
}
</style>
