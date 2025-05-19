<template>
  <el-dialog
    :model-value="visible"
    :title="title"
    :width="width"
    :before-close="handleClose"
    :close-on-click-modal="closeOnClickModal"
    :append-to-body="appendToBody"
    :destroy-on-close="destroyOnClose"
    class="app-modal"
  >
    <slot name="body"></slot>
    <template #footer v-if="showFooter">
      <slot name="footer">
        <el-button @click="handleCancel">{{ cancelText }}</el-button>
        <el-button type="primary" @click="handleConfirm" :loading="confirmLoading">
          {{ confirmText }}
        </el-button>
      </slot>
    </template>
  </el-dialog>
</template>

<script setup>
import { ElDialog, ElButton } from 'element-plus'

const props = defineProps({
  visible: {
    // 控制显示/隐藏，由 useModal 的 isModalVisible 传入
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    default: '提示',
  },
  width: {
    type: String,
    default: '50%',
  },
  closeOnClickModal: {
    type: Boolean,
    default: false, // 通常不希望点击遮罩关闭重要操作模态框
  },
  appendToBody: {
    type: Boolean,
    default: true,
  },
  destroyOnClose: {
    // 关闭时销毁内部元素，对表单重置有好处
    type: Boolean,
    default: true,
  },
  showFooter: {
    type: Boolean,
    default: true,
  },
  cancelText: {
    type: String,
    default: '取 消',
  },
  confirmText: {
    type: String,
    default: '确 定',
  },
  confirmLoading: {
    // 确认按钮的加载状态
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:visible', 'confirm', 'cancel', 'closed'])

const handleClose = (done) => {
  // ElDialog 的 before-close API
  emit('update:visible', false)
  emit('closed')
  if (done) {
    done()
  }
}

const handleCancel = () => {
  emit('update:visible', false)
  emit('cancel')
  emit('closed')
}

const handleConfirm = () => {
  emit('confirm')
  // 关闭模态框的逻辑通常由调用方在 confirm 事件处理后执行
  // 或者，如果总是希望确认后关闭，可以在这里 emit('update:visible', false);
}
</script>

<style scoped>
.app-modal {
  /* 你可以在这里添加一些自定义的模态框样式 */
}
/* 确保 Element Plus 的 Dialog 样式被正确加载 */
</style>
