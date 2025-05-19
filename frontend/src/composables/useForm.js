// frontend/src/composables/useForm.js
import { reactive, ref, toRaw, nextTick } from 'vue'

/**
 * @template TFormState
 * @param {() => TFormState} getInitialFormState - 一个返回表单初始状态对象的函数。
 * @param {(formData: TFormState) => Promise<any>} submitAction - 执行提交的异步函数，成功时应 resolve，失败时应 reject 或 throw error。
 * @param {import('vue').Ref<any | null>} [externalFormRef] - 可选的外部 el-form ref，用于调用 validate, resetFields 等方法。
 */
export function useForm(getInitialFormState, submitAction, externalFormRef = null) {
  const form = reactive(getInitialFormState())
  const formRef = externalFormRef || ref(null)
  const isSubmitting = ref(false)
  const submissionError = ref(null)
  const submissionSuccess = ref(false)

  const resetForm = async () => {
    const initialData = getInitialFormState()
    // 清空现有 form 的所有键，然后用 initialData 的键重新赋值
    // 这样可以处理 initialData 比当前 form 少的属性的情况
    Object.keys(form).forEach((key) => delete form[key])
    Object.assign(form, initialData)

    submissionError.value = null
    submissionSuccess.value = false
    await nextTick()
    if (formRef.value && typeof formRef.value.resetFields === 'function') {
      formRef.value.resetFields()
    } else if (formRef.value && typeof formRef.value.clearValidate === 'function') {
      formRef.value.clearValidate()
    }
  }

  const setFormData = async (newData) => {
    await resetForm() // resetForm 内部会操作 reactive 的 form 对象
    await nextTick()
    if (newData) {
      for (const key in newData) {
        if (Object.prototype.hasOwnProperty.call(form, key)) {
          // form 是 reactive 对象
          form[key] = newData[key] // 直接修改 reactive 对象的属性
        } else {
          // 如果 form 中原本没有这个 key，可以选择添加它（如果你的表单是动态的）
          // 或者忽略它（如果表单结构是固定的）
          // 为了安全，这里我们只更新 form 中已存在的 key
          // 如果需要动态添加，需要谨慎处理响应性
          console.warn(
            `[useForm] setFormData: Property "${key}" does not exist on the initial form state.`,
          )
        }
      }
    }
  }

  const handleSubmit = async () => {
    submissionError.value = null
    submissionSuccess.value = false

    if (formRef.value && typeof formRef.value.validate === 'function') {
      try {
        await formRef.value.validate()
      } catch (validationErrors) {
        console.warn('表单验证失败:', validationErrors)
        return false
      }
    } else {
      console.warn('formRef 不可用或没有 validate 方法。')
    }

    isSubmitting.value = true
    try {
      await submitAction(toRaw(form))
      submissionSuccess.value = true
      return true
    } catch (error) {
      // 确保 error 是一个 Error 对象或包含 message 属性
      if (error instanceof Error) {
        submissionError.value = error.message || '提交操作失败'
      } else if (error && typeof error.message === 'string') {
        submissionError.value = error.message
      } else if (typeof error === 'string') {
        submissionError.value = error
      } else {
        submissionError.value = '提交操作时发生未知错误'
      }
      console.error('表单提交错误:', error)
      return false
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    form,
    formRef,
    isSubmitting,
    submissionError,
    submissionSuccess,
    handleSubmit,
    resetForm,
    setFormData,
  }
}
