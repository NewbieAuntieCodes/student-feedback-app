<template>
  <el-container style="height: 100vh; background-color: #f0f2f5">
    <AppSidebar
      v-if="storesInitialized"
      @course-selected-sidebar="handleCourseSelected"
      @open-create-course-dialog="openCreateCourseModal"
      @open-add-student-dialog="openAddStudentModal"
    />
    <div v-else-if="!initializationError" class="loading-stores">Initializing core services...</div>
    <div v-else class="loading-stores error-stores">
      Core services failed to initialize. Please refresh. <br />
      Auth: {{ authStoreStatus }} | Course: {{ courseStoreStatus }} | Student:
      {{ studentStoreStatus }}
    </div>

    <AppMainContent v-if="storesInitialized" />
    <AppInfoPanel
      v-if="storesInitialized && showRightInfoPanel"
      @edit-course="handleEditCourse"
      @delete-course="handleDeleteCourse"
    />

    <template v-if="shouldRenderCreateCourseModal">
      <CreateCourseModal
        :key="'create-course-modal'"
        :visible="
          courseModal && courseModal.isModalVisible ? courseModal.isModalVisible.value : false
        "
        :courseToEdit="courseToEdit && courseToEdit.value ? courseToEdit.value : null"
        @update:visible="
          (val) => {
            if (courseModal && courseModal.isModalVisible) courseModal.isModalVisible.value = val
          }
        "
        @course-created="handleCourseCreated"
        @course-updated="handleCourseUpdated"
        @closed="handleCourseModalClosed"
      />
    </template>

    <template v-if="shouldRenderAddStudentModal">
      <AddStudentModal
        :key="'add-student-modal'"
        :visible="
          addStudentModal && addStudentModal.isModalVisible
            ? addStudentModal.isModalVisible.value
            : false
        "
        :targetCourse="
          addStudentModalTargetCourse && addStudentModalTargetCourse.value
            ? addStudentModalTargetCourse.value
            : null
        "
        @update:visible="
          (val) => {
            if (addStudentModal && addStudentModal.isModalVisible)
              addStudentModal.isModalVisible.value = val
          }
        "
        @student-added="handleStudentAdded"
        @closed="handleAddStudentModalClosed"
      />
    </template>
  </el-container>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue' // 保持你原来的导入
import { useRouter, useRoute } from 'vue-router' // 保持你原来的导入
import { ElContainer, ElMessage, ElMessageBox } from 'element-plus' // 保持你原来的导入

// 导入布局子组件 (保持你原来的导入)
import AppSidebar from './AppSidebar.vue'
import AppMainContent from './AppMainContent.vue'
import AppInfoPanel from './AppInfoPanel.vue'

// 导入模态框组件 (保持你原来的导入)
import CreateCourseModal from '@/components/course/CreateCourseModal.vue'
import AddStudentModal from '@/components/student/AddStudentModal.vue'

// Pinia Stores (保持你原来的导入)
import { useAuthStore } from '@/store/authStore'
import { useCourseStore } from '@/store/courseStore'
import { useStudentStore } from '@/store/studentStore'

// Composables (保持你原来的导入)
import { useModal } from '@/composables/useModal.js'

console.log('[AppLayout] Setup script started.')

// 初始化状态的 Ref (保持你原来的)
const routerInitializedStatus = ref('Pending')
const routeInitializedStatus = ref('Pending')
const authStoreStatus = ref('Pending')
const courseStoreStatus = ref('Pending')
const studentStoreStatus = ref('Pending')
const storesInitialized = ref(false)
const modalHelpersInitialized = ref(false)
const initializationError = ref(false)

// 实例变量 (保持你原来的)
let router = null
let route = null
let authStore = null
let courseStore = null
let studentStore = null
let courseModal = null // 保持为 null
let addStudentModal = null // 保持为 null

// 业务相关的 Ref (保持你原来的)
const courseToEdit = ref(null)
const addStudentModalTargetCourse = ref(null)

// --- 1. 初始化 Router 和 Route --- (保持你原来的代码)
try {
  router = useRouter()
  routerInitializedStatus.value = 'Success'
  console.log('[AppLayout] useRouter() successful.')
} catch (e) {
  routerInitializedStatus.value = `Error: ${e.message}`
  console.error('[AppLayout] Error during useRouter():', e)
  initializationError.value = true
}

try {
  route = useRoute()
  routeInitializedStatus.value = 'Success'
  console.log('[AppLayout] useRoute() successful.')
} catch (e) {
  routeInitializedStatus.value = `Error: ${e.message}`
  console.error('[AppLayout] Error during useRoute():', e)
  initializationError.value = true
}

