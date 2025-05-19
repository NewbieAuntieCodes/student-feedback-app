<template>
  <div class="monthly-summary-tab-page">
    <el-row :gutter="20">
      <el-col :span="16">
        <el-card class="summary-form-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>月度总结编辑区</span>
              <el-date-picker
                id="month-picker"
                v-model="selectedMonth.date"
                type="month"
                placeholder="选择总结月份"
                format="YYYY年MM月"
                value-format="YYYY-MM"
                :disabled-date="disabledFutureMonths"
                @change="onMonthYearChange"
                size="small"
                style="width: 150px; margin-left: 15px"
              />
            </div>
          </template>

          <el-form
            v-if="currentStudent && selectedMonth.year && selectedMonth.month"
            ref="summaryFormRef"
            :model="summaryFormData"
            :rules="summaryFormRules"
            label-position="top"
            class="summary-details-form"
            :disabled="isLoadingSummary || isSavingSummary"
          >
            <el-row :gutter="16">
              <el-col :span="6">
                <el-form-item label="学生姓名" prop="studentName">
                  <el-input v-model="summaryFormData.studentName" disabled />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="授课老师" prop="teacherName">
                  <el-input v-model="summaryFormData.teacherName" disabled />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="授课科目" prop="subjectName">
                  <el-input v-model="summaryFormData.subjectName" disabled />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="总结月份" prop="summaryDateDisplay">
                  <el-input v-model="summaryFormData.summaryDateDisplay" disabled />
                </el-form-item>
              </el-col>
            </el-row>

            <el-form-item label="授课内容" prop="teachingContentCombined">
              <el-input
                v-model="summaryFormData.teachingContentCombined"
                type="textarea"
                :autosize="{ minRows: 4, maxRows: 8 }"
                placeholder="点击上方“生成月度总结内容”按钮自动汇总本月所有反馈中的授课内容，或手动编辑。"
              />
            </el-form-item>

            <el-form-item label="课程进度（是否如期）" prop="courseProgress">
              <el-input
                v-model="summaryFormData.courseProgress"
                placeholder="如: 如期, 稍有提前, 略微延后等"
              />
            </el-form-item>

            <el-form-item label="进步之处" prop="progressMadeCombined">
              <el-input
                v-model="summaryFormData.progressMadeCombined"
                type="textarea"
                :autosize="{ minRows: 4, maxRows: 8 }"
                placeholder="点击上方“生成月度总结内容”按钮自动汇总本月所有反馈中的进步之处，或手动编辑。"
              />
            </el-form-item>

            <el-form-item label="欠缺之处" prop="areasForImprovementCombined">
              <el-input
                v-model="summaryFormData.areasForImprovementCombined"
                type="textarea"
                :autosize="{ minRows: 4, maxRows: 8 }"
                placeholder="点击上方“生成月度总结内容”按钮自动汇总本月所有反馈中的欠缺之处，或手动编辑。"
              />
            </el-form-item>

            <el-form-item label="提升方案" prop="improvementPlanCombined">
              <el-input
                v-model="summaryFormData.improvementPlanCombined"
                type="textarea"
                :autosize="{ minRows: 4, maxRows: 8 }"
                placeholder="点击上方“生成月度总结内容”按钮自动汇总本月所有反馈中的提升方案，或手动编辑。"
              />
            </el-form-item>

            <el-form-item label="后续课程内容" prop="followUpContent">
              <el-input
                v-model="summaryFormData.followUpContent"
                type="textarea"
                :autosize="{ minRows: 4, maxRows: 6 }"
                placeholder="简要描述后续课程的教学内容或下一阶段的学习计划和重点。"
              />
            </el-form-item>
          </el-form>
          <el-empty v-else-if="!currentStudent" description="请先在左侧选择一位学生" />
          <el-empty v-else description="请选择一个总结月份以开始编辑或生成总结" />

          <el-button
            type="primary"
            :loading="isGeneratingPreview"
            @click="handleGenerateSummaryPreview"
          >
            生成月度总结内容
          </el-button>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="summary-preview-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>月度总结预览 (可编辑)</span>
            </div>
          </template>
          <div v-if="currentStudent && selectedMonth.year && selectedMonth.month">
            <el-input
              v-model="editablePreviewText"
              type="textarea"
              :autosize="{ minRows: 30, maxRows: 40 }"
              placeholder="这里将显示格式化后的月度总结预览文本，您可以直接在此编辑。"
              class="preview-textarea"
            />
            <div class="preview-actions" style="margin-top: 15px; text-align: right">
              <el-button @click="handleCopyPreviewText" :disabled="!editablePreviewText">
                <el-icon><DocumentCopy /></el-icon> 复制文本
              </el-button>
              <el-button
                type="success"
                @click="handleSaveMonthlySummary"
                :loading="isSavingSummary"
                :disabled="!editablePreviewText || isLoadingSummary"
              >
                <el-icon><Finished /></el-icon> 保存月度总结
              </el-button>
            </div>
          </div>
          <el-empty v-else description="请先选择学生和总结月份，并生成或载入总结内容以进行预览。" />
        </el-card>
      </el-col>
    </el-row>

    <el-divider content-position="center" style="margin-top: 30px">历史月度总结记录</el-divider>

    <el-card class="summary-history-card" shadow="never" style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>历史月度总结</span>
          <el-button
            v-if="currentStudent"
            type="default"
            size="small"
            @click="fetchSummaryHistory"
            :loading="isLoadingHistory"
          >
            刷新历史
          </el-button>
        </div>
      </template>
      <div
        v-if="isLoadingHistory"
        v-loading="isLoadingHistory"
        element-loading-text="加载历史记录中..."
        style="min-height: 100px"
      ></div>
      <el-scrollbar v-else-if="summaryHistory.length > 0" height="400px" class="history-scrollbar">
        <el-timeline class="summary-timeline">
          <el-timeline-item
            v-for="summary in summaryHistory"
            :key="summary._id"
            :timestamp="formatSummaryDateForDisplay(summary.summaryDate)"
            placement="top"
          >
            <el-card shadow="hover" class="history-summary-card">
              <div class="history-summary-content">
                <div v-if="summary.summaryTextContent">
                  <pre class="history-text-block">{{ summary.summaryTextContent }}</pre>
                </div>

                <div v-else>
                  <p v-if="summary.courseProgress">
                    <strong>课程进度:</strong> {{ summary.courseProgress }}
                  </p>
                  <div v-if="summary.followUpContent">
                    <strong>后续课程内容:</strong>
                    <pre>{{ summary.followUpContent }}</pre>
                  </div>
                  <p v-if="!summary.courseProgress && !summary.followUpContent">
                    该月总结核心内容未记录。
                  </p>

                  <div
                    class="history-meta"
                    style="margin-top: 10px; font-size: 0.85em; color: #909399"
                  >
                    <p>授课老师: {{ summary.teacherName }} | 科目: {{ summary.subjectName }}</p>
                    <p>保存于: {{ formatFullDateTime(summary.updatedAt) }}</p>
                  </div>
                </div>
                <div class="history-actions" style="margin-top: 10px; text-align: right">
                  <el-button
                    type="primary"
                    text
                    size="small"
                    @click="loadSummaryForEditing(summary)"
                    title="加载此总结到编辑区进行修改"
                  >
                    加载编辑
                  </el-button>
                  <el-popconfirm
                    title="确定删除这条月度总结吗？"
                    confirm-button-text="确定"
                    cancel-button-text="取消"
                    @confirm="() => handleDeleteSummary(summary._id)"
                  >
                    <template #reference>
                      <el-button type="danger" text size="small" :loading="isDeletingSummary">
                        删除
                      </el-button>
                    </template>
                  </el-popconfirm>
                </div>
              </div>
            </el-card>
          </el-timeline-item>
        </el-timeline>
      </el-scrollbar>
      <el-empty v-else-if="!currentStudent" description="请先选择一位学生以查看其历史月度总结。" />
      <el-empty v-else description="该学生暂无历史月度总结记录。" />

      <div v-if="historyError" class="error-message">
        <el-alert type="error" :title="historyError" show-icon :closable="false" />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useMonthlySummaryStore } from '@/store/monthlySummaryStore'
