<template>
  <el-header
    class="app-header"
    style="
      text-align: right;
      font-size: 12px;
      border-bottom: 1px solid #eee;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background-color: #fff;
      color: #303133;
      line-height: 60px;
      height: 60px;
      padding: 0 20px;
      box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
    "
  >
    <span>欢迎您，{{ username }}！</span>
    <el-button type="danger" plain @click="handleLogout" :icon="SwitchButton">退出登录</el-button>
  </el-header>
</template>

<script setup>
import { computed } from 'vue'
import { ElHeader, ElButton } from 'element-plus'
import { SwitchButton } from '@element-plus/icons-vue'
import { useAuthStore } from '@/store/authStore'

const authStore = useAuthStore()

const username = computed(() => authStore.currentUser?.username || '用户')

const handleLogout = () => {
  authStore.logout()
}
</script>

<style scoped>
.app-header {
  /* Styles specific to the header if any, otherwise rely on inline styles or global ones */
}
</style>
