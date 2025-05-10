<template>
  <div class="login-page-container">
    <LoginForm />
  </div>
</template>

<script setup>
import LoginForm from '@/components/auth/LoginForm.vue'
// 可以在这里处理页面级别的其他逻辑，如果需要的话
// 例如，页面加载时清除 authStore 中的旧错误信息
import { onMounted } from 'vue'
import { useAuthStore } from '@/store/authStore'

const authStore = useAuthStore()
onMounted(() => {
  authStore.clearAuthMessages()
})
</script>

<style scoped>
.login-page-container {
  display: flex;
  justify-content: center;
  align-items: flex-start; /* 或者 center，取决于你想要的效果 */
  min-height: 80vh; /* 给一些垂直空间 */
  padding-top: 5vh; /* 顶部留白 */
}
</style>