import { useStudentStore } from '@/store/studentStore'
import { useCourseStore } from '@/store/courseStore'
import { useAuthStore } from '@/store/authStore'
import { ElMessage, ElMessageBox } from 'element-plus'
import { DocumentCopy, Finished } from '@element-plus/icons-vue' // 确保图标已安装或按需导入
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
dayjs.locale('zh-cn')

const route = useRoute()
const monthlySummaryStore = useMonthlySummaryStore()
const studentStore = useStudentStore()
const courseStore = useCourseStore()
const authStore = useAuthStore()

// Refs for UI state
const summaryFormRef = ref(null)
const selectedMonth = reactive({
  date: null, // YYYY-MM string from date-picker
  year: null,
  month: null,
})
const editablePreviewText = ref('') // 用于右侧可编辑预览区

// Data for the form on the left
const initialSummaryFormData = () => ({
  studentName: '',
  teacherName: '',
  subjectName: '',
  summaryDateDisplay: '', // 例如 "2024年05月"
  teachingContentCombined: '',
  progressMadeCombined: '',
  areasForImprovementCombined: '',
  improvementPlanCombined: '',
  courseProgress: '如期',
  followUpContent: '',
})
const summaryFormData = reactive(initialSummaryFormData())

// Form rules (example)
const summaryFormRules = reactive({
  // 根据需要添加验证规则，但预览区主要是文本编辑，
  // 左侧表单的字段可能是 disabled 或由预览区内容填充
  // teachingContentCombined: [{ required: true, message: '授课内容汇总不能为空', trigger: 'blur' }],
  // followUpContent: [{ required: true, message: '后续课程内容不能为空', trigger: 'blur' }],
})