// --- 2. 初始化 Pinia Stores --- (保持你原来的代码)
try {
  authStore = useAuthStore()
  authStoreStatus.value = authStore
    ? `OK (ID: ${authStore.$id})`
    : 'Failed (useAuthStore returned null)'
  console.log(
    '[AppLayout] useAuthStore() result:',
    authStore ? 'Instance OK' : 'Instance Failed/Null',
  )
  if (!authStore) initializationError.value = true
} catch (e) {
  authStoreStatus.value = `Error: ${e.message}`
  console.error('[AppLayout] Critical Error during useAuthStore():', e)
  initializationError.value = true
}

if (!initializationError.value) {
  try {
    courseStore = useCourseStore()
    courseStoreStatus.value = courseStore
      ? `OK (ID: ${courseStore.$id})`
      : 'Failed (useCourseStore returned null)'
    console.log(
      '[AppLayout] useCourseStore() result:',
      courseStore ? 'Instance OK' : 'Instance Failed/Null',
    )
    if (!courseStore) initializationError.value = true
  } catch (e) {
    courseStoreStatus.value = `Error: ${e.message}`
    console.error('[AppLayout] Critical Error during useCourseStore():', e)
    initializationError.value = true
  }
}

if (!initializationError.value) {
  try {
    studentStore = useStudentStore()
    studentStoreStatus.value = studentStore
      ? `OK (ID: ${studentStore.$id})`
      : 'Failed (useStudentStore returned null)'
    console.log(
      '[AppLayout] useStudentStore() result:',
      studentStore ? 'Instance OK' : 'Instance Failed/Null',
    )
    if (!studentStore) initializationError.value = true
  } catch (e) {
    studentStoreStatus.value = `Error: ${e.message}`
    console.error('[AppLayout] Critical Error during useStudentStore():', e)
    initializationError.value = true
  }
}

if (!initializationError.value && authStore && courseStore && studentStore) {
  storesInitialized.value = true
  console.log('[AppLayout] All Pinia stores initialized successfully.')
} else {
  console.error(
    '[AppLayout] One or more Pinia stores failed to initialize. Halting further setup that depends on stores.',
  )
}

// --- 3. 初始化 Modal Helpers (仅当 store 初始化成功) ---
if (storesInitialized.value) {
  try {
    courseModal = useModal()
    // ***** 新增日志 START *****
    console.log('[AppLayout DEBUG] courseModal after useModal():', courseModal)
    if (courseModal) {
      console.log(
        '[AppLayout DEBUG] courseModal.isModalVisible after useModal():',
        courseModal.isModalVisible,
      )
    } else {
      console.log('[AppLayout DEBUG] courseModal is NULL after useModal()')
    }
    // ***** 新增日志 END *****

    addStudentModal = useModal()
    // ***** 新增日志 START *****
    console.log('[AppLayout DEBUG] addStudentModal after useModal():', addStudentModal)
    if (addStudentModal) {
      console.log(
        '[AppLayout DEBUG] addStudentModal.isModalVisible after useModal():',
        addStudentModal.isModalVisible,
      )
    } else {
      console.log('[AppLayout DEBUG] addStudentModal is NULL after useModal()')
    }
    // ***** 新增日志 END *****
    modalHelpersInitialized.value = true
    console.log('[AppLayout] Modal helpers (useModal) initialized successfully.')
  } catch (e) {
    console.error('[AppLayout] Error initializing modal helpers:', e)
    initializationError.value = true
  }
}

// --- 计算属性 (仅当 store 初始化成功) --- (保持你原来的)
const showRightInfoPanel = computed(() => {
  if (!storesInitialized.value || !courseStore) return false
  return !!courseStore.currentCourse
})

// ***** 新增计算属性 START *****
const shouldRenderCreateCourseModal = computed(() => {
  const result =
    storesInitialized.value &&
    modalHelpersInitialized.value &&
    courseModal && // 确保 courseModal 存在
    typeof courseModal.isModalVisible !== 'undefined' && // 确保 isModalVisible 属性存在
    courseModal.isModalVisible !== null // 确保 isModalVisible 不是 null

  // 你可以取消下面这行注释来在控制台观察这个计算属性的值
  // console.log('[AppLayout DEBUG] shouldRenderCreateCourseModal:', result, {
  //   storesInitialized: storesInitialized.value,
  //   modalHelpersInitialized: modalHelpersInitialized.value,
  //   courseModalExists: !!courseModal,
  //   isModalVisibleExists: courseModal ? typeof courseModal.isModalVisible !== 'undefined' : false,
  //   isModalVisibleNotNull: courseModal && courseModal.isModalVisible !== null,
  //   courseModalObject: courseModal ? JSON.parse(JSON.stringify(courseModal)) : null // 小心使用，可能因函数等导致报错
  // });
  return result
})

