<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    // for v-model on feedbackPreviewText
    type: String,
    required: true,
  },
  isSubmitting: {
    type: Boolean,
    default: false,
  },
  submissionError: {
    type: String,
    default: null,
  },
  currentStudent: {
    // To disable editing if no student is selected
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue', 'copy-text', 'submit-feedback'])

const localFeedbackPreviewText = computed({
  get: () => props.modelValue,
  set: (value) => {
    emit('update:modelValue', value)
  },
})

function handleCopyText() {
  emit('copy-text')
}

function handleSubmitFeedback() {
  emit('submit-feedback')
}
</script>

<template>
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
      v-model="localFeedbackPreviewText"
      :disabled="!currentStudent"
    />

    <div style="margin-top: 15px; display: flex; justify-content: center; gap: 50px">
      <el-button type="primary" @click="handleCopyText"> 复制文本 </el-button>
      <el-button type="success" @click="handleSubmitFeedback" :loading="isSubmitting">
        提交此反馈
      </el-button>
    </div>

    <div v-if="submissionError" class="error-message" style="margin-top: 10px; text-align: center">
      提交失败: {{ submissionError }}
    </div>
  </el-card>
</template>

<style scoped>
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
.el-card {
  border: 1px solid var(--el-border-color-lighter);
}
.el-card :deep(.el-card__body) {
  min-height: 100px; /* 保持与表单卡片一致的最小高度感 */
}
/* 响应式调整预览区高度 */
@media (max-width: 768px) {
  .el-input :deep(textarea) {
    min-height: 200px !important;
  }
}
</style>
