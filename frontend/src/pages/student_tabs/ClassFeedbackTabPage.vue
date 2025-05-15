<script setup>
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useFeedbackStore } from '@/store/feedbackStore'
import { useAuthStore } from '@/store/authStore'
import { useCourseStore } from '@/store/courseStore'
import { useStudentStore } from '@/store/studentStore'

const route = useRoute()
const feedbackStore = useFeedbackStore()
const authStore = useAuthStore()
const courseStore = useCourseStore()
const studentStore = useStudentStore()

// 表单的引用，用于 Element Plus 表单验证和重置
const feedbackFormRef = ref(null)

// 统一管理表单的初始状态
const getInitialFeedbackData = () => ({
  feedbackDate: new Date(), // 默认今天
  classTime: '', // 时间选项
  customClassTimeStart: '', // 自定义开始时间
  customClassTimeEnd: '', // 自定义结束时间
  isCustomTime: false, // 标记是否使用自定义时间

  lastExtrapolationAssignmentDate: null,
  lastHomeworkStatus: '/', // 默认值 【完成情况】
  lastHomeworkFeedback: '', // 【完成反馈】

  teachingContent: '',
  classPerformance: '',
  progressMade: '',
  areasForImprovement: '',
  punctuality: '',
  extrapolationAbility: '',
})

// 表单数据模型
const feedbackData = reactive(getInitialFeedbackData())

// 用于在表单顶部显示的信息
const studentName = computed(() => studentStore.currentStudent?.name || '未知学生')
const teacherName = computed(() => authStore.currentUser?.username || '未知教师')
const courseName = computed(() => courseStore.currentCourse?.name || '未知课程')

// 时间选项
const timeOptions = [
  { value: '09:00 - 10:30', label: '09:00 - 10:30' },
  { value: '10:40 - 12:10', label: '10:40 - 12:10' },
  { value: '13:30 - 15:00', label: '13:30 - 15:00' },
  { value: '15:15 - 16:45', label: '15:15 - 16:45' },
  { value: '17:00 - 18:30', label: '17:00 - 18:30' },
  { value: 'custom', label: '自定义' },
]

// 监听 classTime 变化以切换自定义时间输入框的显示
watch(
  () => feedbackData.classTime,
  (newVal) => {
    feedbackData.isCustomTime = newVal === 'custom'
    if (!feedbackData.isCustomTime) {
      // 如果不是自定义，清空自定义时间，避免混淆
      feedbackData.customClassTimeStart = ''
      feedbackData.customClassTimeEnd = ''
    }
  },
)