// Computed properties from store
const currentStudent = computed(() => studentStore.currentStudent)
const currentCourse = computed(() => courseStore.selectedCourse)
const currentUser = computed(() => authStore.currentUser)

const isLoadingSummary = computed(() => monthlySummaryStore.isLoadingSummary)
const isGeneratingPreview = computed(() => monthlySummaryStore.isGeneratingPreview)
const isSavingSummary = computed(() => monthlySummaryStore.isSavingSummary)
const isLoadingHistory = computed(() => monthlySummaryStore.isLoadingHistory)
const isDeletingSummary = computed(() => monthlySummaryStore.isDeletingSummary)
const summaryHistory = computed(() => monthlySummaryStore.summaryHistory)
const historyError = computed(() => monthlySummaryStore.historyError)

// --- Date Picker Logic ---
const disabledFutureMonths = (time) => {
  return dayjs(time).isAfter(dayjs(), 'month')
}

// --- Utility Functions ---
const formatSummaryDateForDisplay = (summaryDateStr) => {
  // YYYY-MM
  if (!summaryDateStr) return ''
  return dayjs(summaryDateStr).format('YYYY年MM月')
}

const formatFullDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return ''
  return dayjs(dateTimeStr).format('YYYY-MM-DD HH:mm')
}

// Function to combine form data into the preview text
const generatePreviewTextFromFormData = () => {
  if (!currentStudent.value || !selectedMonth.year || !selectedMonth.month) {
    return ''
  }
  // 基于您截图的样式，这里提供一个简单的纯文本组合方式
  // 您可以根据实际需要的格式进行调整
  let text = `月度学习总结 (${selectedMonth.year}年${selectedMonth.month}月)\n`
  text += `学生：${summaryFormData.studentName || currentStudent.value.name}\n`
  text += `授课老师：${summaryFormData.teacherName || (currentUser.value ? currentUser.value.username : 'N/A')}\n`
  text += `授课科目：${summaryFormData.subjectName || (currentCourse.value ? currentCourse.value.name : 'N/A')}\n`
  text += `\n`

  text += `[授课内容]\n${summaryFormData.teachingContentCombined}\n\n`
  text += `[课程进度]\n${summaryFormData.courseProgress || '如期'}\n\n`
  text += `[进步之处]\n${summaryFormData.progressMadeCombined}\n\n`
  text += `[注意之处]\n${summaryFormData.areasForImprovementCombined}\n\n`
  text += `[提升方案]\n${summaryFormData.improvementPlanCombined}\n\n`
  text += `[后续课程内容]\n${summaryFormData.followUpContent}\n`

  return text.trim()
}

