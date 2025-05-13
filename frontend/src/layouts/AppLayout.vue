// src/layouts/AppLayout.vue
<script setup>
import { ref, computed, watch, watchEffect } from 'vue'
import { useRouter, useRoute } from 'vue-router'

import AppSidebar from './AppSidebar.vue'
import AppMainContent from './AppMainContent.vue'
import AppInfoPanel from './AppInfoPanel.vue'
import CreateCourseModal from '@/components/course/CreateCourseModal.vue'
import AddStudentModal from '@/components/student/AddStudentModal.vue'

import { useAppInitialization } from '@/composables/useAppInitialization.js'
import { useCourseModalManager } from '@/composables/useCourseModalManager.js'
import { useStudentModalManager } from '@/composables/useStudentModalManager.js'
import { useCourseInteractions } from '@/composables/useCourseInteractions.js'
import { useRouteCourseSync } from '@/composables/useRouteCourseSync.js'

import { ElMessage, ElMessageBox } from 'element-plus'

console.log('[AppLayout] Setup script started.')

const router = useRouter()
const route = useRoute()

const {
  authStore,
  courseStore,
  studentStore,
  authStoreStatus,
  courseStoreStatus,
  studentStoreStatus,
  storesInitialized,
  initializationError,
} = useAppInitialization()

// --- Course Modal Management --- (保持不变)
const {
  courseModalVisibility,
  courseModalTitle,
  courseToEdit,
  openCreateCourseModal,
  openEditCourseModal,
  onModalActuallyClosed: onCourseModalActuallyClosed,
} = useCourseModalManager()

const courseModalVisibilityValue = computed(() => {
  return courseModalVisibility && courseModalVisibility.__v_isRef
    ? courseModalVisibility.value
    : false
})
const courseToEditValue = computed(() => {
  return courseToEdit && courseToEdit.__v_isRef ? courseToEdit.value : null
})

// Handler for @update:visible from CreateCourseModal
const handleCreateCourseModalVisibilityUpdate = (newValue) => {
  if (courseModalVisibility && courseModalVisibility.__v_isRef) {
    courseModalVisibility.value = newValue
  }
  if (!newValue) {
    // onCourseModalActuallyClosed() is already called by @closed,
    // but if @closed is not guaranteed or if there's logic specific to visibility change:
    // onCourseModalActuallyClosed(); // Consider if this is redundant with @closed
  }
}

// --- Student Modal Management ---
const {
  studentModalVisibility, // This is the ref object
  studentModalTitle,
  addStudentModalTargetCourse, // This is a ref object
  openAddStudentModal,
  handleStudentAdded,
  // Ensure useStudentModalManager exports 'onModalActuallyClosed'
  // or use 'handleModalCloseLogic' and rename it here or use it directly.
  // For consistency, let's assume it exports onModalActuallyClosed.
  onModalActuallyClosed: onStudentModalActuallyClosed, // Assuming 'useStudentModalManager' exports this
  // If it exports 'handleModalCloseLogic', then:
  // handleModalCloseLogic: onStudentModalActuallyClosed
} = useStudentModalManager(courseStore)

// Computed property to safely access .value for the template
const studentModalVisibilityValue = computed(() => {
  return studentModalVisibility && studentModalVisibility.__v_isRef
    ? studentModalVisibility.value
    : false
})
const addStudentModalTargetCourseValue = computed(() => {
  return addStudentModalTargetCourse && addStudentModalTargetCourse.__v_isRef
    ? addStudentModalTargetCourse.value
    : null
})

// Handler for @update:visible from AddStudentModal
const handleAddStudentModalVisibilityUpdate = (newValue) => {
  if (studentModalVisibility && studentModalVisibility.__v_isRef) {
    studentModalVisibility.value = newValue
  }
  if (!newValue) {
    // onStudentModalActuallyClosed(); // Redundant if @closed handles it
  }
}

// 课程交互
const { handleCourseSelected, handleDeleteCourse, handleCourseCreated, handleCourseUpdated } =
  useCourseInteractions(courseStore, authStore)

