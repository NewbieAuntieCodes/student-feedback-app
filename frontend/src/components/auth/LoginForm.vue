<template>
  <el-card class="login-form-card" shadow="hover">
    <template #header>
      <div class="card-header">
        <span>用户登录</span>
      </div>
    </template>
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      @submit.prevent="handleLoginSubmit"
    >
      <el-form-item label="用户名" prop="username">
        <el-input v-model="form.username" placeholder="请输入用户名" clearable />
      </el-form-item>
      <el-form-item label="密码" prop="password">
        <el-input
          type="password"
          v-model="form.password"
          placeholder="请输入密码"
          show-password
          clearable
        />
      </el-form-item>

      <el-form-item v-if="submissionError" class="form-error-message">
        <el-alert :title="submissionError" type="error" show-icon :closable="false" />
      </el-form-item>

      <el-form-item>
        <el-button
          type="primary"
          native-type="submit"
          :loading="isSubmitting"
          class="login-button"
          style="width: 100%"
        >
          登 录
        </el-button>
      </el-form-item>
      <div class="form-links">
        <router-link to="/register">没有账户？去注册</router-link>
      </div>
    </el-form>
  </el-card>
</template>

<script setup>
import { reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElForm, ElFormItem, ElInput, ElButton, ElCard, ElAlert } from 'element-plus'
import { useAuthStore } from '@/store/authStore'
import { useForm } from '@/composables/useForm' // 导入 useForm

const router = useRouter()
const authStore = useAuthStore()

const getInitialState = () => ({
  username: '',
  password: '',
})

// 表单提交动作
const loginAction = async (credentials) => {
  const success = await authStore.login(credentials)
  if (!success && authStore.loginError) {
    throw new Error(authStore.loginError) // 抛出错误以便 useForm 捕获
  }
  // 成功跳转由 authStore 内部处理
}

const {
  form,
  formRef,
  isSubmitting,
  submissionError, // 从 useForm 获取错误信息
  handleSubmit,
  // resetForm, // 如果需要重置按钮可以解开
} = useForm(getInitialState, loginAction)

const rules = reactive({
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
})

const handleLoginSubmit = async () => {
  await handleSubmit()
  // 成功跳转由 authStore.login 处理
}
</script>

<style scoped>
.login-form-card {
  max-width: 400px;
  margin: 50px auto;
}
.card-header {
  text-align: center;
  font-size: 20px;
}
.login-button {
  width: 100%;
}
.form-error-message {
  margin-bottom: 10px; /* 给错误信息和下方按钮之间留点空间 */
}
.form-links {
  margin-top: 15px;
  text-align: center;
}
.form-links a {
  font-size: 14px;
  color: var(--el-color-primary);
  text-decoration: none;
}
.form-links a:hover {
  text-decoration: underline;
}
</style>