// --- Event Handlers & Actions ---

const resetFormAndPreview = () => {
  Object.assign(summaryFormData, initialSummaryFormData())
  editablePreviewText.value = ''
  if (summaryFormRef.value) {
    summaryFormRef.value.clearValidate()
  }
  monthlySummaryStore.clearCurrentSummaryAndPreview()
}

const onMonthYearChange = async (value) => {
  resetFormAndPreview()
  if (value && currentStudent.value && currentCourse.value) {
    const [year, month] = value.split('-')
    selectedMonth.year = year
    selectedMonth.month = month

    // 自动填充基础信息
    summaryFormData.studentName = currentStudent.value.name
    summaryFormData.teacherName = currentUser.value?.username || 'N/A'
    summaryFormData.subjectName = currentCourse.value.name
    summaryFormData.summaryDateDisplay = formatSummaryDateForDisplay(value)

    // 尝试获取已保存的总结
    await monthlySummaryStore.fetchOrInitializeMonthlySummary(
      currentCourse.value._id,
      currentStudent.value._id,
      year,
      month,
    )
    if (monthlySummaryStore.currentSummary) {
      loadSummaryDataToForm(monthlySummaryStore.currentSummary)
      editablePreviewText.value = generatePreviewTextFromFormData() // 根据加载的表单数据生成预览
    } else {
      ElMessage.info('该月无已保存总结，请点击“生成月度总结内容”或手动填写。')
      // editablePreviewText.value = generatePreviewTextFromFormData() // 也可以基于空表单生成一个模板
    }
  } else {
    selectedMonth.year = null
    selectedMonth.month = null
  }
}

const handleGenerateSummaryPreview = async () => {
  if (
    !currentStudent.value ||
    !currentCourse.value ||
    !selectedMonth.year ||
    !selectedMonth.month
  ) {
    ElMessage.warning('请先选择学生和总结月份。')
    return
  }
  const courseId = currentCourse.value._id
  const studentId = currentStudent.value._id

  const generatedContent = await monthlySummaryStore.generatePreviewSummaryContent(
    courseId,
    studentId,
    selectedMonth.year,
    selectedMonth.month,
  )

  if (generatedContent) {
    summaryFormData.teachingContentCombined = generatedContent.teachingContentCombined || ''
    summaryFormData.progressMadeCombined = generatedContent.progressMadeCombined || ''
    summaryFormData.areasForImprovementCombined = generatedContent.areasForImprovementCombined || ''
    summaryFormData.improvementPlanCombined = generatedContent.improvementPlanCombined || ''
    // 自动填充基础信息
    summaryFormData.studentName = currentStudent.value.name
    summaryFormData.teacherName = currentUser.value?.username || 'N/A'
    summaryFormData.subjectName = currentCourse.value.name
    summaryFormData.summaryDateDisplay = formatSummaryDateForDisplay(
      `${selectedMonth.year}-${selectedMonth.month}`,
    )

    editablePreviewText.value = generatePreviewTextFromFormData() // 更新可编辑预览区
    ElMessage.success('月度总结内容已生成，请在预览区查看和编辑。')
  } else if (monthlySummaryStore.generatePreviewError) {
    ElMessage.error(`生成预览失败: ${monthlySummaryStore.generatePreviewError}`)
  } else {
    ElMessage.info('该月无反馈记录可供汇总，或生成预览时发生未知错误。表单部分字段可能为空。')
    // 即使生成失败，也尝试填充基础信息并更新预览
    summaryFormData.studentName = currentStudent.value.name
    summaryFormData.teacherName = currentUser.value?.username || 'N/A'
    summaryFormData.subjectName = currentCourse.value.name
    summaryFormData.summaryDateDisplay = formatSummaryDateForDisplay(
      `${selectedMonth.year}-${selectedMonth.month}`,
    )
    editablePreviewText.value = generatePreviewTextFromFormData()
  }
}