const shouldRenderAddStudentModal = computed(() => {
  const result =
    storesInitialized.value &&
    modalHelpersInitialized.value &&
    addStudentModal && // 确保 addStudentModal 存在
    typeof addStudentModal.isModalVisible !== 'undefined' && // 确保 isModalVisible 属性存在
    addStudentModal.isModalVisible !== null && // 确保 isModalVisible 不是 null
    addStudentModalTargetCourse.value // 确保 targetCourse 也存在 (根据你原来的 v-if)

  // 你可以取消下面这行注释来在控制台观察这个计算属性的值
  // console.log('[AppLayout DEBUG] shouldRenderAddStudentModal:', result);
  return result
})
// ***** 新增计算属性 END *****

// --- 事件处理器 (保持你原来的所有事件处理器代码) ---
// 例如: const handleCourseSelected = async (courseId) => { ... }
// (这里省略了所有事件处理器，请确保你保留了它们)
const handleCourseSelected = async (courseId) => {
  if (!storesInitialized.value || !courseStore || !router || !route) {
    console.warn('[AppLayout] handleCourseSelected: Skipped due to uninitialized dependencies.')
    return
  }
  console.log('[AppLayout] handleCourseSelected triggered with courseId:', courseId)
  await courseStore.selectCourse(courseId)

  const currentRouteName = route.name
  const currentCourseIdInRoute = route.params.courseId
  if (courseId) {
    if (
      (currentRouteName !== 'WelcomePage' && currentCourseIdInRoute !== courseId) ||
      (currentRouteName === 'StudentDashboard' && currentCourseIdInRoute !== courseId)
    ) {
      router.push({ name: 'WelcomePage' })
    }
  } else {
    if (
      currentRouteName !== 'WelcomePage' &&
      currentRouteName !== 'Login' &&
      currentRouteName !== 'Register'
    ) {
      router.push({ name: 'WelcomePage' })
    }
  }
}

const openCreateCourseModal = () => {
  // ***** 修改这里的判断条件 START *****
  if (!modalHelpersInitialized.value || !courseModal || !courseModal.isModalVisible) {
    console.warn(
      '[AppLayout] openCreateCourseModal: Skipped, modal helper or courseModal not fully initialized.',
    )
    return
  }
  // ***** 修改这里的判断条件 END *****
  courseToEdit.value = null
  courseModal.openModal('创建新课程')
}

const handleEditCourse = (course) => {
  // ***** 修改这里的判断条件 START *****
  if (!modalHelpersInitialized.value || !courseModal || !courseModal.isModalVisible) {
    console.warn(
      '[AppLayout] handleEditCourse: Skipped, modal helper or courseModal not fully initialized.',
    )
    return
  }
  // ***** 修改这里的判断条件 END *****
  if (course) {
    courseToEdit.value = { ...course }
    courseModal.openModal('编辑课程')
  }
}

