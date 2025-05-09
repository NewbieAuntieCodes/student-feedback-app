<template>
  <div class="class-feedback-tab-page">
    <el-row :gutter="20">
      <el-col :xs="24" :sm="24" :md="10" :lg="8" :xl="7" class="form-column">
        <el-card shadow="hover">
          <template #header>
            <div class="clearfix">
              <span>为 {{ studentStore.selectedStudent?.name || '当前学生' }} 添加新反馈</span>
            </div>
          </template>
          <div v-if="!props.studentId || !props.courseId">
            <el-alert title="请先在左侧选择课程和学生" type="warning" :closable="false" show-icon />
          </div>
          <el-form
            v-else
            ref="feedbackFormRef"
            :model="feedbackForm"
            :rules="feedbackRules"
            label-position="top"
            require-asterisk-position="right"
            class="feedback-form"
            @submit.prevent="submitFeedback"
          >
            <el-form-item label="反馈日期" prop="feedbackDate">
              <el-date-picker
                v-model="feedbackForm.feedbackDate"
                type="date"
                placeholder="选择日期"
                style="width: 100%"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
              />
            </el-form-item>
            <el-form-item label="上课时间 (例如 14:00-15:30)" prop="classTime">
              <el-input v-model="feedbackForm.classTime" placeholder="例如 14:00-15:30" />
            </el-form-item>
            <el-form-item label="上次作业/完成情况" prop="lastHomeworkStatus">
              <el-input
                type="textarea"
                :rows="2"
                v-model="feedbackForm.lastHomeworkStatus"
                placeholder="上次作业完成情况如何？"
              />
            </el-form-item>
            <el-form-item label="授课内容 (主要内容)" prop="teachingContent">
              <el-input
                type="textarea"
                :rows="3"
                v-model="feedbackForm.teachingContent"
                placeholder="本次课主要讲了什么？"
              />
            </el-form-item>
            <el-form-item label="本次课堂表现" prop="classPerformance">
              <el-input
                type="textarea"
                :rows="3"
                v-model="feedbackForm.classPerformance"
                placeholder="学生本次课堂表现如何？"
              />
            </el-form-item>
            <el-form-item label="进步之处" prop="progressMade">
              <el-input
                type="textarea"
                :rows="2"
                v-model="feedbackForm.progressMade"
                placeholder="学生有哪些进步？"
              />
            </el-form-item>
            <el-form-item label="欠缺之处" prop="areasForImprovement">
              <el-input
                type="textarea"
                :rows="2"
                v-model="feedbackForm.areasForImprovement"
                placeholder="哪些方面还需要加强？"
              />
            </el-form-item>
            <el-form-item label="准时度" prop="punctuality">
              <el-input v-model="feedbackForm.punctuality" placeholder="例如：准时/迟到5分钟" />
            </el-form-item>
            <el-form-item label="举一反三能力" prop="extrapolationAbility">
              <el-input
                v-model="feedbackForm.extrapolationAbility"
                placeholder="例如：强/一般/有待提高"
              />
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                native-type="submit"
                :loading="feedbackStore.isSubmitting"
                style="width: 100%"
              >
                提交反馈
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="24" :md="14" :lg="16" :xl="17" class="history-column">
        <el-card shadow="hover">
          <template #header>
            <div class="clearfix">
              <span>历史反馈记录</span>
              <el-button
                style="float: right; padding: 3px 0"
                type="primary"
                text
                @click="fetchHistory"
                :loading="feedbackStore.isLoadingHistory"
                :disabled="!props.studentId || !props.courseId"
              >
                <el-icon><Refresh /></el-icon>刷新
              </el-button>
            </div>
          </template>
          <div v-if="!props.studentId || !props.courseId">
            <el-alert
              title="选择学生后将在此处显示历史反馈"
              type="info"
              :closable="false"
              show-icon
            />
          </div>
          <div v-else-if="feedbackStore.isLoadingHistory" style="text-align: center; padding: 20px">
            <el-icon class="is-loading" :size="26"><Loading /></el-icon>
            <p>加载历史反馈中...</p>
          </div>
          <el-empty
            v-else-if="feedbackStore.feedbackHistory.length === 0 && !feedbackStore.historyError"
            description="暂无历史反馈记录"
          ></el-empty>
          <el-alert
            v-else-if="feedbackStore.historyError"
            :title="`加载历史反馈失败: ${feedbackStore.historyError}`"
            type="error"
            show-icon
          />

          <el-timeline v-else>
            <el-timeline-item
              v-for="item in feedbackStore.feedbackHistory"
              :key="item._id"
              :timestamp="formatFeedbackTimestamp(item.feedbackDate, item.classTime)"
              placement="top"
            >
              <el-card class="history-feedback-card">
                <p><strong>授课内容:</strong> {{ item.teachingContent }}</p>
                <p><strong>课堂表现:</strong> {{ item.classPerformance }}</p>
                <p v-if="item.lastHomeworkStatus">
                  <strong>上次作业:</strong> {{ item.lastHomeworkStatus }}
                </p>
                <p v-if="item.progressMade"><strong>进步之处:</strong> {{ item.progressMade }}</p>
                <p v-if="item.areasForImprovement">
                  <strong>欠缺之处:</strong> {{ item.areasForImprovement }}
                </p>
                <p v-if="item.punctuality"><strong>准时度:</strong> {{ item.punctuality }}</p>
                <p v-if="item.extrapolationAbility">
                  <strong>举一反三:</strong> {{ item.extrapolationAbility }}
                </p>
                <p class="feedback-meta">
                  <small>记录于: {{ new Date(item.createdAt).toLocaleString() }}</small>
                </p>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch, nextTick } from 'vue'
