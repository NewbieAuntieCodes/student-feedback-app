// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../store/authStore'
// apiClient 将通过 authStore 间接影响 axios 的默认头

const LoginPage = () => import('../pages/LoginPage.vue')
const RegisterPage = () => import('../pages/RegisterPage.vue')
const AppLayout = () => import('../layouts/AppLayout.vue')
const StudentDashboardPage = () => import('../pages/StudentDashboardPage.vue')
const ClassFeedbackTabPage = () => import('../pages/student_tabs/ClassFeedbackTabPage.vue')
const StudentProfileTabPage = () => import('../pages/student_tabs/StudentProfileTabPage.vue')
const MonthlySummaryTabPage = () => import('../pages/student_tabs/MonthlySummaryTabPage.vue')
const WelcomePage = () => import('../pages/WelcomePage.vue')

const routes = [
  { path: '/login', name: 'Login', component: LoginPage, meta: { requiresGuest: true } },
  { path: '/register', name: 'Register', component: RegisterPage, meta: { requiresGuest: true } },
  {
    path: '/',
    component: AppLayout,
    meta: { requiresAuth: true },
    redirect: { name: 'WelcomePage' },
    children: [
      { path: 'welcome', name: 'WelcomePage', component: WelcomePage },
      {
        path: 'courses/:courseId/students/:studentId',
        name: 'StudentDashboard',
        component: StudentDashboardPage,
        props: true,
        redirect: (to) => ({
          name: 'StudentClassFeedback', // 默认重定向到反馈标签页
          params: { courseId: to.params.courseId, studentId: to.params.studentId },
        }),
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
  { path: '/:pathMatch(.*)*', name: 'NotFound', redirect: { name: 'WelcomePage' } },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0 }
  },
})

let piniaInstance = null // 用于确保 pinia 实例只初始化一次

router.beforeEach(async (to, from, next) => {
  if (!piniaInstance && router.app && router.app.config.globalProperties.$pinia) {
    piniaInstance = router.app.config.globalProperties.$pinia
  }

  const authStore = useAuthStore(piniaInstance) // 传递 pinia 实例

  // 1. 确保 apiClient 的 token 是最新的 (如果 token 存在)
  // 这个操作也可以放在 authStore 自身的 action/watcher 中，当 token 变化时自动更新 apiClient
  authStore.setTokenInApiClient() // 确保每次导航前都检查并设置

  // 2. 如果 token 存在但 store 中没有 user 信息 (例如页面刷新后)，尝试获取用户信息
  if (authStore.token && !authStore.user && to.meta.requiresAuth) {
    await authStore.fetchUserOnLoad() // 等待用户信息加载
  }

  const isAuthenticated = authStore.isAuthenticated

  if (to.meta.requiresAuth && !isAuthenticated) {
    console.log('[Router Guard] Auth required, but not authenticated. Redirecting to Login.')
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else if (to.meta.requiresGuest && isAuthenticated) {
    console.log('[Router Guard] Guest route, but authenticated. Redirecting to WelcomePage.')
    next({ name: 'WelcomePage' })
  } else {
    // 检查目标路由是否存在 (确保不是根路径，因为根路径有 redirect)
    if (to.matched.length === 0 && to.path !== '/') {
      console.warn(
        `[Router Guard] No route match for "${to.fullPath}". Redirecting to WelcomePage.`,
      )
      return next({ name: 'WelcomePage' })
    }
    next()
  }
})

export default router
