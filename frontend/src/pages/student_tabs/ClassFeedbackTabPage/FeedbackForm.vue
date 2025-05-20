<script setup>
import { ref, computed } from 'vue'
import dayjs from 'dayjs' // 如果子组件需要dayjs进行格式化或默认值

const props = defineProps({
  modelValue: {
    // 使用 v-model:feedbackFormValue
    type: Object,
    required: true,
  },
  formRef: {
    type: Object,
    default: () => ref(null), // 如果 feedbackFormRef 是在父组件中创建的
  },
  currentStudent: {
    type: Object,
    default: null,
  },
  currentUser: {
    type: Object,
    default: null,
  },
  currentCourse: {
    type: Object,
    default: null,
  },
  classTimeOptions: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['update:modelValue', 'generate-preview', 'reset-form'])

// 如果需要对 props.modelValue 进行深度拷贝以避免直接修改 prop，
// 或者如果表单状态完全由子组件管理，则需要不同的处理方式。
// 这里假设父组件传递的是一个响应式对象，并且子组件可以通过 emit 更新它。
// 或者，更常见的是，每个字段都作为单独的 prop 传递，并通过 v-model:fieldName 更新。
// 为了简化，这里我们先假设 modelValue 是一个包含所有表单字段的对象。
// 若要实现真正的双向绑定效果，每个字段单独用 props + emits (v-model:fieldName) 会更清晰。
// 但考虑到 feedbackForm 在父组件中由 useForm 管理，父组件直接持有状态更合理。
// 因此，子组件通过 emit('update:modelValue', newFormState) 来建议父组件更新整个表单对象。
// 或者，更细粒度地，通过 emit('update-field', { field: 'fieldName', value: 'newValue' })

// 内部引用，用于模板中的 v-model。
// 这是一种将 props 与本地状态同步的方式，如果直接修改 props 会有警告。
// 但由于我们用了 useForm 在父级，父级的 feedbackForm 是 reactive的，
// 可以直接将 feedbackForm 作为 prop 传递，并在子组件中直接使用。
// 为简单起见，暂时让父组件传递 feedbackForm 整体。

const internalFeedbackForm = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:modelValue', value)
  },
})

// 将 feedbackFormRef 传递给父组件，以便父组件可以访问 el-form 实例
// 这个逻辑在父组件中实现，子组件仅作为UI载体

function handleGeneratePreview() {
  emit('generate-preview')
}

function handleResetForm() {
  emit('reset-form')
}
</script>

<template>
  <el-card shadow="never" style="height: 100%">
    <div v-if="currentStudent">
      <el-form
        :ref="formRef"
        :model="internalFeedbackForm"
        label-width="auto"
        label-position="top"
        @submit.prevent
      >
        <el-row :gutter="15">
          <el-col :xs="24" :sm="6" md="6">
            <el-form-item label="反馈日期" prop="feedbackDate">
              <el-date-picker
                v-model="internalFeedbackForm.feedbackDate"
                type="date"
                placeholder="选择日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="6" md="6">
            <el-form-item label="上课时间" prop="classTime">
              <el-select
                v-model="internalFeedbackForm.classTime"
                placeholder="选择时间 (可选)"
                style="width: 100%"
                clearable
                filterable
                allow-create
                default-first-option
              >
                <el-option
                  v-for="item in classTimeOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                >
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="6" md="6">
            <el-form-item label="学生">
              <el-input
                :value="currentStudent?.name || 'N/A'"
                readonly
                disabled
                style="width: 100%"
              />
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="6" md="6">
            <el-form-item label="授课老师">
              <el-input
                :value="currentUser?.username || 'N/A'"
                readonly
                disabled
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="15">
          <el-col :xs="24" :sm="6" md="5">
            <el-form-item label="授课科目">
              <el-input
                :value="currentCourse?.name || 'N/A'"
                readonly
                disabled
                style="width: 100%"
              />
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="6" md="5">
            <el-form-item label="上次举一反三布置时间" prop="lastExtrapolationAssignmentDate">
              <el-date-picker
                v-model="internalFeedbackForm.lastExtrapolationAssignmentDate"
                type="date"
                placeholder="选择日期 (若有)"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="width: 100%"
                clearable
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="15">
          <el-col :xs="24" :sm="6" md="6">
            <el-form-item label="完成情况" prop="lastHomeworkStatus">
              <el-input
                type="textarea"
                :rows="1"
                v-model="internalFeedbackForm.lastHomeworkStatus"
                placeholder="上次作业内容完成情况"
              />
            </el-form-item>
          </el-col>

          <el-col :xs="24" :sm="18" md="18">
            <el-form-item label="完成反馈" prop="lastHomeworkFeedback">
              <el-input
                type="textarea"
                :autosize="{ minRows: 1, maxRows: 2 }"
                v-model="internalFeedbackForm.lastHomeworkFeedback"
                placeholder="对学生上次作业的评价和反馈"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="15">
          <el-col :xs="24" :sm="12">
            <el-form-item label="本次授课内容" prop="teachingContent">
              <el-input
                type="textarea"
                :autosize="{ minRows: 3, maxRows: 5 }"
                v-model="internalFeedbackForm.teachingContent"
                placeholder="简要记录本次课的主要教学点"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12">
            <el-form-item label="本次课堂表现" prop="classPerformance">
              <el-input
                type="textarea"
                :autosize="{ minRows: 3, maxRows: 5 }"
                v-model="internalFeedbackForm.classPerformance"
                placeholder="学生在本次课堂上的具体表现"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="15">
          <el-col :xs="24" :sm="8">
            <el-form-item label="进步" prop="progressMade">
              <el-input
                type="textarea"
                :autosize="{ minRows: 3, maxRows: 5 }"
                v-model="internalFeedbackForm.progressMade"
                placeholder="本次观察到的学生进步点"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="8">
            <el-form-item label="欠缺" prop="areasForImprovement">
              <el-input
                type="textarea"
                :autosize="{ minRows: 3, maxRows: 5 }"
                v-model="internalFeedbackForm.areasForImprovement"
                placeholder="学生在哪些方面仍需加强"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="8">
            <el-form-item label="提升方案" prop="improvementPlan">
              <el-input
                type="textarea"
                :autosize="{ minRows: 3, maxRows: 5 }"
                v-model="internalFeedbackForm.improvementPlan"
                placeholder="建议"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="15">
          <el-col :xs="24" :sm="5">
            <el-form-item label="准时度" prop="punctuality">
              <el-input
                v-model="internalFeedbackForm.punctuality"
                placeholder="准时、迟到5分钟等"
              />
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="19">
            <el-form-item label="举一反三" prop="extrapolationAbility">
              <el-input
                type="textarea"
                :autosize="{ minRows: 1, maxRows: 2 }"
                v-model="internalFeedbackForm.extrapolationAbility"
                placeholder="描述学生触类旁通的能力"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item style="margin-top: 20px">
          <el-button type="primary" @click="handleGeneratePreview">生成反馈预览</el-button>
          <el-button @click="handleResetForm">重置表单</el-button>
        </el-form-item>
      </el-form>
    </div>
    <el-empty v-else description="请先在左侧选择一个学生以填写反馈。"></el-empty>
  </el-card>
</template>

<style scoped>
/* 可以将原 ClassFeedbackTabPage.vue 中与表单相关的特定样式移到这里 */
.el-form-item {
  margin-bottom: 18px; /* 与父组件保持一致 */
}
.el-card {
  border: 1px solid var(--el-border-color-lighter);
}
.el-card :deep(.el-card__body) {
  min-height: 100px;
}
</style>
