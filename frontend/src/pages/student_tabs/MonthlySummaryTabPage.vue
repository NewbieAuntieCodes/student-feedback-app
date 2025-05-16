<script setup>
import { ref, computed, onMounted, watch, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { useMonthlySummaryStore } from '@/store/monthlySummaryStore'
import { useStudentStore } from '@/store/studentStore'
import { useCourseStore } from '@/store/courseStore'
import { useAuthStore } from '@/store/authStore'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn' // 引入中文语言包
dayjs.locale('zh-cn') // 设置dayjs的语言为中文

const route = useRoute()
const monthlySummaryStore = useMonthlySummaryStore()
const studentStore = useStudentStore()
const courseStore = useCourseStore()
const authStore = useAuthStore()

const currentStudent = computed(() => studentStore.selectedStudent)
const currentCourse = computed(() => courseStore.currentCourse)
const currentUser = computed(() => authStore.currentUser)

const activeSummary = computed(() => monthlySummaryStore.activeSummary)
const summaryHistory = computed(() => monthlySummaryStore.historicalSummaries)
const isLoadingSummary = computed(() => monthlySummaryStore.isLoadingSummary)
const isLoadingHistory = computed(() => monthlySummaryStore.isLoadingHistory)
const isUpdatingSummary = computed(() => monthlySummaryStore.isUpdatingSummary)

// 用于年月选择器
const selectedMonth = ref(dayjs()) // 默认当前月

// 表单数据，用于编辑月度总结
// 我们将 activeSummary 的内容同步到这个响应式对象中进行编辑
const summaryEditForm = reactive({
  _id: null,
  student: '',
  course: '',
  user: '',
  summaryDate: '',
  teacherName: '',
  subjectName: '',
  teachingContentCombined: '',
  courseProgress: '如期',
  progressMadeCombined: '',
  areasForImprovementCombined: '',
  improvementPlanCombined: '',
  followUpContent: '',
})

const courseProgressOptions = [
  { value: '如期', label: '如期' },
  { value: '提前', label: '提前' },
  { value: '延后', label: '延后' },
  { value: '未定', label: '未定' },
]

// 当 activeSummary (从 store 获取的) 变化时，更新本地编辑表单
watch(
  activeSummary,
  (newSummary) => {
    if (newSummary) {
      Object.keys(summaryEditForm).forEach((key) => {
        if (newSummary[key] !== undefined) {
          summaryEditForm[key] = newSummary[key]
        }
      })
      // 确保 summaryDate 是 YYYY-MM 格式，用于显示，即使后端可能存储完整日期或不同格式
      if (newSummary.summaryDate) {
        summaryEditForm.summaryDate = dayjs(newSummary.summaryDate, [
          'YYYY-MM-DDTHH:mm:ss.SSSZ',
          'YYYY-MM',
        ]).format('YYYY-MM')
      }
    } else {
      // 如果 selectedMonth 也无效，可能需要更彻底的重置或默认值
      console.warn(
        'activeSummary is null and selectedMonth is not a valid dayjs object during reset attempt.',
      )
      // 可以在这里设置一个绝对的默认月份，或者确保 selectedMonth 总是有初始值
      selectedMonth.value = dayjs() // 强制设为当前月再重置
      resetSummaryEditForm()
    }
  },
  { deep: true }, // 移除了 immediate: true
)

function resetSummaryEditForm() {
  const year = selectedMonth.value.year()
  const month = selectedMonth.value.month() + 1
  summaryEditForm._id = null
  summaryEditForm.student = currentStudent.value?._id || ''
  summaryEditForm.course = currentCourse.value?._id || ''
  summaryEditForm.user = currentUser.value?._id || ''
  summaryEditForm.summaryDate = `${year}-${String(month).padStart(2, '0')}`
  summaryEditForm.teacherName = currentUser.value?.username || 'N/A'
  summaryEditForm.subjectName = currentCourse.value?.name || 'N/A'
  summaryEditForm.teachingContentCombined = ''
  summaryEditForm.courseProgress = '如期'
  summaryEditForm.progressMadeCombined = ''
  summaryEditForm.areasForImprovementCombined = ''
  summaryEditForm.improvementPlanCombined = ''
  summaryEditForm.followUpContent = ''
}

const fetchSummaryData = async () => {
  // 确保 selectedMonth 是有效的 dayjs 对象
  if (!selectedMonth.value || typeof selectedMonth.value.year !== 'function') {
    console.warn('fetchSummaryData called with invalid selectedMonth. Aborting.')
    selectedMonth.value = dayjs() // 尝试重置为当前月
    // return; // 可以选择中止，或者让后续逻辑处理
  }

  const student = currentStudent.value
  const course = currentCourse.value

  if (student && student._id && course && course._id) {
    const year = selectedMonth.value.year()
    const month = selectedMonth.value.month() + 1
    console.log(
      `Workspaceing summary for Student: ${student.name}, Course: ${course.name}, Date: ${year}-${month}`,
    )
    await monthlySummaryStore.fetchOrInitializeMonthlySummary(course._id, student._id, year, month)
    // 只有在成功获取当前总结或初始化后，再获取历史（或者并行，但要注意依赖关系）
    await monthlySummaryStore.fetchSummaryHistory(course._id, student._id)
  } else {
    console.warn(
      'Cannot fetch summary data: currentStudent or currentCourse is missing or invalid.',
      { student, course },
    )
    monthlySummaryStore.clearCurrentSummary()
    monthlySummaryStore.clearSummaryHistory()
    // 当学生或课程信息不完整时，也应重置表单
    if (selectedMonth.value && typeof selectedMonth.value.year === 'function') {
      resetSummaryEditForm()
    } else {
      selectedMonth.value = dayjs() // 确保 selectedMonth 有效
      resetSummaryEditForm()
    }
  }
}

onMounted(async () => {
  console.log('MonthlySummaryTabPage onMounted: route params', route.params)
  const courseId = route.params.courseId
  const studentId = route.params.studentId

  // 确保 Pinia stores 中的数据已准备好
  if (courseId && (!courseStore.currentCourse || courseStore.currentCourse._id !== courseId)) {
    console.log('MonthlySummaryTabPage onMounted: Selecting course', courseId)
    await courseStore.selectCourse(courseId) // 确保课程数据已加载
  }
  if (
    studentId &&
    courseId &&
    (!studentStore.selectedStudent || studentStore.selectedStudent._id !== studentId)
  ) {
    console.log(
      'MonthlySummaryTabPage onMounted: Setting current student',
      studentId,
      'for course',
      courseId,
    )
    await studentStore.fetchStudentsInCourseAndSetCurrent(courseId, studentId) // 确保学生数据已加载并设置为当前
  }

  // 在确保 student 和 course 信息有效后再调用 fetchSummaryData
  if (studentStore.selectedStudent && courseStore.currentCourse) {
    fetchSummaryData()
  } else {
    console.warn(
      'MonthlySummaryTabPage onMounted: Student or Course not ready, skipping initial fetchSummaryData.',
    )
    // 可以在这里设置一个默认的空状态或提示
    monthlySummaryStore.clearCurrentSummary()
    monthlySummaryStore.clearSummaryHistory()
    resetSummaryEditForm()
  }
})

const handleMonthChange = () => {
  fetchSummaryData()
}

const handleSaveSummary = async () => {
  if (!summaryEditForm.student || !summaryEditForm.course) {
    ElMessage.error('学生或课程信息丢失，无法保存。')
    return
  }
  // 如果 summaryEditForm._id 为 null，表示这是个新创建的空总结（基于fetchOrInitializeMonthlySummary的默认值）
  // 这种情况下，用户修改的应该是后续内容和课程进度。
  // 后端 updateUserModifiedSummary API 需要一个 summaryId。
  // 这意味着：如果一个月份完全没有反馈，后端就不会有这条总结记录。
  // 我们的 fetchOrInitializeMonthlySummary 会创建一个前端的临时对象。
  // 用户对这个临时对象的修改，如果想保存，需要后端有一个 "创建或更新" 的 API，或者前端引导用户先产生反馈。

  // 当前逻辑：只允许更新已存在的总结 (即 _id 不为 null)
  // 或者，如果后端允许通过 studentId, courseId, summaryDate 来 upsert，则不需要 _id。
  // 我们现在的 monthlySummaryStore.saveCurrentUserModifiedSummary 依赖于 currentSummary._id
  // 而 currentSummary._id 在 summaryEditForm._id 中

  if (!summaryEditForm._id) {
    ElMessage.warning(
      '此月份尚无后端生成的总结记录，通常由反馈自动生成。请先确保当月有反馈，或联系管理员。当前修改无法直接保存为新记录。',
    )
    // 或者，你可以设计一个专门的 "创建新总结" 的按钮和逻辑（如果业务需要用户主动创建无反馈月份的总结）
    return
  }

  const dataToSave = {
    courseProgress: summaryEditForm.courseProgress,
    followUpContent: summaryEditForm.followUpContent,
    // 允许用户微调这些字段
    teachingContentCombined: summaryEditForm.teachingContentCombined,
    progressMadeCombined: summaryEditForm.progressMadeCombined,
    areasForImprovementCombined: summaryEditForm.areasForImprovementCombined,
    improvementPlanCombined: summaryEditForm.improvementPlanCombined,
  }

  const success = await monthlySummaryStore.saveCurrentUserModifiedSummary(dataToSave)
  if (success) {
    ElMessage.success('月度总结保存成功！')
    // 重新获取数据以确保同步
    await fetchSummaryData()
  } else {
    ElMessage.error(monthlySummaryStore.updateSummaryError || '保存月度总结失败。')
  }
}

const handleCopySummary = async () => {
  if (!activeSummary.value && !summaryEditForm.summaryDate) {
    // 检查是否有可复制内容
    ElMessage.warning('没有可复制的总结内容。')
    return
  }

  let textToCopy = `【月度总结 - ${summaryEditForm.summaryDate}】\n`
  textToCopy += `学生：${currentStudent.value?.name || 'N/A'}\n`
  textToCopy += `老师：${summaryEditForm.teacherName || 'N/A'}\n`
  textToCopy += `科目：${summaryEditForm.subjectName || 'N/A'}\n\n`
  textToCopy += `课程进度：${summaryEditForm.courseProgress}\n\n`
  textToCopy += `授课内容回顾：\n${summaryEditForm.teachingContentCombined || '无记录'}\n\n`
  textToCopy += `进步之处：\n${summaryEditForm.progressMadeCombined || '无记录'}\n\n`
  textToCopy += `欠缺之处：\n${summaryEditForm.areasForImprovementCombined || '无记录'}\n\n`
  textToCopy += `提升方案：\n${summaryEditForm.improvementPlanCombined || '无记录'}\n\n`
  textToCopy += `后续课程内容：\n${summaryEditForm.followUpContent || '无记录'}\n`

  try {
    await navigator.clipboard.writeText(textToCopy)
    ElMessage.success('月度总结已复制到剪贴板！')
  } catch (err) {
    console.error('复制月度总结失败:', err)
    ElMessage.error('复制失败，您的浏览器可能不支持此功能。')
  }
}

const loadSummaryFromHistory = (summaryItem) => {
  if (summaryItem && summaryItem.summaryDate) {
    // 将历史记录的 summaryDate (YYYY-MM) 转换为 dayjs 对象给年月选择器
    selectedMonth.value = dayjs(summaryItem.summaryDate, 'YYYY-MM')
    // fetchSummaryData 会被 selectedMonth 的 watch 触发，或者手动调用
    // fetchSummaryData(); // 或者依赖 watch selectedMonth.value
    // 为了确保是点击历史记录加载的，我们直接用历史数据填充
    Object.keys(summaryEditForm).forEach((key) => {
      if (summaryItem[key] !== undefined) {
        summaryEditForm[key] = summaryItem[key]
      }
    })
    if (summaryItem.summaryDate) {
      // 再次格式化以防万一
      summaryEditForm.summaryDate = dayjs(summaryItem.summaryDate, [
        'YYYY-MM-DDTHH:mm:ss.SSSZ',
        'YYYY-MM',
      ]).format('YYYY-MM')
    }

    // 如果 currentSummary 没有被 watch 正确更新，可以手动设置
    if (monthlySummaryStore.currentSummary?._id !== summaryItem._id) {
      monthlySummaryStore.currentSummary = { ...summaryItem }
    }

    ElMessage.info(`已加载 ${summaryItem.summaryDate} 的月度总结。`)
  }
}

onMounted(() => {
  fetchSummaryData()
})

// 监听学生或课程变化，重新加载数据
watch(
  [() => route.params.studentId, () => route.params.courseId],
  () => {
    selectedMonth.value = dayjs() // 学生或课程变化时，重置为当前月
    fetchSummaryData()
  },
  { immediate: false },
) // onMounted 会处理初次加载

// 监听年月选择器的变化
watch(
  selectedMonth,
  (newVal, oldVal) => {
    // 确保 newVal 和 oldVal 都是有效的 dayjs 对象
    const isValidNewVal = newVal && typeof newVal.isSame === 'function'
    const isValidOldVal = oldVal && typeof oldVal.isSame === 'function'

    if (isValidNewVal) {
      if (!isValidOldVal || (isValidOldVal && !newVal.isSame(oldVal, 'month'))) {
        console.log('Selected month changed, fetching summary data:', newVal.format('YYYY-MM'))
        fetchSummaryData()
      }
    } else if (newVal === null && isValidOldVal) {
      // 如果新值是null（例如日期选择器被清空）
      console.log(
        'Selected month cleared, fetching summary data for potentially null month or default.',
      )
      // 根据您的业务逻辑，决定清空时是否也调用 fetchSummaryData
      // 或者重置/清空总结显示
      // fetchSummaryData(); // 如果您希望清空也触发获取（可能获取默认月份）
      monthlySummaryStore.clearCurrentSummary() // 示例：清空当前总结
      resetSummaryEditForm() // 重置表单到初始或基于当前默认月份的状态
    }
  },
  { immediate: false },
) // immediate: false 通常是好的，因为 onMounted 会处理首次加载
</script>

<template>
  <div class="monthly-summary-tab-page">
    <el-row :gutter="20" class="controls-row">
      <el-col :span="24">
        <!-- <el-card shadow="never"> -->
        <!-- <el-form inline>
            <el-form-item label="选择年月查看/编辑总结:">
              <el-date-picker
                v-model="selectedMonth"
                type="month"
                placeholder="选择月份"
                format="YYYY年MM月"
                value-format="YYYY-MM-DD"
                :clearable="false"
                style="width: 180px"
              />
            </el-form-item>

          </el-form> -->
        <!-- </el-card> -->
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :xs="24" :sm="16">
        <el-card shadow="hover" class="summary-display-card">
          <template #header>
            <div class="card-header">
              <span>
                月度总结: {{ summaryEditForm.summaryDate || '选择年月' }}
                <small
                  v-if="activeSummary && activeSummary.updatedAt"
                  style="margin-left: 10px; color: #909399; font-size: 0.8em"
                >
                  (上次更新: {{ dayjs(activeSummary.updatedAt).format('YYYY-MM-DD HH:mm') }})
                </small>
              </span>
            </div>
          </template>
          <div v-if="isLoadingSummary" class="loading-placeholder">
            <el-skeleton :rows="10" animated />
          </div>
          <div v-else-if="currentStudent && summaryEditForm.summaryDate">
            <el-form :model="summaryEditForm" label-position="top" label-width="auto">
              <el-row :gutter="15">
                <el-col :span="6">
                  <el-form-item label="学生">
                    <el-input :value="currentStudent.name" readonly disabled />
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="授课老师">
                    <el-input v-model="summaryEditForm.teacherName" readonly disabled />
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="授课科目">
                    <el-input v-model="summaryEditForm.subjectName" readonly disabled />
                  </el-form-item>
                </el-col>

                <el-col :span="6">
                  <el-form-item label="课程进度 (是否如期)" prop="courseProgress">
                    <el-select
                      v-model="summaryEditForm.courseProgress"
                      placeholder="请选择课程进度"
                    >
                      <el-option
                        v-for="item in courseProgressOptions"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-form-item label="授课内容" prop="teachingContentCombined">
                <el-input
                  type="textarea"
                  v-model="summaryEditForm.teachingContentCombined"
                  :rows="4"
                  placeholder="由当月反馈自动汇总生成，可微调"
                />
              </el-form-item>

              <el-form-item label="进步之处" prop="progressMadeCombined">
                <el-input
                  type="textarea"
                  v-model="summaryEditForm.progressMadeCombined"
                  :rows="4"
                  placeholder="由当月反馈自动汇总生成，可微调"
                />
              </el-form-item>

              <el-form-item label="欠缺之处" prop="areasForImprovementCombined">
                <el-input
                  type="textarea"
                  v-model="summaryEditForm.areasForImprovementCombined"
                  :rows="4"
                  placeholder="由当月反馈自动汇总生成，可微调"
                />
              </el-form-item>

              <el-form-item label="提升方案" prop="improvementPlanCombined">
                <el-input
                  type="textarea"
                  v-model="summaryEditForm.improvementPlanCombined"
                  :rows="4"
                  placeholder="由当月反馈自动汇总生成，可微调"
                />
              </el-form-item>

              <el-form-item label="后续课程内容" prop="followUpContent">
                <el-input
                  type="textarea"
                  v-model="summaryEditForm.followUpContent"
                  :rows="3"
                  placeholder="请输入后续课程的教学计划和建议"
                />
              </el-form-item>

              <el-form-item>
                <el-button
                  type="primary"
                  @click="handleSaveSummary"
                  :loading="isUpdatingSummary"
                  :disabled="!summaryEditForm._id && !activeSummary"
                  title="通常由反馈自动生成和更新，此处保存用户的手动修改"
                >
                  保存当前总结修改
                </el-button>
                <el-button
                  @click="handleCopySummary"
                  :disabled="!activeSummary && !summaryEditForm.summaryDate"
                  >复制总结文本</el-button
                >
              </el-form-item>
            </el-form>
          </div>
          <el-empty v-else-if="!currentStudent" description="请先选择一个学生。"></el-empty>
          <el-empty v-else description="选择年月以查看或编辑月度总结。"></el-empty>
        </el-card>
      </el-col>

      <el-col :xs="24" :sm="8">
        <el-card shadow="hover" class="history-card">
          <template #header>
            <div class="card-header">
              <span>历史月度总结</span>
            </div>
          </template>
          <div v-if="isLoadingHistory" class="loading-placeholder">
            <el-skeleton :rows="5" animated />
          </div>
          <div v-else-if="summaryHistory.length > 0">
            <el-timeline>
              <el-timeline-item
                v-for="item in summaryHistory"
                :key="item._id"
                :timestamp="dayjs(item.summaryDate, 'YYYY-MM').format('YYYY年MM月')"
                placement="top"
                type="primary"
                hollow
              >
                <el-button link type="primary" @click="loadSummaryFromHistory(item)">
                  {{ dayjs(item.summaryDate, 'YYYY-MM').format('YYYY年MM月') }} -
                  {{ item.subjectName }}
                </el-button>
                <small style="display: block; color: #909399; font-size: 0.8em">
                  (更新于: {{ dayjs(item.updatedAt).format('MM-DD HH:mm') }})
                </small>
              </el-timeline-item>
            </el-timeline>
          </div>
          <el-empty v-else-if="!currentStudent" description="请选择学生查看历史。"></el-empty>
          <el-empty v-else description="暂无历史月度总结。"></el-empty>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.monthly-summary-tab-page {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.controls-row {
  margin-bottom: 20px;
  flex-shrink: 0;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
}
.summary-display-card,
.history-card {
  height: calc(100vh - 200px); /* 估算高度，可根据实际布局调整 */
  overflow-y: auto;
}
.loading-placeholder {
  padding: 20px;
}
.el-form-item {
  margin-bottom: 18px;
}
.el-timeline {
  padding-left: 5px;
}
.el-timeline-item {
  padding-bottom: 10px;
}
</style>