const handleSaveMonthlySummary = async () => {
  if (
    !currentStudent.value ||
    !currentCourse.value ||
    !selectedMonth.year ||
    !selectedMonth.month
  ) {
    ElMessage.error('缺少必要的学生、课程或月份信息。')
    return
  }
  if (!editablePreviewText.value.trim()) {
    ElMessage.error('预览内容不能为空，请先生成或填写月度总结。')
    return
  }

  // 构建要保存的数据对象
  const dataToSave = {
    // 核心内容来自可编辑的预览文本区域
    // 假设后端模型有一个字段来存储这个完整的文本，例如 'fullPreviewText' 或 'summaryTextContent'
    // 您需要与后端模型字段对应起来
    summaryTextContent: editablePreviewText.value, // <--- 主要修改点

    // 其他辅助字段，如果仍然从左侧表单获取：
    courseProgress: summaryFormData.courseProgress,
    followUpContent: summaryFormData.followUpContent,

    // 后端可能仍然需要这些字段来识别和关联，或者可以从参数中获取
    // studentName: summaryFormData.studentName, // 通常后端会根据 studentId 自动关联
    // teacherName: summaryFormData.teacherName, // 通常后端会根据 userId 自动关联
    // subjectName: summaryFormData.subjectName, // 通常后端会根据 courseId 自动关联
  }

  // 调用 store action 保存
  const success = await monthlySummaryStore.saveMonthlySummary(
    currentCourse.value._id,
    currentStudent.value._id,
    selectedMonth.year,
    selectedMonth.month,
    dataToSave, // 发送包含纯文本预览的数据
  )

  if (success) {
    ElMessage.success('月度总结保存成功！')
    await fetchSummaryHistory() // 刷新历史记录
    // 可选：如果保存后需要清空或重置编辑区，可以在这里处理
    // resetFormAndPreview();
    // selectedMonth.date = null;
  } else {
    ElMessage.error(monthlySummaryStore.saveSummaryError || '保存月度总结失败。')
  }
}

const handleCopyPreviewText = async () => {
  if (!editablePreviewText.value) {
    ElMessage.warning('没有可复制的内容。')
    return
  }
  try {
    await navigator.clipboard.writeText(editablePreviewText.value)
    ElMessage.success('总结内容已复制到剪贴板！')
  } catch (err) {
    ElMessage.error('复制失败，您的浏览器可能不支持或权限不足。')
    console.error('Failed to copy text: ', err)
  }
}

const fetchSummaryHistory = async () => {
  if (currentStudent.value && currentCourse.value) {
    await monthlySummaryStore.fetchSummaryHistory(currentCourse.value._id, currentStudent.value._id)
  }
}

const loadSummaryDataToForm = (summary) => {
  // summary 是从 store 获取的 currentSummary 或历史条目
  if (!summary) return
  summaryFormData.studentName = currentStudent.value?.name || 'N/A'
  summaryFormData.teacherName =
    summary.teacherName || (currentUser.value ? currentUser.value.username : 'N/A')
  summaryFormData.subjectName =
    summary.subjectName || (currentCourse.value ? currentCourse.value.name : 'N/A')
  summaryFormData.summaryDateDisplay = formatSummaryDateForDisplay(summary.summaryDate)

  // 如果后端模型中，旧的汇总字段和 summaryTextContent 是并存的，则都加载
  // 如果旧的汇总字段已经被废弃，只依赖 summaryTextContent，那么这里可能不需要加载它们
  summaryFormData.teachingContentCombined = summary.teachingContentCombined || ''
  summaryFormData.progressMadeCombined = summary.progressMadeCombined || ''
  summaryFormData.areasForImprovementCombined = summary.areasForImprovementCombined || ''
  summaryFormData.improvementPlanCombined = summary.improvementPlanCombined || ''

  summaryFormData.courseProgress = summary.courseProgress || '如期'
  summaryFormData.followUpContent = summary.followUpContent || ''

  // 关键：将保存的纯文本内容填充到可编辑预览区
  if (summary.summaryTextContent) {
    editablePreviewText.value = summary.summaryTextContent
  } else {
    // 如果没有 summaryTextContent (可能是旧数据或未生成)，
    // 则根据已加载到 form 的数据重新生成预览文本
    editablePreviewText.value = generatePreviewTextFromFormData()
  }
}