import { useStudentStore } from '../../store/studentStore'
import { useFeedbackStore } from '../../store/feedbackStore' // 我们将创建这个 store
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Loading } from '@element-plus/icons-vue' // 引入图标

const props = defineProps({
  courseId: String,
  studentId: String,
})

const studentStore = useStudentStore()
const feedbackStore = useFeedbackStore() // 使用 feedback store

const feedbackFormRef = ref(null)
const initialFormState = {
  feedbackDate: new Date().toISOString().split('T')[0], // 默认为今天
  classTime: '',
  lastHomeworkStatus: '',
  teachingContent: '',
  classPerformance: '',
  progressMade: '',
  areasForImprovement: '',
  punctuality: '准时',
  extrapolationAbility: '',
}
const feedbackForm = reactive({ ...initialFormState })

const feedbackRules = reactive({
  feedbackDate: [{ required: true, message: '请选择反馈日期', trigger: 'change' }],
  teachingContent: [{ required: true, message: '请输入授课内容', trigger: 'blur' }],
  classPerformance: [{ required: true, message: '请输入本次课堂表现', trigger: 'blur' }],
  // 其他字段可以根据需要添加校验
})

const submitFeedback = async () => {
  if (!props.courseId || !props.studentId) {
    ElMessage.error('未选择课程或学生，无法提交反馈')
    return
  }
  if (!feedbackFormRef.value) return

  await feedbackFormRef.value.validate(async (valid) => {
    if (valid) {
      const success = await feedbackStore.addFeedback(props.courseId, props.studentId, feedbackForm)
      if (success) {
        ElMessage.success('反馈提交成功！')
        feedbackFormRef.value.resetFields() // 重置表单
        // 自动将 feedbackDate 重置回默认值，因为 resetFields 可能不会触发 DatePicker 的默认值
        await nextTick() // 等待 DOM 更新
        feedbackForm.feedbackDate = new Date().toISOString().split('T')[0]
        fetchHistory() // 刷新历史记录
      } else {
        ElMessage.error(feedbackStore.submissionError || '反馈提交失败，请稍后再试。')
      }
    } else {
      ElMessage.error('请检查表单填写是否完整正确。')
      return false
    }
  })
}

const fetchHistory = async () => {
  if (props.courseId && props.studentId) {
    await feedbackStore.fetchFeedbackForStudent(props.courseId, props.studentId)
  }
}

const formatFeedbackTimestamp = (date, time) => {
  let formattedDate = new Date(date).toLocaleDateString()
  return time ? `${formattedDate} ${time}` : formattedDate
}

// 当 studentId prop 变化时，自动加载该学生的历史反馈
// 并且清空/重置表单 (如果需要的话)
watch(
  () => props.studentId,
  (newStudentId, oldStudentId) => {
    if (newStudentId && newStudentId !== oldStudentId) {
      fetchHistory()
      // 重置表单到初始状态
      Object.assign(feedbackForm, initialFormState)
      feedbackForm.feedbackDate = new Date().toISOString().split('T')[0]
      if (feedbackFormRef.value) {
        // 清除校验状态，但保留用户可能已经输入的部分（如果产品设计如此）
        // 或者完全重置：feedbackFormRef.value.resetFields();
        // 这里我们选择保留上次提交后重置的状态
      }
    } else if (!newStudentId) {
      feedbackStore.clearHistory() // 如果没有学生ID了，清空历史记录
      Object.assign(feedbackForm, initialFormState) // 重置表单
    }
  },
  { immediate: true },
) // immediate: true 使得组件首次加载时也会执行一次，获取初始历史记录

onMounted(() => {
  // 如果 props.studentId 已经有值 (例如通过URL直接访问)，watch 的 immediate: true 会处理首次加载
  // 如果没有，用户选择学生后，watch 会触发
})
</script>

<style scoped>
.class-feedback-tab-page {
  /* 如果 StudentDashboardPage 已经有 padding，这里可以不需要或调整 */
}
.form-column,
.history-column {
  margin-bottom: 20px; /* 在小屏幕堆叠时提供间距 */
}
.feedback-form .el-form-item {
  margin-bottom: 18px;
}
.history-feedback-card {
  margin-bottom: 10px;
  border-left: 4px solid var(--el-color-primary-light-3);
}
.history-feedback-card p {
  margin-bottom: 6px;
  line-height: 1.6;
}
.history-feedback-card strong {
  margin-right: 5px;
}
.feedback-meta {
  margin-top: 10px;
  text-align: right;
  color: #909399;
}

/* 微调时间线样式 */
:deep(.el-timeline-item__timestamp) {
  font-size: 14px;
  font-weight: bold;
  color: #303133;
}
</style>
