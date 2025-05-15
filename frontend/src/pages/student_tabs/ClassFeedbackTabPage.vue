<script setup>
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ElMessageBox } from 'element-plus'
import { useFeedbackStore } from '@/store/feedbackStore'
import { useAuthStore } from '@/store/authStore'
import { useCourseStore } from '@/store/courseStore'
import { useStudentStore } from '@/store/studentStore'

const route = useRoute()
const feedbackStore = useFeedbackStore()
const authStore = useAuthStore()
const courseStore = useCourseStore()
const studentStore = useStudentStore()

const feedbackFormRef = ref(null)

// 辅助函数：格式化日期用于显示 (确保它在被模板中的 v-for 调用前定义)
const formatDisplayDate = (dateString, includeTime = false) => {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  let options = { year: 'numeric', month: '2-digit', day: '2-digit' }
  if (includeTime) {
    options = { ...options, hour: '2-digit', minute: '2-digit', hour12: false } // 移除秒，根据需要调整
  }
  // 修复 Safari/iOS 下 toLocaleDateString 可能不替换 / 的问题
  let formattedDate = date.toLocaleDateString('zh-CN', options)
  if (formattedDate.includes('/')) {
    formattedDate = formattedDate.replace(/\//g, '-')
  }
  // 如果包含时间，确保格式是 YYYY-MM-DD HH:MM
  if (includeTime) {
    const parts = formattedDate.split(' ')
    if (parts.length === 2) {
      const datePart = parts[0]
      const timePart = parts[1]
      if (timePart.split(':').length === 2) {
        // 已经是 HH:MM
        formattedDate = `${datePart} ${timePart}`
      } else if (timePart.split(':').length === 3) {
        // 是 HH:MM:SS，移除秒
        formattedDate = `${datePart} ${timePart.substring(0, timePart.lastIndexOf(':'))}`
      }
    } else if (parts.length === 1 && formattedDate.includes('T')) {
      // ISO String with T
      const [datePart, timePartFull] = formattedDate.split('T')
      if (timePartFull) {
        const timePart = timePartFull.substring(0, 5) // HH:MM
        formattedDate = `${datePart.replace(/\//g, '-')} ${timePart}`
      }
    }
  } else {
    // 确保日期部分是 YYYY-MM-DD
    if (formattedDate.includes(' ')) {
      formattedDate = formattedDate.split(' ')[0]
    }
  }
  return formattedDate
}

const getInitialFeedbackData = () => ({
  feedbackDate: new Date(), // 默认当天日期
  classTime: '', // <--- 修改：默认为空，不预选时间
  customClassTimeStart: '',
  customClassTimeEnd: '',
  isCustomTime: false,
  lastExtrapolationAssignmentDate: null, // 默认为空
  lastHomeworkStatus: '/',
  lastHomeworkFeedback: '',
  teachingContent: '',
  classPerformance: '',
  progressMade: '',
  areasForImprovement: '',
  punctuality: '准时',
  extrapolationAbility: '',
  // 新增: 用于存储可编辑的预览文本
  editablePreviewText: '',
})

const feedbackData = reactive(getInitialFeedbackData())

const studentName = computed(() => studentStore.currentStudent?.name || '未知学生')
const teacherName = computed(() => authStore.currentUser?.username || '未知教师')
const courseName = computed(() => courseStore.currentCourse?.name || '未知课程')

const timeOptions = [
  { value: '09:00 - 10:30', label: '09:00 - 10:30' },
  { value: '10:40 - 12:10', label: '10:40 - 12:10' },
  { value: '13:30 - 15:00', label: '13:30 - 15:00' },
  { value: '15:15 - 16:45', label: '15:15 - 16:45' },
  { value: '17:00 - 18:30', label: '17:00 - 18:30' },
  { value: 'custom', label: '自定义' },
]

watch(
  () => feedbackData.classTime,
  (newVal) => {
    feedbackData.isCustomTime = newVal === 'custom'
    if (!feedbackData.isCustomTime) {
      feedbackData.customClassTimeStart = ''
      feedbackData.customClassTimeEnd = ''
    }
  },
)

// 用于表单提交时格式化日期
const formatDateForSubmit = (date) => {
  if (!date) return null
  const d = new Date(date)
  if (isNaN(d.getTime())) return null // 无效日期处理
  const year = d.getFullYear()
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}
// --- 日期格式化函数结束 ---

// --- generatedFeedbackText 计算属性 (核心预览逻辑) ---
const generatedFeedbackText = computed(() => {
  // ... (之前的实现，确保使用 feedbackData 中的值) ...
  // 这里我们先保持原样，稍后讨论直接修改预览文本的问题
  let timeToDisplay = feedbackData.classTime
  if (timeToDisplay === 'custom') {
    if (feedbackData.customClassTimeStart && feedbackData.customClassTimeEnd) {
      timeToDisplay = `${feedbackData.customClassTimeStart} - ${feedbackData.customClassTimeEnd}`
    } else {
      timeToDisplay = '自定义时间未完整填写'
    }
  }
  const text = `
【学生姓名】：${studentName.value}
【上课日期】：${formatDisplayDate(feedbackData.feedbackDate)}
【上课时间】：${timeToDisplay || '未选择'}
【授课老师】：${teacherName.value}
【授课科目】：${courseName.value}

【上次举一反三布置时间】：${formatDisplayDate(feedbackData.lastExtrapolationAssignmentDate)}
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
  // 当表单数据变化时，如果 editablePreviewText 还没有被用户编辑过（或者我们选择在每次表单变动时都重置它），
  // 就更新 editablePreviewText
  if (feedbackData.editablePreviewText === '' || !userHasEditedPreview.value) {
    // 引入一个新ref: userHasEditedPreview
    feedbackData.editablePreviewText = text
  }
  return text // 这个计算属性仍然返回基于表单的文本，用于可能的比较或原始版本
})

// 新增 ref，标记用户是否已编辑预览文本
const userHasEditedPreview = ref(false)

// 监听 editablePreviewText 的用户输入，一旦输入就标记为已编辑
watch(
  () => feedbackData.editablePreviewText,
  (newValue, oldValue) => {
    // 这个侦听器仅用于在用户首次修改预览文本时设置标记
    // 避免在表单数据程序性更新预览文本时错误地设置此标记
    // 因此，我们可能需要更复杂的逻辑来判断是否是“用户主动修改”
    // 简单起见，如果新旧值不同，且旧值是程序生成的，则认为是用户修改
    if (
      newValue !== oldValue &&
      oldValue === generatedFeedbackText.value &&
      generatedFeedbackText.value !== ''
    ) {
      userHasEditedPreview.value = true
    }
    // 或者更简单粗暴的方式：只要 editablePreviewText 被改动，就认为是用户编辑了
    // if (newValue !== generatedFeedbackText.value) { // 这会在每次表单变动也触发
    //     userHasEditedPreview.value = true;
    // }
  },
)

const copyGeneratedText = async () => {
  // 现在复制的是可编辑的预览文本
  const textToCopy = feedbackData.editablePreviewText || generatedFeedbackText.value
  if (!textToCopy) {
    ElMessage.warning('没有可复制的反馈文本')
    return
  }
  try {
    await navigator.clipboard.writeText(textToCopy)
    ElMessage.success('反馈文本已复制到剪贴板！')
  } catch (err) {
    ElMessage.error('复制失败，请手动复制。')
  }
}

const submitFeedback = async () => {
  // ... (courseId, studentId 获取不变) ...
  if (!feedbackFormRef.value) return

  const courseId = route.params.courseId
  const studentId = route.params.studentId

  if (!courseId || !studentId) {
    ElMessage.error('课程或学生信息丢失，无法提交反馈')
    return
  }

  // 准备要发送的数据: 以 feedbackData 为基础
  const dataToSubmit = {
    feedbackDate: formatDateForSubmit(feedbackData.feedbackDate),
    classTime: feedbackData.classTime, // classTime 已经在 watch 中处理或直接来自选项
    lastExtrapolationAssignmentDate: formatDateForSubmit(
      feedbackData.lastExtrapolationAssignmentDate,
    ),
    lastHomeworkStatus: feedbackData.lastHomeworkStatus,
    lastHomeworkFeedback: feedbackData.lastHomeworkFeedback,
    teachingContent: feedbackData.teachingContent,
    classPerformance: feedbackData.classPerformance,
    progressMade: feedbackData.progressMade,
    areasForImprovement: feedbackData.areasForImprovement,
    punctuality: feedbackData.punctuality,
    extrapolationAbility: feedbackData.extrapolationAbility,
    // 注意：这里不直接发送 editablePreviewText，因为后端模型没有这个字段。
    // 如果需要将用户修改后的文本作为“主要反馈内容”，你需要决定它映射到哪个后端字段，
    // 或者新增一个字段。
    // 例如，如果用户修改了预览文本，且我们想用它覆盖 teachingContent：
    // if (userHasEditedPreview.value && feedbackData.editablePreviewText !== generatedFeedbackText.value) {
    //   dataToSubmit.teachingContent = feedbackData.editablePreviewText; // 或者一个新的字段如 'finalFeedbackText'
    //   ElMessage.info("使用了您在预览框中修改的文本作为主要反馈内容。");
    // }
  }

  if (feedbackData.isCustomTime) {
    if (feedbackData.customClassTimeStart && feedbackData.customClassTimeEnd) {
      dataToSubmit.classTime = `${feedbackData.customClassTimeStart} - ${feedbackData.customClassTimeEnd}`
    } else {
      ElMessage.warning('请完整填写自定义时间范围或选择预设时间')
      return
    }
  }
  // 不需要再 delete isCustomTime 等，因为 dataToSubmit 是按需构建的

  const success = await feedbackStore.addFeedback(courseId, studentId, dataToSubmit)
  if (success) {
    ElMessage.success('反馈提交成功！')
    resetForm()
    await fetchHistory()
  } else {
    ElMessage.error(feedbackStore.submissionError || '反馈提交失败')
  }
}

const resetForm = () => {
  Object.assign(feedbackData, getInitialFeedbackData())
  userHasEditedPreview.value = false // 重置表单时，也重置编辑标记
  // editablePreviewText 会在 generatedFeedbackText 下次计算时自动更新 (因为 userHasEditedPreview 为 false)
  nextTick(() => {
    if (feedbackFormRef.value) {
      feedbackFormRef.value.clearValidate()
    }
    // 确保 editablePreviewText 也被重置为初始生成的文本
    // generatedFeedbackText 会重新计算，然后上面的 watch 会触发更新 editablePreviewText
  })
}

const fetchHistory = async () => {
  const courseId = route.params.courseId
  const studentId = route.params.studentId
  if (courseId && studentId) {
    feedbackStore.clearHistory()
    await feedbackStore.fetchFeedbackForStudent(courseId, studentId)
  } else {
    feedbackStore.clearHistory()
  }
}

const populateFormWithHistory = (historyItem) => {
  if (!historyItem) return
  resetForm() // 先重置表单到初始状态

  // 1. 反馈日期始终为当天 (由 getInitialFeedbackData 和 resetForm 完成)
  // feedbackData.feedbackDate = new Date(); // 这行现在可以省略，因为 resetForm 会做

  // 2. 上次举一反三布置时间 为该历史反馈的 feedbackDate
  feedbackData.lastExtrapolationAssignmentDate = historyItem.feedbackDate
    ? new Date(historyItem.feedbackDate)
    : null

  // 3. 复用其他字段
  // (处理 classTime 的逻辑保持不变)
  const predefinedTime = timeOptions.find((opt) => opt.value === historyItem.classTime)
  if (predefinedTime && predefinedTime.value !== 'custom') {
    feedbackData.classTime = historyItem.classTime
    feedbackData.isCustomTime = false
    feedbackData.customClassTimeStart = ''
    feedbackData.customClassTimeEnd = ''
  } else if (historyItem.classTime && historyItem.classTime.includes(' - ')) {
    const parts = historyItem.classTime.split(' - ')
    if (
      parts.length === 2 &&
      /^([01]\d|2[0-3]):([0-5]\d)$/.test(parts[0]) &&
      /^([01]\d|2[0-3]):([0-5]\d)$/.test(parts[1])
    ) {
      feedbackData.classTime = 'custom'
      feedbackData.isCustomTime = true
      feedbackData.customClassTimeStart = parts[0]
      feedbackData.customClassTimeEnd = parts[1]
    } else {
      feedbackData.classTime = '' // 清空，让用户重新选择
      feedbackData.isCustomTime = false
    }
  } else {
    feedbackData.classTime = '' // 清空，让用户重新选择
    feedbackData.isCustomTime = false
  }

  feedbackData.lastHomeworkStatus = historyItem.lastHomeworkStatus || '/'
  feedbackData.lastHomeworkFeedback = historyItem.lastHomeworkFeedback || ''
  feedbackData.teachingContent = historyItem.teachingContent || ''
  feedbackData.classPerformance = historyItem.classPerformance || ''
  feedbackData.progressMade = historyItem.progressMade || ''
  feedbackData.areasForImprovement = historyItem.areasForImprovement || ''
  feedbackData.punctuality = historyItem.punctuality || '准时' // 如果历史没有，则用默认的“准时”
  feedbackData.extrapolationAbility = historyItem.extrapolationAbility || ''

  // editablePreviewText 会通过 generatedFeedbackText 的重新计算而更新
  userHasEditedPreview.value = false // 从历史记录填充时，重置编辑标记

  ElMessage.info('表单已使用历史反馈填充，日期已更新为今天，请检查并修改其他内容。')
  nextTick(() => {
    if (feedbackFormRef.value) {
      feedbackFormRef.value.clearValidate()
    }
  })
}

onMounted(() => {
  // `feedbackData.feedbackDate` 在 `getInitialFeedbackData` 中已设为当天
  // `feedbackData.punctuality` 在 `getInitialFeedbackData` 中已设为 "准时"
  // `feedbackData.classTime` 在 `getInitialFeedbackData` 中已设为 '' (空)
  fetchHistory()
})

watch(
  () => [route.params.courseId, route.params.studentId],
  ([newCourseId, newStudentId], [oldCourseId, oldStudentId]) => {
    if (
      newCourseId &&
      newStudentId &&
      (newCourseId !== oldCourseId || newStudentId !== oldStudentId)
    ) {
      fetchHistory()
      resetForm()
    }
  },
  { immediate: false },
)

watch(
  () => studentStore.currentStudent,
  (newStudent, oldStudent) => {
    if (newStudent && (!oldStudent || newStudent._id !== oldStudent._id)) {
      if (route.params.studentId === newStudent._id) {
        fetchHistory()
        resetForm()
      }
    } else if (!newStudent && oldStudent) {
      feedbackStore.clearHistory()
      resetForm()
    }
  },
)

// --- 历史反馈删除功能 ---
const handleDeleteFeedback = async (feedbackId) => {
  if (!feedbackId) return
  try {
    await ElMessageBox.confirm('确定要删除这条反馈记录吗？此操作无法撤销。', '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    // 【【假设 feedbackStore 中有 deleteFeedback action，并且 feedbackService 中有对应方法】】
    // const courseId = route.params.courseId;
    // const studentId = route.params.studentId;
    // const success = await feedbackStore.deleteFeedback(courseId, studentId, feedbackId);

    // 【【临时前端模拟删除，后续需要您实现后端和store的删除逻辑】】
    ElMessage.warning('删除功能后端接口待实现。此处仅为前端模拟。')
    feedbackStore.feedbackHistory = feedbackStore.feedbackHistory.filter(
      (fb) => fb._id !== feedbackId,
    )
    // 【【模拟结束】】

    // if (success) {
    //   ElMessage.success('反馈删除成功！');
    //   fetchHistory(); // 重新获取列表
    // } else {
    //   ElMessage.error(feedbackStore.error || '删除反馈失败');
    // }
  } catch (e) {
    if (e !== 'cancel') {
      console.error('删除反馈时出错:', e)
      ElMessage.error('删除操作取消或发生错误')
    }
  }
}

// --- 历史反馈文本生成相关 ---
// (generateSingleHistoryFeedbackText, allHistoryAsText, copyAllHistoryText, calculateTextareaRows 保持不变,
//  但要确保 formatDisplayDate 在它们之前定义或可访问)

const generateSingleHistoryFeedbackText = (historyItem) => {
  if (!historyItem) return ''
  const itemStudentName = studentStore.currentStudent?.name || '学生'
  const itemTeacherName = authStore.currentUser?.username || '老师'
  const itemCourseName = courseStore.currentCourse?.name || '课程'
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

const allHistoryAsText = computed(() => {
  if (!feedbackStore.feedbackHistory || feedbackStore.feedbackHistory.length === 0) {
    return ''
  }
  return feedbackStore.feedbackHistory
    .map((item) => generateSingleHistoryFeedbackText(item))
    .join('\n\n')
})

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

const calculateTextareaRows = (historyCount) => {
  if (historyCount === 0) return 5
  return Math.max(10, Math.min(30, historyCount * 10))
}
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
                <span>反馈预览 (可编辑)</span>
              </div>
            </template>
            <el-input
              type="textarea"
              v-model="feedbackData.editablePreviewText"
              :rows="20"
              placeholder="生成的预览文本将显示在这里，您可以直接修改"
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
              <el-card @click="populateFormWithHistory(item)" style="cursor: pointer">
                <template #header v-if="false">
                  {/* Element Plus Card 的 header 不太适合放按钮，我们放内容区底部 */}
                </template>
                <p><strong>授课内容:</strong> {{ item.teachingContent }}</p>
                <p class="subtle-text">
                  <small>记录于: {{ formatDisplayDate(item.createdAt, true) }}</small>
                </p>

                <div style="margin-top: 10px; text-align: right">
                  <!-- {/* 新增删除按钮区域 */} -->
                  <el-button type="danger" size="small" @click.stop="handleDeleteFeedback(item._id)"
                    >删除</el-button
                  >
                  <!-- {/* @click.stop 防止触发卡片的点击事件 */} -->
                </div>
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