// 路由与课程状态同步 - 修改这里的调用方式
// 使用 watchEffect 来确保在 stores 初始化和数据开始加载后才运行 RouteSync
watchEffect(() => {
  if (storesInitialized.value && !initializationError.value) {
    console.log('[AppLayout via watchEffect] Core stores seem initialized. Initializing RouteSync.')
    // 传递 studentStore 给 useRouteCourseSync (如果它需要的话)
    useRouteCourseSync(storesInitialized, ref(true), authStore, courseStore, studentStore)
  } else if (initializationError.value) {
    console.warn(
      `[AppLayout via watchEffect] RouteSync NOT initialized due to store initialization error: ${initializationError.value}`,
    )
  } else {
    console.log(
      '[AppLayout via watchEffect] Waiting for stores to be initialized before starting RouteSync...',
    )
  }
})

// UI 状态 (保持不变，但可以增加对 initializationError 的检查)
const showRightInfoPanel = computed(() => {
  if (!storesInitialized.value || initializationError.value || !courseStore) return false // 增加错误检查
  const currentCourse = courseStore.currentCourse
  if (currentCourse && currentCourse.__v_isRef) {
    return !!currentCourse.value
  }
  return !!currentCourse
})

// --- Watchers for Debugging (keep them) ---
watch(
  courseModalVisibility,
  (newValRef) => {
    // newValRef is the ref object itself if not deeply watching .value
    // To watch the value: watch(() => courseModalVisibility.value, (newValue, oldValue) => {...})
    console.log('[AppLayout WATCHER] courseModalVisibility (ref object) changed:', newValRef)
    if (newValRef && typeof newValRef.value !== 'undefined') {
      console.log('  courseModalVisibility.value:', newValRef.value)
    }
  },
  { immediate: true, deep: true }, // deep:true on a ref object will watch its .value
)

watch(
  () => courseModalVisibility.value, // Explicitly watch the .value property
  (newValue, oldValue) => {
    console.log(
      `[AppLayout WATCHER] courseModalVisibility.value changed from ${oldValue} to ${newValue}`,
    )
  },
  { immediate: true },
)

watch(
  () => studentModalVisibility.value,
  (newValue, oldValue) => {
    console.log(
      `[AppLayout WATCHER] studentModalVisibility.value changed from ${oldValue} to ${newValue}`,
    )
  },
  { immediate: true },
)

console.log('[AppLayout] Setup script finished.')
</script>

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
      @edit-course="openEditCourseModal"
      @delete-course="handleDeleteCourse"
    />

    <!-- <div
      v-if="storesInitialized"
      style="
        position: fixed;
        top: 10px;
        left: 10px;
        background: lightyellow;
        z-index: 9999;
        padding: 5px;
        border: 1px solid orange;
      "
    >
      DEBUG AppLayout: <br />
      courseModalVisibility: <br />
      - isRef: {{ !!(courseModalVisibility && courseModalVisibility.__v_isRef) }} <br />
      - typeof: {{ typeof courseModalVisibility }} <br />
      - .value:
      {{
        courseModalVisibility && courseModalVisibility.__v_isRef
          ? courseModalVisibility.value
          : 'N/A or not a ref'
      }}
      <br />
      <hr />
      studentModalVisibility: <br />
      - isRef: {{ !!(studentModalVisibility && studentModalVisibility.__v_isRef) }} <br />
      - typeof: {{ typeof studentModalVisibility }} <br />
      - .value:
      {{
        studentModalVisibility && studentModalVisibility.__v_isRef
          ? studentModalVisibility.value
          : 'N/A or not a ref'
      }}
    </div> -->

    <CreateCourseModal
      v-if="storesInitialized"
      :key="'create-course-modal'"
      :visible="courseModalVisibilityValue"
      :courseToEdit="courseToEditValue"
      @update:visible="handleCreateCourseModalVisibilityUpdate"
      @course-created="handleCourseCreated"
      @course-updated="handleCourseUpdated"
      @closed="onCourseModalActuallyClosed"
    />

    <AddStudentModal
      v-if="storesInitialized"
      :key="'add-student-modal'"
      :visible="studentModalVisibilityValue"
      :targetCourse="addStudentModalTargetCourseValue"
      @update:visible="handleAddStudentModalVisibilityUpdate"
      @student-added="handleStudentAdded"
      @closed="onStudentModalActuallyClosed"
    />
  </el-container>
</template>

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
  white-space: pre-wrap;
}
</style>
