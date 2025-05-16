<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useFeedbackStore } from '@/store/feedbackStore'
import { useStudentStore } from '@/store/studentStore'
import { useCourseStore } from '@/store/courseStore'
import { useAuthStore } from '@/store/authStore' // <--- 导入 authStore
import { ElMessage, ElMessageBox } from 'element-plus'
import { useForm } from '@/composables/useForm'
import dayjs from 'dayjs'

const route = useRoute()
const feedbackStore = useFeedbackStore()
const studentStore = useStudentStore()
const courseStore = useCourseStore()
const authStore = useAuthStore() // <--- 实例化 authStore

// 计算属性现在应该能正常工作
const currentUser = computed(() => authStore.currentUser)
const currentCourse = computed(() => courseStore.currentCourse)
const currentStudent = computed(() => studentStore.selectedStudent) // 确保这是唯一的 currentStudent 声明

const feedbackHistory = computed(() => feedbackStore.feedbackHistory)
const isLoadingHistory = computed(() => feedbackStore.isLoadingHistory)

// --- 表单逻辑 ---
const getInitialFeedbackFormState = () => ({
  feedbackDate: dayjs().format('YYYY-MM-DD'),
  classTime: '',
  lastHomeworkStatus: '',
  lastHomeworkFeedback: '',
  lastExtrapolationAssignmentDate: null,
  teachingContent: '',
  classPerformance: '',
  progressMade: '',
  areasForImprovement: '',
  punctuality: '',
  extrapolationAbility: '',
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
    // teachingContent: formData.teachingContent, // 在新版需求中，这里应该提交预览文本
    // classPerformance: formData.classPerformance, // 同上
    // ... 其他结构化字段如果后端仍需要 ...
    generatedFeedbackText: feedbackPreviewText.value, // 确保提交的是这个
    // 如果后端仍然需要这些结构化字段，可以取消注释并确保后端 Feedback模型有对应字段
    teachingContent: formData.teachingContent,
    classPerformance: formData.classPerformance,
    progressMade: formData.progressMade,
    areasForImprovement: formData.areasForImprovement,
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
  form: feedbackForm,
  formRef: feedbackFormRef,
  isSubmitting,
  submissionError,
  submissionSuccess,
  handleSubmit: performSubmit,
  resetForm: resetFeedbackFormInternal,
  setFormData: setFeedbackFormDataInternal,
} = useForm(getInitialFeedbackFormState, submitFeedbackAction)

const feedbackPreviewText = ref('')

const generateFeedbackPreview = () => {
  let preview = `日期: ${feedbackForm.feedbackDate ? dayjs(feedbackForm.feedbackDate).format('YYYY年MM月DD日') : '未填写'}\n`
  if (feedbackForm.classTime) {
    preview += `时间: ${feedbackForm.classTime}\n`
  }
  // 使用 currentStudent.value 因为它是 computed ref
  preview += `学生: ${currentStudent.value?.name || '未知学生'}\n`
  // 使用 currentUser.value 和 currentCourse.value
  preview += `授课老师: ${currentUser.value?.username || 'N/A'}\n`
  preview += `授课科目: ${currentCourse.value?.name || 'N/A'}\n\n`

  preview += `上次作业完成情况: \n${feedbackForm.lastHomeworkStatus || '无记录'}\n\n`
  preview += `上次作业完成反馈: \n${feedbackForm.lastHomeworkFeedback || '无记录'}\n\n`
  if (feedbackForm.lastExtrapolationAssignmentDate) {
    preview += `上次举一反三布置于: ${dayjs(feedbackForm.lastExtrapolationAssignmentDate).format('YYYY年MM月DD日')}\n\n`
  }

  preview += `【本次授课内容】:\n${feedbackForm.teachingContent || '无记录'}\n\n`
  preview += `【本次课堂表现】:\n${feedbackForm.classPerformance || '无记录'}\n\n`
  preview += `【进步之处】:\n${feedbackForm.progressMade || '无记录'}\n\n`
  preview += `【仍需努力】:\n${feedbackForm.areasForImprovement || '无记录'}\n\n`
  preview += `【课堂准时度】: ${feedbackForm.punctuality || '无记录'}\n`
  preview += `【举一反三能力】: ${feedbackForm.extrapolationAbility || '无记录'}\n`

  feedbackPreviewText.value = preview
}

const handleSubmitFeedback = async () => {
  if (!feedbackPreviewText.value.trim()) {
    ElMessage.warning('请先生成或填写反馈预览内容！')
    return
  }
  const success = await performSubmit()
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
  feedbackForm.feedbackDate = dayjs().format('YYYY-MM-DD')
}

const loadFeedbackForEditing = (feedbackItem) => {
  if (!feedbackItem) return

  setFeedbackFormDataInternal({
    // 从历史记录中提取的字段，用于填充左侧表单
    // classTime: feedbackItem.classTime || '', // <--- 修改点：不再从历史记录加载上课时间
    lastHomeworkStatus: feedbackItem.lastHomeworkStatus || '',
    lastHomeworkFeedback: feedbackItem.lastHomeworkFeedback || '',
    teachingContent: feedbackItem.teachingContent || '',
    classPerformance: feedbackItem.classPerformance || '',
    progressMade: feedbackItem.progressMade || '',
    areasForImprovement: feedbackItem.areasForImprovement || '',
    punctuality: feedbackItem.punctuality || '',
    extrapolationAbility: feedbackItem.extrapolationAbility || '',

    // feedbackDate: null, // <--- 修改点：这里不再需要设置，下面会直接覆盖为当天
    lastExtrapolationAssignmentDate: feedbackItem.feedbackDate // 这里仍然是旧的反馈日期，用于“上次举一反三布置于”
      ? dayjs(feedbackItem.feedbackDate).format('YYYY-MM-DD')
      : null,

    // 新增：确保这些字段也被传递，即使它们在加载时被特殊处理
    classTime: '', // <--- 修改点：上课时间永远默认为空
    feedbackDate: dayjs().format('YYYY-MM-DD'), // <--- 修改点：反馈日期永远是当天
  })

  // !!! 重要：在 setFeedbackFormDataInternal 之后，再次强制设置 feedbackDate 和 classTime
  // 因为 useForm 的 setFormData 可能会基于 getInitialFormState，我们需要确保我们的特定逻辑覆盖它
  feedbackForm.feedbackDate = dayjs().format('YYYY-MM-DD') // <--- 再次确保是当天
  feedbackForm.classTime = '' // <--- 再次确保上课时间为空

  // 如果历史记录中存储了生成的文本，则直接用于预览
  if (feedbackItem.generatedFeedbackText) {
    feedbackPreviewText.value = feedbackItem.generatedFeedbackText
  } else {
    // 否则，根据填充到表单的结构化数据重新生成预览
    // 因为 feedbackDate 和 classTime 已经改变，所以预览也会反映这些变化
    generateFeedbackPreview()
  }
  ElMessage.info('历史反馈已加载，请选择上课时间并重新选择反馈日期后提交。') // 可以更新提示信息
}

onMounted(async () => {
  const courseId = route.params.courseId
  const studentId = route.params.studentId

  // 确保 Pinia stores 中的数据已准备好
  // 这里的逻辑可能需要依赖 AppLayout 或全局初始化确保 courseStore.currentCourse 和 studentStore.selectedStudent 已被填充
  if (!courseStore.currentCourse && courseId) {
    await courseStore.selectCourse(courseId) // 确保课程数据已加载
  }
  if (
    (!studentStore.selectedStudent || studentStore.selectedStudent._id !== studentId) &&
    studentId &&
    courseId
  ) {
    await studentStore.fetchStudentsInCourseAndSetCurrent(courseId, studentId) // 确保学生数据已加载并设置为当前
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
      // 确保切换学生时，studentStore.selectedStudent 也更新
      if (courseId) {
        await studentStore.fetchStudentsInCourseAndSetCurrent(courseId, newStudentId)
      }
      await feedbackStore.fetchFeedbackForStudent(courseId, newStudentId)
      await resetFormVisuals()
    } else if (!newStudentId) {
      await resetFormVisuals()
      feedbackStore.clearHistory()
      studentStore.setCurrentStudent(null) // 清空当前学生
    }
  },
)
</script>

<template>
  <div class="class-feedback-tab-page">
    <el-row :gutter="20">
      <el-col :xs="24" :sm="24" :md="16">
        <el-card shadow="never" style="height: 100%">
          <div v-if="currentStudent">
            <el-form
              ref="feedbackFormRef"
              :model="feedbackForm"
              label-width="auto"
              label-position="top"
              @submit.prevent
            >
              <el-row :gutter="15">
                <el-col :xs="24" :sm="5" md="5">
                  <el-form-item label="反馈日期" prop="feedbackDate">
                    <el-date-picker
                      v-model="feedbackForm.feedbackDate"
                      type="date"
                      placeholder="选择日期"
                      format="YYYY-MM-DD"
                      value-format="YYYY-MM-DD"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>

                <el-col :xs="24" :sm="5" md="5">
                  <el-form-item label="上课时间" prop="classTime">
                    <el-time-select
                      v-model="feedbackForm.classTime"
                      start="08:00"
                      step="00:15"
                      end="22:00"
                      placeholder="选择时间 (可选)"
                      style="width: 100%"
                      clearable
                    />
                  </el-form-item>
                </el-col>

                <el-col :xs="24" :sm="4" md="4">
                  <el-form-item label="学生">
                    <el-input
                      :value="currentStudent?.name || 'N/A'"
                      readonly
                      disabled
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>

                <el-col :xs="24" :sm="5" md="5">
                  <el-form-item label="授课老师">
                    <el-input
                      :value="currentUser?.username || 'N/A'"
                      readonly
                      disabled
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>

                <el-col :xs="24" :sm="5" md="5">
                  <el-form-item label="授课科目">
                    <el-input
                      :value="currentCourse?.name || 'N/A'"
                      readonly
                      disabled
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-form-item label="上次举一反三布置时间" prop="lastExtrapolationAssignmentDate">
                <el-date-picker
                  v-model="feedbackForm.lastExtrapolationAssignmentDate"
                  type="date"
                  placeholder="选择日期 (若有)"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  style="width: 100%"
                  clearable
                />
              </el-form-item>

              <el-form-item label="完成情况" prop="lastHomeworkStatus">
                <el-input
                  type="textarea"
                  :rows="2"
                  v-model="feedbackForm.lastHomeworkStatus"
                  placeholder="记录上次作业内容和学生完成情况"
                />
              </el-form-item>
              <el-form-item label="完成反馈" prop="lastHomeworkFeedback">
                <el-input
                  type="textarea"
                  :rows="2"
                  v-model="feedbackForm.lastHomeworkFeedback"
                  placeholder="对学生上次作业的评价和反馈"
                />
              </el-form-item>

              <el-form-item label="本次授课内容" prop="teachingContent">
                <el-input
                  type="textarea"
                  :rows="3"
                  v-model="feedbackForm.teachingContent"
                  placeholder="简要记录本次课的主要教学点"
                />
              </el-form-item>
              <el-form-item label="本次课堂表现 " prop="classPerformance">
                <el-input
                  type="textarea"
                  :rows="3"
                  v-model="feedbackForm.classPerformance"
                  placeholder="学生在本次课堂上的具体表现"
                />
              </el-form-item>
              <el-form-item label="进步" prop="progressMade">
                <el-input
                  type="textarea"
                  :rows="2"
                  v-model="feedbackForm.progressMade"
                  placeholder="本次观察到的学生进步点"
                />
              </el-form-item>
              <el-form-item label="欠缺" prop="areasForImprovement">
                <el-input
                  type="textarea"
                  :rows="2"
                  v-model="feedbackForm.areasForImprovement"
                  placeholder="学生在哪些方面仍需加强"
                />
              </el-form-item>
              <el-row :gutter="15">
                <el-col :span="12">
                  <el-form-item label="课堂准时度" prop="punctuality">
                    <el-input
                      v-model="feedbackForm.punctuality"
                      placeholder="例如：准时、迟到5分钟等"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="举一反三" prop="extrapolationAbility">
                    <el-input
                      v-model="feedbackForm.extrapolationAbility"
                      placeholder="描述学生触类旁通的能力"
                    />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-form-item style="margin-top: 20px">
                <el-button
                  type="primary"
                  @click="generateFeedbackPreview"
                  icon="el-icon-refresh-right"
                  >生成反馈预览</el-button
                >
                <el-button @click="resetFormVisuals" icon="el-icon-refresh">重置表单</el-button>
              </el-form-item>
            </el-form>
          </div>
          <el-empty v-else description="请先在左侧选择一个学生以填写或查看反馈。"></el-empty>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="24" :md="8" :lg="8">
        <el-card shadow="never" style="height: 100%">
          <template #header>
            <div class="card-header">
              <span>反馈预览 (可编辑)</span>
            </div>
          </template>
          <el-input
            type="textarea"
            :rows="26"
            placeholder="点击“生成反馈预览”按钮后，会在此处显示反馈内容，您可以直接编辑。最终提交的是此区域的内容。"
            v-model="feedbackPreviewText"
            :disabled="!currentStudent"
          />
          <el-button
            type="success"
            @click="handleSubmitFeedback"
            :loading="isSubmitting"
            :disabled="!currentStudent || !feedbackPreviewText.trim()"
            style="width: 100%; margin-top: 15px"
            icon="el-icon-check"
          >
            提交此反馈
          </el-button>
          <div
            v-if="submissionError"
            class="error-message"
            style="margin-top: 10px; text-align: center"
          >
            提交失败: {{ submissionError }}
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-divider content-position="center" style="margin-top: 30px">历史反馈记录</el-divider>

    <div v-if="!currentStudent" class="no-history">
      <el-empty description="请先选择学生查看历史反馈。"></el-empty>
    </div>
    <div v-else>
      <div v-if="isLoadingHistory" class="loading-history">
        <p>正在加载历史反馈...</p>
        <el-skeleton :rows="5" animated />
      </div>
      <div v-else-if="feedbackHistory.length === 0" class="no-history">
        <el-empty :description="`${currentStudent.name} 暂无历史反馈记录。`"></el-empty>
      </div>
      <el-timeline v-else>
        <el-timeline-item
          v-for="item in feedbackHistory"
          :key="item._id"
          :timestamp="
            dayjs(item.feedbackDate).format('YYYY-MM-DD') +
            (item.classTime ? ' ' + item.classTime : '')
          "
          placement="top"
        >
          <el-card>
            <template #header>
              <div>
                反馈于: {{ dayjs(item.feedbackDate).format('YYYY年MM月DD日') }}
                <span v-if="item.classTime"> {{ item.classTime }}</span>
              </div>
            </template>
            <div
              class="feedback-content-display"
              v-if="item.generatedFeedbackText"
              v-html="item.generatedFeedbackText.replace(/\n/g, '<br>')"
            ></div>
            <div v-else>
              <p><strong>授课内容:</strong> {{ item.teachingContent || 'N/A' }}</p>
              <p><strong>课堂表现:</strong> {{ item.classPerformance || 'N/A' }}</p>
              <p v-if="item.lastHomeworkStatus">
                <strong>上次作业:</strong> {{ item.lastHomeworkStatus }}
              </p>
              <p v-if="item.lastHomeworkFeedback">
                <strong>完成反馈:</strong> {{ item.lastHomeworkFeedback }}
              </p>
              <p v-if="item.lastExtrapolationAssignmentDate">
                <strong>上次举一反三布置:</strong>
                {{ dayjs(item.lastExtrapolationAssignmentDate).format('YYYY-MM-DD') }}
              </p>
              <p v-if="item.progressMade"><strong>进步:</strong> {{ item.progressMade }}</p>
              <p v-if="item.areasForImprovement">
                <strong>欠缺:</strong> {{ item.areasForImprovement }}
              </p>
            </div>
            <el-button
              type="primary"
              link
              size="small"
              @click="loadFeedbackForEditing(item)"
              style="margin-top: 10px"
              icon="el-icon-edit"
            >
              加载此记录到表单 (编辑模式)
            </el-button>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </div>
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
  flex-shrink: 0; /* 防止表单和预览区在空间不足时被压缩 */
}
.el-col {
  margin-bottom: 15px; /* 为小屏幕堆叠时提供间距 */
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
}
.error-message {
  color: var(--el-color-error);
  font-size: 12px;
}
.loading-history,
.no-history {
  text-align: center;
  color: #909399;
  padding: 20px 0;
}
.el-timeline {
  margin-top: 20px;
  padding-left: 5px; /* 给时间线左侧留出一点空间 */
}
.feedback-content-display {
  white-space: pre-wrap; /* 保留换行和空格 */
  word-break: break-word;
  font-size: 14px;
  line-height: 1.6;
  color: #606266;
}
.el-card {
  border: 1px solid var(--el-border-color-lighter);
}
/* 确保卡片内容区有最小高度，即使内容很少 */
.el-card :deep(.el-card__body) {
  min-height: 100px;
}
/* 为了让左右两栏在小屏幕上能更好地堆叠，并且textarea有足够高度 */
@media (max-width: 768px) {
  .el-col {
    margin-bottom: 20px;
  }
  .el-row > .el-col:last-child .el-input :deep(textarea) {
    min-height: 200px !important; /* 增加预览区在小屏幕上的最小高度 */
  }
}
/* 微调一下 el-form-item 的下边距，使其更紧凑 */
.el-form-item {
  margin-bottom: 18px;
}
</style>
