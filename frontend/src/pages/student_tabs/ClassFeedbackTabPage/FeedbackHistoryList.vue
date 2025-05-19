<script setup>
import { ref, computed } from 'vue'
import dayjs from 'dayjs'

const props = defineProps({
  feedbackHistory: {
    type: Array,
    required: true,
  },
  isLoadingHistory: {
    type: Boolean,
    default: false,
  },
  currentStudent: {
    // For empty state message
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['load-feedback', 'delete-feedback'])

function handleLoadFeedback(feedbackItem) {
  emit('load-feedback', feedbackItem)
}

function handleDeleteFeedback(feedbackId) {
  emit('delete-feedback', feedbackId)
}
</script>

<template>
  <div>
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
              <p v-if="item.improvementPlan">
                <strong>提升方案:</strong> {{ item.improvementPlan }}
              </p>
            </div>
            <el-button
              type="primary"
              link
              size="small"
              @click="handleLoadFeedback(item)"
              style="margin-top: 10px"
              icon="el-icon-edit"
            >
              加载此记录到表单
            </el-button>

            <el-button
              type="danger"
              link
              size="small"
              @click="handleDeleteFeedback(item._id)"
              style="margin-top: 10px; margin-left: 10px"
              icon="el-icon-delete"
            >
              删除此记录
            </el-button>
          </el-card>
        </el-timeline-item>
      </el-timeline>
    </div>
  </div>
</template>

<style scoped>
.loading-history,
.no-history {
  text-align: center;
  color: #909399;
  padding: 20px 0;
}
.el-timeline {
  margin-top: 20px;
  padding-left: 5px;
}
.feedback-content-display {
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 14px;
  line-height: 1.6;
  color: #606266;
}
.el-card {
  border: 1px solid var(--el-border-color-lighter);
}
</style>
