// src/main.js
import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'

import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import 'element-plus/theme-chalk/base.css' // 只引入基础样式

import { createPinia } from 'pinia'
import router from './router'
// import apiClient from './services/apiClient'; // apiClient 会在 store 或 router 中被使用

const app = createApp(App)

app.use(ElementPlus, { locale: zhCn })
app.use(createPinia()) // Pinia 必须在 router 之前或同时被 app.use

// 确保 Pinia 实例在 router guard 中可用
// 路由守卫中会尝试从 localStorage 获取 token 并初始化 authStore
// authStore 的 action (如 fetchUserOnLoad 或 setTokenInApiClient) 应该在应用初始化时被调用

app.use(router)

// 确保 router 准备好后再挂载
router.isReady().then(() => {
  app.mount('#app')
})
