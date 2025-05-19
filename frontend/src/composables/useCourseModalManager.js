// frontend/src/composables/useCourseModalManager.js
import { ref } from 'vue'
import { useModal } from './useModal'

export function useCourseModalManager() {
  const {
    isModalVisible, // 直接获取 isModalVisible ref
    modalTitle,
    openModal: internalOpenModal,
    // closeModal: internalCloseModal // closeModal 由 visible 的变化间接触发
  } = useModal()

  const courseToEdit = ref(null)

  const openCreateCourseModal = () => {
    courseToEdit.value = null
    internalOpenModal('创建新课程')
  }

  const openEditCourseModal = (course) => {
    if (course) {
      courseToEdit.value = { ...course }
      internalOpenModal('编辑课程')
    }
  }

  // 当模态框的 @closed 事件触发时，AppLayout 会调用这个
  // 或者当 isModalVisible 变为 false 时，这个逻辑也应该执行
  const onModalActuallyClosed = () => {
    courseToEdit.value = null
  }

  return {
    // 直接暴露从 useModal() 获取的 isModalVisible ref
    // 模板将使用:visible="courseModalVisibility.value" 和 @update:visible="courseModalVisibility.value = $event"
    courseModalVisibility: isModalVisible,
    courseModalTitle: modalTitle,
    courseToEdit,
    openCreateCourseModal,
    openEditCourseModal,
    onModalActuallyClosed, // 用于模态框关闭后的清理
  }
}
