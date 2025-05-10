// src/composables/useModal.js
import { ref } from 'vue'

export function useModal() {
  const isModalVisible = ref(false)
  const modalTitle = ref('')
  const modalData = ref(null)

  const openModal = (title = '提示', data = null) => {
    modalTitle.value = title
    modalData.value = data
    isModalVisible.value = true
  }

  const closeModal = () => {
    isModalVisible.value = false
    // modalTitle.value = ''; // 根据需要取消注释
    // modalData.value = null; // 根据需要取消注释
  }

  return {
    isModalVisible,
    modalTitle,
    modalData,
    openModal,
    closeModal,
  }
}
