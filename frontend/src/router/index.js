// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../store/authStore'
import axios from 'axios' // 确保 axios 被引入

// --- 页面组件 ---
const LoginPage = () => import('../pages/LoginPage.vue')
const RegisterPage = () => import('../pages/RegisterPage.vue')
const MainLayout = () => import('../layouts/MainLayout.vue') // 这个 MainLayout 将使用下拉选课
const StudentDashboardPage = () => import('../pages/StudentDashboardPage.vue')
const ClassFeedbackTabPage = () => import('../pages/student_tabs/ClassFeedbackTabPage.vue')
const StudentProfileTabPage = () => import('../pages/student_tabs/StudentProfileTabPage.vue')
const MonthlySummaryTabPage = () => import('../pages/student_tabs/MonthlySummaryTabPage.vue')
const WelcomePage = () => import('../pages/WelcomePage.vue')

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: LoginPage,
    meta: { requiresGuest: true },
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterPage,
    meta: { requiresGuest: true },
  },
  {
    path: '/',
    component: MainLayout,
    meta: { requiresAuth: true },
    redirect: { name: 'WelcomePage' },
    children: [
      {
        path: 'welcome',
        name: 'WelcomePage',
        component: WelcomePage,
      },
      {
        path: 'courses/:courseId/students/:studentId',
        name: 'StudentDashboard',
        component: StudentDashboardPage,
        props: true,
        redirect: (to) => {
          return {
            name: 'StudentClassFeedback',
            params: {
              courseId: to.params.courseId,
              studentId: to.params.studentId,
            },
          }
        },
        children: [
          {
            path: 'feedback',
            name: 'StudentClassFeedback',
            component: ClassFeedbackTabPage,
            props: true,
          },
          {
            path: 'profile',
            name: 'StudentProfileTab',
            component: StudentProfileTabPage,
            props: true,
          },
          {
            path: 'summary',
            name: 'StudentMonthlySummaryTab',
            component: MonthlySummaryTabPage,
            props: true,
          },
        ],
      },
    ],
  },
  // 404 Fallback - 确保它在最后
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    // 你可以创建一个简单的 NotFound.vue 页面
    // component: () => import('../pages/NotFoundPage.vue')
    // 或者重定向到欢迎页
    redirect: { name: 'WelcomePage' },
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  },
})

// --- 全局前置守卫 ---
let authStoreInstance = null // 移到外部以在回调中保持引用

router.beforeEach(async (to, from, next) => {
  const publicPages = ['/login', '/register']
  const authRequired = !publicPages.includes(to.path) && to.meta.requiresAuth // 确保 meta 检查
  const guestOnly = to.meta.requiresGuest

  // 尝试在 app 上下文准备好时获取 Pinia 实例
  if (!authStoreInstance && router.app && router.app.config.globalProperties.$pinia) {
    authStoreInstance = useAuthStore(router.app.config.globalProperties.$pinia)
  } else if (!authStoreInstance) {
    // 如果 $pinia 还未就绪，直接调用 useAuthStore()，它应该能回退到getActivePinia()
    authStoreInstance = useAuthStore()
  }

  // 日志记录导航尝试
  console.log(
    `[Router Navigating] From: ${from.fullPath}, To: ${to.fullPath}, To Name: ${to.name}, Matched: ${to.matched.length}`,
  )
  if (to.redirectedFrom) {
    console.log(`[Router Navigating] Redirected from: ${to.redirectedFrom.fullPath}`)
  }

  const token = localStorage.getItem('token')
  let isAuthenticated = false // 默认未认证

  if (authStoreInstance) {
    // 只有当 authStoreInstance 成功获取后才使用它
    isAuthenticated = authStoreInstance.isAuthenticated // 从 store 获取认证状态
    // 确保 axios header 与 store 状态同步 (尤其是在刷新后)
    if (token && isAuthenticated) {
      if (axios.defaults.headers.common['Authorization'] !== `Bearer ${token}`) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      }
    } else if (!token && axios.defaults.headers.common['Authorization']) {
      delete axios.defaults.headers.common['Authorization']
    }
  } else {
    // 如果 store 实例获取失败，可以基于 token 做一个基础判断，但这不是理想情况
    // console.warn('[Router Guard] authStoreInstance not available. Relying on localStorage token for basic auth check.');
    // if (token) isAuthenticated = true; // 这是一个简化的回退，不推荐
  }

  if (authRequired && !isAuthenticated) {
    console.log('[Router Guard] Auth required, but not authenticated. Redirecting to Login.')
    return next({ name: 'Login', query: { redirect: to.fullPath } })
  }

  if (guestOnly && isAuthenticated) {
    console.log('[Router Guard] Guest route, but authenticated. Redirecting to WelcomePage.')
    return next({ name: 'WelcomePage' })
  }

  // 检查路由是否存在 (确保不是根路径，因为根路径有 redirect)
  if (to.matched.length === 0 && to.path !== '/') {
    console.warn(`[Router Guard] No route match for "${to.fullPath}". Redirecting to WelcomePage.`)
    return next({ name: 'WelcomePage' })
  }

  next()
})

export default router
