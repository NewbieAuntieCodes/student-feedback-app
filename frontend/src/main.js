import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'

// 1. 引入 Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css' // Element Plus 的 CSS
// 如果需要中文语言包
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'

// 如果需要 Element Plus 的全局/基础样式 (通常 unplugin-vue-components 会处理组件样式)
import 'element-plus/theme-chalk/src/index.scss' // 或者 .css 如果你不使用 SCSS
// 或者更细致地只引入基础样式
import 'element-plus/theme-chalk/base.css'

import { createPinia } from 'pinia'
import router from './router'
import axios from 'axios' // 确保引入 axios

const app = createApp(App)

// 检查 localStorage 中是否有 token，并设置 axios 默认请求头
const token = localStorage.getItem('token')
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

app.use(ElementPlus, { locale: zhCn })
app.use(createPinia())
app.use(router)

app.mount('#app')
