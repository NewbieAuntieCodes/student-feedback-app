<template>
  <div v-if="loading" class="app-loading-indicator">
    <el-icon class="is-loading" :size="size"><Loading /></el-icon>
    <p v-if="text">{{ text }}</p>
  </div>
</template>

<script setup>
import { ElIcon } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'

defineProps({
  loading: {
    type: Boolean,
    default: true,
  },
  text: {
    type: String,
    default: '加载中...',
  },
  size: {
    type: [String, Number],
    default: 30,
  },
})
</script>

<style scoped>
.app-loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: #606266;
}
.app-loading-indicator p {
  margin-top: 8px;
  font-size: 14px;
}
</style>