const handleDeleteCourse = async (course) => {
  if (!storesInitialized.value || !courseStore || !router || !route) return
  if (!course) return
  try {
    await ElMessageBox.confirm(
      `确定要删除课程 "${course.name}" 吗？此操作将同时删除该课程下的所有学生和反馈记录，且不可恢复。`,
      '警告',
      { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning' },
    )
    const success = await courseStore.deleteCourse(course._id)
    if (success) {
      ElMessage.success('课程删除成功！')
      if (route.params.courseId === course._id && route.name !== 'WelcomePage') {
        router.push({ name: 'WelcomePage' })
      }
    } else {
      ElMessage.error(courseStore.deleteCourseError || '删除课程失败')
    }
  } catch (e) {
    if (e !== 'cancel' && e !== 'close') console.error('删除课程确认时出错:', e)
  }
}

const handleCourseCreated = (createdCourse) => {
  if (createdCourse && createdCourse._id) {
    handleCourseSelected(createdCourse._id)
  }
}

const handleCourseUpdated = () => {
  courseToEdit.value = null
}

const handleCourseModalClosed = () => {
  // ***** 修改这里的判断条件 START *****
  if (modalHelpersInitialized.value && courseModal && courseModal.isModalVisible) {
    courseModal.closeModal()
  } else {
    console.warn(
      '[AppLayout] handleCourseModalClosed: Skipped, modal helper or courseModal not fully initialized.',
    )
  }
  // ***** 修改这里的判断条件 END *****
  courseToEdit.value = null
}

const openAddStudentModal = () => {
  // ***** 修改这里的判断条件 START *****
  if (
    !storesInitialized.value ||
    !courseStore ||
    !modalHelpersInitialized.value ||
    !addStudentModal || // 确保 addStudentModal 存在
    !addStudentModal.isModalVisible // 确保 isModalVisible 存在
  ) {
    console.warn('[AppLayout] openAddStudentModal: Skipped due to uninitialized dependencies.')
    return
  }
  // ***** 修改这里的判断条件 END *****
  if (!courseStore.currentCourse) {
    ElMessage.warning('请先选择一个课程以添加学生')
    return
  }
  addStudentModalTargetCourse.value = courseStore.currentCourse
  addStudentModal.openModal('为课程添加新学生')
}

const handleStudentAdded = () => {}

const handleAddStudentModalClosed = () => {
  // ***** 修改这里的判断条件 START *****
  if (modalHelpersInitialized.value && addStudentModal && addStudentModal.isModalVisible) {
    addStudentModal.closeModal()
  } else {
    console.warn(
      '[AppLayout] handleAddStudentModalClosed: Skipped, modal helper or addStudentModal not fully initialized.',
    )
  }
  // ***** 修改这里的判断条件 END *****
  addStudentModalTargetCourse.value = null
}

// --- 生命周期钩子和侦听器 (保持你原来的代码) ---
// 例如: onMounted(async () => { ... }) 和 watch(...)
// (这里省略了，请确保你保留了它们)
onMounted(async () => {
  console.log('[AppLayout] Component Mounted.')
  if (
    !storesInitialized.value ||
    !modalHelpersInitialized.value || // 确保 modalHelpers 也已初始化
    !router ||
    !route ||
    !authStore ||
    !courseStore
  ) {
    console.error(
      '[AppLayout] onMounted: Critical dependencies not initialized. Aborting further onMounted logic.',
    )
    if (!initializationError.value) {
      initializationError.value = true
    }
    return
  }
  console.log('[AppLayout] onMounted: All dependencies ready. Initializing state from route...')

  if (authStore.isAuthenticated) {
    console.log(
      '[AppLayout] onMounted: User is authenticated. Attempting to sync course with route params:',
      route.params,
    )
    try {
      const { courseFound } = await courseStore.syncCourseWithRoute(
        route.params.courseId,
        route.params.studentId,
      )
      console.log('[AppLayout] onMounted: syncCourseWithRoute result - courseFound:', courseFound)

      if (
        !route.params.courseId &&
        route.name !== 'WelcomePage' &&
        route.name !== 'Login' &&
        route.name !== 'Register'
      ) {
        router.push({ name: 'WelcomePage' })
      } else if (
        route.params.courseId &&
        !courseFound &&
        route.name !== 'WelcomePage' &&
        route.name !== 'Login' &&
        route.name !== 'Register'
      ) {
        ElMessage.error('链接中的课程未找到或已失效。')
        router.push({ name: 'WelcomePage' })
      }
    } catch (error) {
      console.error('[AppLayout] onMounted: Error during syncCourseWithRoute or navigation:', error)
      ElMessage.error('初始化页面状态时发生错误。')
    }
  } else {
    console.log('[AppLayout] onMounted: User not authenticated. Routing will be handled by guard.')
  }
})

watch(
  () => (route ? route.fullPath : null),
  async (newFullPath, oldFullPath) => {
    if (
      !route ||
      !newFullPath ||
      newFullPath === oldFullPath ||
      !storesInitialized.value ||
      !modalHelpersInitialized.value || // 确保 modalHelpers 也已初始化
      !courseStore ||
      !router ||
      !authStore
    ) {
      if (newFullPath && newFullPath !== oldFullPath) {
        console.log(
          '[AppLayout] Route watch: Skipped due to uninitialized dependencies or no actual relevant path change.',
        )
      }
      return
    }
    console.log(
      '[AppLayout] Route watch triggered. New path:',
      newFullPath,
      'Old path:',
      oldFullPath,
    )

    try {
      if (authStore.isAuthenticated) {
        const { courseFound } = await courseStore.syncCourseWithRoute(
          route.params.courseId,
          route.params.studentId,
        )
        console.log(
          '[AppLayout] Route watch: syncCourseWithRoute result - courseFound:',
          courseFound,
        )

        if (
          route.params.courseId &&
          !courseFound &&
          route.name !== 'WelcomePage' &&
          route.name !== 'Login' &&
          route.name !== 'Register'
        ) {
          ElMessage.error('链接中的课程未找到或已失效。')
          router.push({ name: 'WelcomePage' })
        }
      } else {
        console.log('[AppLayout] Route watch: User not authenticated. Deferring state sync.')
      }
    } catch (error) {
      console.error(
        '[AppLayout] Route watch: Error during syncCourseWithRoute or navigation:',
        error,
      )
      ElMessage.error('更新页面状态时发生错误。')
    }
  },
)
// --- 你原来的代码到这里结束 ---

console.log('[AppLayout] Setup script finished.')
</script>

<style scoped>
.loading-stores {
  width: 100%;
  padding: 30px;
  text-align: center;
  font-size: 16px;
  color: #606266;
}
.error-stores {
  color: #f56c6c;
  white-space: pre-wrap; /* 允许错误信息换行 */
}
</style>