// const onMonthYearChange = async (value) => {
//   resetFormAndPreview()
//   if (value && currentStudent.value && currentCourse.value) {
//     const [year, month] = value.split('-')
//     selectedMonth.year = year
//     selectedMonth.month = month

//     summaryFormData.studentName = currentStudent.value.name
//     summaryFormData.teacherName = currentUser.value?.username || 'N/A'
//     summaryFormData.subjectName = currentCourse.value.name
//     summaryFormData.summaryDateDisplay = formatSummaryDateForDisplay(value)

//     await monthlySummaryStore.fetchOrInitializeMonthlySummary(
//       currentCourse.value._id,
//       currentStudent.value._id,
//       year,
//       month,
//     )
//     if (monthlySummaryStore.currentSummary) {
//       loadSummaryDataToForm(monthlySummaryStore.currentSummary) // loadSummaryDataToForm 内部会设置 editablePreviewText
//     } else {
//       ElMessage.info('该月无已保存总结，请点击“生成月度总结内容”或手动填写。')
//       editablePreviewText.value = generatePreviewTextFromFormData() // 基于当前（可能为空的）表单生成模板
//     }
//   } else {
//     selectedMonth.year = null
//     selectedMonth.month = null
//   }
// }

const loadSummaryForEditing = (summaryFromHistory) => {
  if (!summaryFromHistory) return

  // 1. 设置当前选定的月份，这将触发 onMonthYearChange
  // onMonthYearChange 会调用 fetchOrInitializeMonthlySummary，然后 loadSummaryDataToForm
  selectedMonth.date = summaryFromHistory.summaryDate

  // 2. （可选，但推荐）在 onMonthYearChange 完成后，确保 editablePreviewText
  //    确实是来自 summaryFromHistory.summaryTextContent，而不是由 generatePreviewTextFromFormData 覆盖。
  //    这通常由 loadSummaryDataToForm 正确处理。
  //    如果 loadSummaryDataToForm 中的逻辑不够，可以考虑在这里显式设置：
  //    nextTick(() => { // 确保 DOM 更新和 onMonthYearChange 的异步操作后执行
  //      if (monthlySummaryStore.currentSummary && monthlySummaryStore.currentSummary._id === summaryFromHistory._id) {
  //        editablePreviewText.value = summaryFromHistory.summaryTextContent || generatePreviewTextFromFormData();
  //      }
  //    });

  ElMessage.info(
    `已加载 ${formatSummaryDateForDisplay(summaryFromHistory.summaryDate)} 的总结到编辑区。`,
  )
}

// 当 editablePreviewText 被用户直接编辑时，我们不反向更新左侧的 summaryFormData 的分段字段。
// 左侧的 summaryFormData.teachingContentCombined 等字段主要用于 "生成月度总结内容" 时
// 作为数据源来组合成初始的 editablePreviewText。
// 保存时，以 editablePreviewText 为准。

// generatePreviewTextFromFormData 函数保持不变，它用于从左侧表单生成初始的预览文本。
// handleSaveMonthlySummary 函数也保持不变（如我上一条回复中修改的那样，发送 summaryTextContent: editablePreviewText.value）。

const handleDeleteSummary = async (summaryId) => {
  if (!currentStudent.value || !currentCourse.value) return

  const success = await monthlySummaryStore.deleteMonthlySummary(
    currentCourse.value._id,
    currentStudent.value._id,
    summaryId,
  )
  if (success) {
    ElMessage.success('月度总结删除成功！')
    // 如果删除的是当前正在编辑的总结，需要清空表单和预览
    if (
      monthlySummaryStore.currentSummary &&
      monthlySummaryStore.currentSummary._id === summaryId
    ) {
      resetFormAndPreview()
      selectedMonth.date = null // 清空月份选择，避免自动加载刚被删除的
      selectedMonth.year = null
      selectedMonth.month = null
    }
    // fetchSummaryHistory() 会在 store action 成功后自动被调用（如果需要的话）
    // 或者这里可以再次调用
  } else {
    ElMessage.error(monthlySummaryStore.deleteSummaryError || '删除月度总结失败。')
  }
}

