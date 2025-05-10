<template>
  <el-container direction="vertical" class="main-content-container">
    <AppHeader />
    <el-main
      style="
        padding: 0;
        overflow-y: hidden; /* 通常由内部 router-view 的内容来滚动 */
        display: flex;
        flex-direction: column;
        background-color: #f0f2f5;
        flex-grow: 1; /* 确保 el-main 填满剩余空间 */
      "
    >
      <router-view v-slot="{ Component, route }">
        <transition name="fade-main" mode="out-in">
          <component :is="Component" :key="route.fullPath" />
        </transition>
      </router-view>
    </el-main>
  </el-container>
</template>

<script setup>
import { ElContainer, ElMain } from 'element-plus'
import AppHeader from '@/components/common/AppHeader.vue'
</script>

<style scoped>
.main-content-container {
  flex: 1;
  min-width: 0; /* 防止内容过多时挤压布局 */
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 主容器 overflow hidden */
}

.el-main {
  flex-grow: 1; /* 确保 el-main 填满垂直方向的剩余空间 */
  overflow-y: auto; /* 让 router-view 内部可以滚动 */
  /* padding: 20px; /* 根据需要添加内边距，或者在页面组件内部处理 */
}

.fade-main-enter-active,
.fade-main-leave-active {
  transition: opacity 0.2s ease-in-out;
}
.fade-main-enter-from,
.fade-main-leave-to {
  opacity: 0;
}
</style>
