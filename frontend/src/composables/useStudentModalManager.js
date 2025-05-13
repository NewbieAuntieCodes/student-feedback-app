// frontend/src/composables/useStudentModalManager.js
import { ref } from 'vue'
import { useModal } from './useModal' // 确保这个路径是正确的
import { ElMessage } from 'element-plus'

export function useStudentModalManager() {
  const {
    isModalVisible: internalIsVisibleRef,
    modalTitle: internalTitleRef,
    openModal: internalOpenModal,
    closeModal: internalCloseModal, // 如果 useModal 提供了 closeModal
  } = useModal()

  const addStudentModalTargetCourse = ref(null)

  // ***** 这是你需要修改的核心函数 *****
  const openAddStudentModal = (courseToAddStudentTo) => {
    // <--- 参数名改为 courseToAddStudentTo，更清晰
    if (!courseToAddStudentTo || !courseToAddStudentTo._id) {
      // 如果没有有效的课程对象传入，就显示你看到的那个提示
      ElMessage.warning('请先选择一个课程以添加学生')
      console.error('[useStudentModalManager] openAddStudentModal called without a valid course.')
      return
    }

    // 传入了有效的课程，将其设置为目标课程
    addStudentModalTargetCourse.value = { ...courseToAddStudentTo } // 存储传入的课程信息
    console.log(
      '[useStudentModalManager] Opening add student modal for course:',
      addStudentModalTargetCourse.value,
    )

    internalOpenModal(`为课程 "${courseToAddStudentTo.name}" 添加新学生`) // 打开基础模态框，可以带上课程名
  }
  // ***** 修改结束 *****

  // 当模态框的 @closed 事件触发时，AppLayout 会调用这个
  // 或者当 isModalVisible (即 studentModalVisibility) 变为 false 时，这个逻辑也应该执行以清理状态
  const onModalActuallyClosed = () => {
    addStudentModalTargetCourse.value = null
    // 这里不需要调用 internalCloseModal()，因为模态框的关闭是由
    // AppLayout 中 :visible 绑定的 studentModalVisibility.value 变为 false 触发的。
    // internalCloseModal() 也会做 isModalVisible.value = false，可能导致冗余或意外行为。
    console.log(
      '[useStudentModalManager] Add student modal actually closed, target course cleared.',
    )
  }

  const handleStudentAdded = (studentData) => {
    // 学生成功添加后的逻辑
    ElMessage.success('学生添加成功！')
    // 通常添加成功后会关闭模态框
    if (internalIsVisibleRef && typeof internalIsVisibleRef.value !== 'undefined') {
      internalIsVisibleRef.value = false // 这会通过 AppLayout 中的 :visible 更新 studentModalVisibility.value
    }
    // onModalActuallyClosed() 会在 internalIsVisibleRef.value 变为 false 后，
    // 通过 AppLayout 的 @update:visible -> onStudentModalActuallyClosed 调用。
    // 或者如果模态框有 @closed 事件，会通过那个事件调用。
  }

  return {
    studentModalVisibility: internalIsVisibleRef, // 暴露从 useModal() 获取的 isModalVisible ref
    studentModalTitle: internalTitleRef, // 暴露从 useModal() 获取的 modalTitle ref
    addStudentModalTargetCourse, // 暴露存储目标课程的 ref
    openAddStudentModal, // 暴露打开模态框的方法
    onModalActuallyClosed, // 暴露模态框关闭后的清理逻辑函数
    handleStudentAdded, // 暴露学生添加成功后的处理函数
  }
}