// Watchers
watch(
  () => currentStudent.value,
  (newStudent, oldStudent) => {
    monthlySummaryStore.clearAllSummaryErrors()
    monthlySummaryStore.clearSummaryHistory()
    resetFormAndPreview()
    selectedMonth.date = null // 学生切换时清空月份选择
    selectedMonth.year = null
    selectedMonth.month = null
    if (newStudent && currentCourse.value) {
      fetchSummaryHistory()
    }
  },
  { immediate: false }, // 根据AppLayout的初始化逻辑，这里可能不需要immediate
)

watch(
  () => currentCourse.value,
  (newCourse, oldCourse) => {
    monthlySummaryStore.clearAllSummaryErrors()
    monthlySummaryStore.clearSummaryHistory()
    resetFormAndPreview()
    selectedMonth.date = null // 课程切换时清空月份选择
    selectedMonth.year = null
    selectedMonth.month = null
    if (currentStudent.value && newCourse) {
      fetchSummaryHistory()
    }
  },
  { immediate: false },
)

// Watch the form data to update the preview text in real-time
// Debounce this if performance becomes an issue with large texts
watch(
  summaryFormData,
  () => {
    if (selectedMonth.year && selectedMonth.month) {
      // 只在选了月份后才根据表单更新预览
      editablePreviewText.value = generatePreviewTextFromFormData()
    }
  },
  { deep: true },
)

// Initial data load
onMounted(async () => {
  monthlySummaryStore.clearAllSummaryErrors()
  if (currentStudent.value && currentCourse.value) {
    await fetchSummaryHistory()
  }
  // If there's a month pre-selected (e.g. from query params or previous state), load it
  // For now, require manual month selection
})
</script>

<style scoped>
.monthly-summary-tab-page {
  padding: 20px;
}

.card-header {
  display: flex;
  /* justify-content: space-between; */
  align-items: center;
  gap: 10px;
}

.summary-form-card,
.summary-preview-card,
.summary-history-card {
  margin-bottom: 20px; /* Common margin for cards */
}

/* .month-selector-form {
  margin-bottom: 20px;
} */

.summary-details-form .el-form-item {
  margin-bottom: 18px;
}

.preview-textarea .el-textarea__inner {
  /* Adjust if needed, but el-input type="textarea" usually handles scrolling well */
  min-height: 300px; /* Ensure a decent minimum height */
  font-family:
    'Courier New', Courier, monospace; /* Monospaced font for better text alignment if needed */
  line-height: 1.6;
  white-space: pre-wrap; /* Preserve whitespace and newlines */
  word-wrap: break-word; /* Break long words */
}

.preview-actions {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.history-scrollbar {
  padding-right: 10px; /* Avoid scrollbar overlapping content */
}

.summary-timeline .el-timeline-item {
  padding-bottom: 20px;
}

.history-summary-card {
  border-left: 4px solid var(--el-color-primary-light-3);
}

.history-summary-content {
  font-size: 0.9rem;
  color: #606266;
}

.history-text-block {
  white-space: pre-wrap; /* Preserve formatting */
  word-break: break-word;
  background-color: #f9f9f9;
  padding: 8px 12px;
  border-radius: 4px;
  margin-top: 5px;
  margin-bottom: 10px;
  font-family: 'Courier New', Courier, monospace;
  line-height: 1.6;
}
.history-meta {
  font-size: 0.8em;
  color: #909399;
  margin-top: 8px;
}
.history-meta p {
  margin: 2px 0;
}

.history-actions {
  margin-top: 10px;
  text-align: right;
}
.error-message {
  margin-top: 15px;
}
</style>