// 计算属性：生成预览反馈文本
const generatedFeedbackText = computed(() => {
  let timeToDisplay = feedbackData.classTime
  if (timeToDisplay === 'custom') {
    // 当 classTime 仍为 'custom' 时
    if (feedbackData.customClassTimeStart && feedbackData.customClassTimeEnd) {
      timeToDisplay = `${feedbackData.customClassTimeStart} - ${feedbackData.customClassTimeEnd}`
    } else {
      timeToDisplay = '自定义时间未完整填写'
    }
  }

  // 格式化日期，如果存在的话
  const formatDate = (date) => {
    if (!date) return '未填写'
    // 如果已经是 YYYY-MM-DD 格式的字符串，直接使用；如果是 Date 对象，则转换
    if (typeof date === 'string') return date
    return new Date(date)
      .toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
      .replace(/\//g, '-')
  }

  return `
【学生姓名】：${studentName.value}
【上课日期】：${formatDate(feedbackData.feedbackDate)}
【上课时间】：${timeToDisplay || '未选择'}
【授课老师】：${teacherName.value}
【授课科目】：${courseName.value}

【上次举一反三布置时间】：${formatDate(feedbackData.lastExtrapolationAssignmentDate)}
【上次作业完成情况】：${feedbackData.lastHomeworkStatus || '/'}
【上次作业完成反馈】：${feedbackData.lastHomeworkFeedback || '无'}

【本次授课内容】：
${feedbackData.teachingContent || '无'}

【本次课堂表现】：
${feedbackData.classPerformance || '无'}

【进步之处】：
${feedbackData.progressMade || '无'}

【欠缺之处】：
${feedbackData.areasForImprovement || '无'}

【准时度】：${feedbackData.punctuality || '未记录'}

【举一反三】：
${feedbackData.extrapolationAbility || '无'}
  `.trim()
})

// 复制生成的文本到剪贴板
const copyGeneratedText = async () => {
  if (!generatedFeedbackText.value) {
    ElMessage.warning('没有可复制的反馈文本')
    return
  }
  try {
    await navigator.clipboard.writeText(generatedFeedbackText.value)
    ElMessage.success('反馈文本已复制到剪贴板！')
  } catch (err) {
    ElMessage.error('复制失败，您的浏览器可能不支持或未授权剪贴板操作，请手动复制。')
    console.error('Failed to copy text: ', err)
  }
}

// 提交反馈
const submitFeedback = async () => {
  if (!feedbackFormRef.value) return

  // 如果需要表单验证，可以在这里执行
  // await feedbackFormRef.value.validate(async (valid) => { if (valid) { ... } });
  // 这里我们暂时跳过 Element Plus 的 validate，直接提交

  const courseId = route.params.courseId
  const studentId = route.params.studentId

  if (!courseId || !studentId) {
    ElMessage.error('课程或学生信息丢失，无法提交反馈')
    return
  }

  // 准备要发送的数据
  const dataToSubmit = { ...feedbackData }

  // 如果是自定义时间，并且填写完整，则使用自定义时间拼接为 classTime
  if (dataToSubmit.isCustomTime) {
    if (dataToSubmit.customClassTimeStart && dataToSubmit.customClassTimeEnd) {
      dataToSubmit.classTime = `${dataToSubmit.customClassTimeStart} - ${dataToSubmit.customClassTimeEnd}`
    } else {
      // 如果自定义时间未完整填写，可以给用户提示或阻止提交
      ElMessage.warning('请完整填写自定义时间范围或选择预设时间')
      // 或者将 classTime 设置为空字符串或特定标记，让后端知道
      // dataToSubmit.classTime = ''; // 或者保持为 'custom' 由后端处理/忽略
      // 暂时保持 isCustomTime 为 true，后端目前不处理这个辅助字段
    }
  }

  // 删除前端辅助字段，这些字段不需要发送到后端
  delete dataToSubmit.customClassTimeStart
  delete dataToSubmit.customClassTimeEnd
  delete dataToSubmit.isCustomTime

  // 确保 feedbackDate 是 YYYY-MM-DD 格式的字符串或能被后端正确解析的格式
  if (dataToSubmit.feedbackDate instanceof Date) {
    // 假设后端期望 YYYY-MM-DD 字符串
    const year = dataToSubmit.feedbackDate.getFullYear()
    const month = (dataToSubmit.feedbackDate.getMonth() + 1).toString().padStart(2, '0')
    const day = dataToSubmit.feedbackDate.getDate().toString().padStart(2, '0')
    dataToSubmit.feedbackDate = `${year}-${month}-${day}`
  }
  if (dataToSubmit.lastExtrapolationAssignmentDate instanceof Date) {
    const year = dataToSubmit.lastExtrapolationAssignmentDate.getFullYear()
    const month = (dataToSubmit.lastExtrapolationAssignmentDate.getMonth() + 1)
      .toString()
      .padStart(2, '0')
    const day = dataToSubmit.lastExtrapolationAssignmentDate.getDate().toString().padStart(2, '0')
    dataToSubmit.lastExtrapolationAssignmentDate = `${year}-${month}-${day}`
  }

  const success = await feedbackStore.addFeedback(courseId, studentId, dataToSubmit)
  if (success) {
    ElMessage.success('反馈提交成功！')
    resetForm()
    await fetchHistory() // 提交成功后刷新历史记录
  } else {
    ElMessage.error(feedbackStore.submissionError || '反馈提交失败')
  }
}

// 重置表单
const resetForm = () => {
  Object.assign(feedbackData, getInitialFeedbackData())
  // Element Plus 表单可能需要 nextTick 来正确清除校验状态（如果启用了校验）
  nextTick(() => {
    if (feedbackFormRef.value) {
      feedbackFormRef.value.clearValidate() // 清除所有字段的校验状态
    }
  })
}

// 获取历史反馈的函数
const fetchHistory = async () => {
  const courseId = route.params.courseId
  const studentId = route.params.studentId
  if (courseId && studentId) {
    feedbackStore.clearHistory() // 先清空，避免重复数据（如果 store 没有自动处理）
    await feedbackStore.fetchFeedbackForStudent(courseId, studentId)
  } else {
    feedbackStore.clearHistory() // 如果没有学生选中，也清空历史
  }
}

// 组件挂载时获取当前学生反馈历史
onMounted(() => {
  fetchHistory()
})

// 监听路由参数变化，当学生或课程切换时，重新获取历史反馈
watch(
  () => [route.params.courseId, route.params.studentId],
  ([newCourseId, newStudentId], [oldCourseId, oldStudentId]) => {
    if (
      newCourseId &&
      newStudentId &&
      (newCourseId !== oldCourseId || newStudentId !== oldStudentId)
    ) {
      fetchHistory()
      resetForm() // 切换学生时重置表单
    }
  },
  { immediate: false }, // onMounted 已经处理了首次加载
)

// 监听当前学生变化 (来自 studentStore)，如果切换了学生也需要更新
watch(
  () => studentStore.currentStudent,
  (newStudent, oldStudent) => {
    if (newStudent && (!oldStudent || newStudent._id !== oldStudent._id)) {
      // 确保路由参数也已更新或与 newStudent 一致，避免重复调用 fetchHistory
      // 通常路由同步会先发生，然后 store 更新
      if (route.params.studentId === newStudent._id) {
        fetchHistory()
        resetForm()
      }
    } else if (!newStudent && oldStudent) {
      // 如果当前学生被清空
      feedbackStore.clearHistory()
      resetForm()
    }
  },
)

// ------------------------------
// 格式化日期用于显示 (可以根据需要调整输出格式)
const formatDisplayDate = (dateString, includeTime = false) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  const options = { year: 'numeric', month: '2-digit', day: '2-digit' }
  if (includeTime) {
    options.hour = '2-digit'
    options.minute = '2-digit'
  }
  return date.toLocaleDateString('zh-CN', options).replace(/\//g, '-')
}

// 为单个历史反馈项生成文本 (用于右侧汇总)
const generateSingleHistoryFeedbackText = (historyItem) => {
  if (!historyItem) return ''

  // 从 studentStore 获取当前学生姓名，从 authStore 获取当前教师（假设历史反馈的教师就是当前用户）
  // 或者，如果 feedback 对象本身就存储了当时的教师名和学生名、课程名，则直接使用
  // 这里我们假设历史反馈对象中已经包含了必要的信息，或者可以通过关联ID在store中查到
  // 为简化，我们直接使用 historyItem 中的字段，对于关联信息，您可能需要进一步处理

  const itemStudentName = studentStore.currentStudent?.name || '学生' // 理想情况下，历史反馈应存储当时的学生名
  const itemTeacherName = authStore.currentUser?.username || '老师' // 理想情况下，历史反馈应存储当时的老师名
  const itemCourseName = courseStore.currentCourse?.name || '课程' // 理想情况下，历史反馈应存储当时的课程名

  let timeToDisplay = historyItem.classTime || '未记录'

  return `
--- 记录于: ${formatDisplayDate(historyItem.createdAt, true)} ---
【学生姓名】：${itemStudentName}
【上课日期】：${formatDisplayDate(historyItem.feedbackDate)}
【上课时间】：${timeToDisplay}
【授课老师】：${itemTeacherName}
【授课科目】：${itemCourseName}

【上次举一反三布置时间】：${formatDisplayDate(historyItem.lastExtrapolationAssignmentDate)}
【上次作业完成情况】：${historyItem.lastHomeworkStatus || '/'}
【上次作业完成反馈】：${historyItem.lastHomeworkFeedback || '无'}

【本次授课内容】：
${historyItem.teachingContent || '无'}

【本次课堂表现】：
${historyItem.classPerformance || '无'}

【进步之处】：
${historyItem.progressMade || '无'}

【欠缺之处】：
${historyItem.areasForImprovement || '无'}

【准时度】：${historyItem.punctuality || '未记录'}

【举一反三】：
${historyItem.extrapolationAbility || '无'}
------------------------------------
  `.trim()
}

// 计算属性：将所有历史反馈转换为一个长字符串
const allHistoryAsText = computed(() => {
  if (!feedbackStore.feedbackHistory || feedbackStore.feedbackHistory.length === 0) {
    return ''
  }
  return feedbackStore.feedbackHistory
    .map((item) => generateSingleHistoryFeedbackText(item))
    .join('\n\n') // 每条反馈之间用两个换行符隔开
})

// 复制所有历史文本
const copyAllHistoryText = async () => {
  if (!allHistoryAsText.value) {
    ElMessage.warning('没有可复制的历史反馈文本')
    return
  }
  try {
    await navigator.clipboard.writeText(allHistoryAsText.value)
    ElMessage.success('所有历史反馈文本已复制到剪贴板！')
  } catch (err) {
    ElMessage.error('复制失败，您的浏览器可能不支持或未授权剪贴板操作，请手动复制。')
    console.error('Failed to copy all history text: ', err)
  }
}

// 动态计算右侧文本域的行数，使其大致能容纳内容
const calculateTextareaRows = (historyCount) => {
  if (historyCount === 0) return 5 // 默认最小行数
  return Math.max(10, Math.min(30, historyCount * 10)) // 每条记录大约10行，最小10行，最大30行
}

// 确保在 `onMounted` 和 `watch` 中调用 `WorkspaceHistory` 时，
// `feedbackStore.feedbackHistory` 会被正确更新，
// 这样 `v-if` 和 `v-for` 就能正确渲染历史反馈区域。
// (这部分已在上一份 <script setup> 代码中包含)
</script>

<template>
  <div class="class-feedback-tab-page p-4">
    <el-form :model="feedbackData" ref="feedbackFormRef" label-position="top">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card shadow="never">
            <template #header>
              <div class="card-header">
                <span>课堂反馈表单</span>
              </div>
            </template>

            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="日期" prop="feedbackDate">
                  <el-date-picker
                    v-model="feedbackData.feedbackDate"
                    type="date"
                    placeholder="选择日期"
                    style="width: 100%"
                    format="YYYY-MM-DD"
                    value-format="YYYY-MM-DD"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="时间" prop="classTime">
                  <el-select
                    v-model="feedbackData.classTime"
                    placeholder="选择时间"
                    style="width: 100%"
                  >
                    <el-option
                      v-for="item in timeOptions"
                      :key="item.value"
                      :label="item.label"
                      :value="item.value"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item v-if="feedbackData.isCustomTime" label="自定义时间范围">
                  <el-time-picker
                    v-model="feedbackData.customClassTimeStart"
                    placeholder="开始时间"
                    format="HH:mm"
                    value-format="HH:mm"
                    style="width: calc(50% - 5px); margin-right: 10px"
                  />
                  <el-time-picker
                    v-model="feedbackData.customClassTimeEnd"
                    placeholder="结束时间"
                    format="HH:mm"
                    value-format="HH:mm"
                    style="width: calc(50% - 5px)"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="学生">
                  <el-input :value="studentName" readonly />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="授课老师">
                  <el-input :value="teacherName" readonly />
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item label="授课科目">
              <el-input :value="courseName" readonly />
            </el-form-item>

            <el-form-item label="上次举一反三布置时间" prop="lastExtrapolationAssignmentDate">
              <el-date-picker
                v-model="feedbackData.lastExtrapolationAssignmentDate"
                type="date"
                placeholder="选择日期"
                style="width: 100%"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                clearable
              />
            </el-form-item>

            <el-form-item label="【完成情况】" prop="lastHomeworkStatus">
              <el-input
                v-model="feedbackData.lastHomeworkStatus"
                type="textarea"
                :rows="2"
                placeholder="描述上次作业或任务的完成情况"
              />
            </el-form-item>

            <el-form-item label="【完成反馈】" prop="lastHomeworkFeedback">
              <el-input
                v-model="feedbackData.lastHomeworkFeedback"
                type="textarea"
                :rows="2"
                placeholder="对完成情况的反馈或评价"
              />
            </el-form-item>

            <el-form-item label="授课内容" prop="teachingContent">
              <el-input
                v-model="feedbackData.teachingContent"
                type="textarea"
                :rows="3"
                placeholder="简述本次课主要内容"
              />
            </el-form-item>

            <el-form-item label="本次课堂表现" prop="classPerformance">
              <el-input
                v-model="feedbackData.classPerformance"
                type="textarea"
                :rows="3"
                placeholder="简述学生本次课堂的表现"
              />
            </el-form-item>

            <el-form-item label="进步之处" prop="progressMade">
              <el-input
                v-model="feedbackData.progressMade"
                type="textarea"
                :rows="2"
                placeholder="内部记录：观察到的进步"
              />
            </el-form-item>

            <el-form-item label="欠缺之处" prop="areasForImprovement">
              <el-input
                v-model="feedbackData.areasForImprovement"
                type="textarea"
                :rows="2"
                placeholder="内部记录：观察到的不足"
              />
            </el-form-item>

            <el-form-item label="准时度" prop="punctuality">
              <el-input v-model="feedbackData.punctuality" placeholder="简述是否准时" />
            </el-form-item>

            <el-form-item label="举一反三" prop="extrapolationAbility">
              <el-input
                v-model="feedbackData.extrapolationAbility"
                type="textarea"
                :rows="2"
                placeholder="布置下次课堂要完成的任务或准备"
              />
            </el-form-item>
          </el-card>
        </el-col>

        <el-col :span="12">
          <el-card shadow="never" style="height: 100%">
            <template #header>
              <div class="card-header">
                <span>反馈预览</span>
              </div>
            </template>
            <el-input
              type="textarea"
              :value="generatedFeedbackText"
              :rows="20"
              readonly
              placeholder="生成的预览文本将显示在这里"
            />
            <div style="margin-top: 10px; text-align: right">
              <el-button @click="copyGeneratedText">复制文本</el-button>
              <el-button
                type="primary"
                @click="submitFeedback"
                :loading="feedbackStore.isSubmitting"
              >
                保存反馈
              </el-button>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-form>

    <!-- <div class="history-feedback-section mt-6">
      <h3>历史反馈</h3>
    </div> -->

    <div
      class="history-feedback-section mt-6"
      v-if="feedbackStore.feedbackHistory && feedbackStore.feedbackHistory.length > 0"
    >
      <el-divider />
      <h3 style="margin-bottom: 16px; text-align: center; font-size: 1.2em">历史反馈记录</h3>
      <el-row :gutter="20">
        <el-col :span="12">
          <h4>反馈列表</h4>
          <el-timeline style="margin-top: 10px">
            <el-timeline-item
              v-for="item in feedbackStore.feedbackHistory"
              :key="item._id"
              :timestamp="
                formatDisplayDate(item.feedbackDate) + (item.classTime ? ' ' + item.classTime : '')
              "
              placement="top"
            >
              <el-card>
                <p><strong>授课内容:</strong> {{ item.teachingContent }}</p>
                <p><strong>课堂表现:</strong> {{ item.classPerformance }}</p>
                <p v-if="item.lastHomeworkStatus">
                  <strong>上次作业完成情况:</strong> {{ item.lastHomeworkStatus }}
                </p>
                <p v-if="item.lastHomeworkFeedback">
                  <strong>上次作业反馈:</strong> {{ item.lastHomeworkFeedback }}
                </p>
                <p v-if="item.progressMade"><strong>进步之处:</strong> {{ item.progressMade }}</p>
                <p v-if="item.areasForImprovement">
                  <strong>欠缺之处:</strong> {{ item.areasForImprovement }}
                </p>
                <p v-if="item.punctuality"><strong>准时度:</strong> {{ item.punctuality }}</p>
                <p v-if="item.extrapolationAbility">
                  <strong>举一反三布置:</strong> {{ item.extrapolationAbility }}
                </p>
                <p v-if="item.lastExtrapolationAssignmentDate" class="subtle-text">
                  <small
                    >上次举一反三布置于:
                    {{ formatDisplayDate(item.lastExtrapolationAssignmentDate) }}</small
                  >
                </p>
                <p class="subtle-text">
                  <small>记录于: {{ formatDisplayDate(item.createdAt, true) }}</small>
                </p>
              </el-card>
            </el-timeline-item>
          </el-timeline>
          <el-empty
            v-if="!feedbackStore.feedbackHistory.length && !feedbackStore.isLoadingHistory"
            description="暂无历史反馈记录"
          ></el-empty>
          <div v-if="feedbackStore.isLoadingHistory" v-loading="true" style="height: 100px"></div>
        </el-col>

        <el-col :span="12">
          <h4>纯文本汇总</h4>
          <el-input
            type="textarea"
            :value="allHistoryAsText"
            :rows="calculateTextareaRows(feedbackStore.feedbackHistory.length)"
            readonly
            style="margin-top: 10px"
            placeholder="历史反馈文本将汇总于此"
          />
          <el-button @click="copyAllHistoryText" v-if="allHistoryAsText" style="margin-top: 10px">
            复制所有历史文本
          </el-button>
        </el-col>
      </el-row>
    </div>
    <el-empty
      v-else-if="!feedbackStore.isLoadingHistory"
      description="暂无历史反馈记录，快去添加第一条吧！"
      style="margin-top: 20px"
    ></el-empty>
    <div
      v-if="
        feedbackStore.isLoadingHistory &&
        (!feedbackStore.feedbackHistory || feedbackStore.feedbackHistory.length === 0)
      "
      v-loading="true"
      style="height: 100px; margin-top: 20px"
    ></div>
  </div>
</template>

<style scoped>
.class-feedback-tab-page {
  max-width: 1400px; /* 根据需要调整最大宽度 */
  margin: auto;
}
.mt-6 {
  margin-top: 24px;
}
.card-header {
  font-weight: bold;
}
/* 如果需要，可以添加更多样式 */

.history-feedback-section {
  margin-top: 24px;
  padding-top: 20px; /* 与 el-divider 保持一些间距 */
}
.el-timeline-item__timestamp {
  font-size: 13px;
  color: #606266;
}
.el-card p {
  margin-bottom: 8px;
  line-height: 1.6;
}
.el-card p:last-child {
  margin-bottom: 0;
}
.subtle-text small {
  color: #909399;
  font-size: 0.85em;
}
.el-empty {
  padding: 20px 0;
}
</style>
