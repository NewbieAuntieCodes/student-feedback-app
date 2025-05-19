<template>
  <div class="register-container">
    <el-card class="register-card">
      <template #header>
        <div class="card-header">
          <span>学生反馈系统 - 注册新用户</span>
        </div>
      </template>
      <el-form
        ref="registerFormRef"
        :model="registerForm"
        :rules="registerRules"
        label-width="100px"
        class="register-form"
        @submit.prevent="handleRegister"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="registerForm.username" placeholder="设置用户名 (至少3位)" clearable />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="registerForm.password"
            type="password"
            placeholder="设置密码 (至少6位)"
            show-password
            clearable
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            show-password
            clearable
          />
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            native-type="submit"
            class="register-button"
            :loading="authStore.isLoading"
          >
            注 册
          </el-button>
        </el-form-item>
        <el-form-item>
          <el-link type="primary" @click="goToLogin">已有账号？直接登录</el-link>
        </el-form-item>

        <el-alert
          v-if="authStore.registerError"
          :title="authStore.registerError"
          type="error"
          show-icon
          :closable="false"
          style="margin-bottom: 10px"
        />
        <el-alert
          v-if="authStore.registerSuccessMessage"
          :title="authStore.registerSuccessMessage"
          type="success"
          show-icon
          :closable="false"
          style="margin-bottom: 10px"
        />
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../store/authStore'
import { ElMessage } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()

const registerForm = reactive({
  username: '',
  password: '',
  confirmPassword: '',
})

const registerFormRef = ref(null)

const validateConfirmPassword = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致!'))
  } else {
    callback()
  }
}

const registerRules = reactive({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, message: '用户名长度不能少于2位', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' },
  ],
})

const handleRegister = async () => {
  if (!registerFormRef.value) return
  // 每次提交前清除旧的成功消息，避免用户修改信息再次提交时还显示旧的成功提示
  authStore.registerSuccessMessage = null

  await registerFormRef.value.validate(async (valid) => {
    if (valid) {
      const success = await authStore.register({
        // 等待 register action 完成
        username: registerForm.username,
        password: registerForm.password,
      })

      if (success && authStore.registerSuccessMessage) {
        // 检查 action 是否成功并且有成功消息
        // 清空表单的逻辑可以保留，或者根据产品需求决定是否保留输入
        registerFormRef.value.resetFields() // 重置表单，包括校验状态
        // 可以在这里延迟几秒后跳转到登录页，或者让用户手动点击链接
        // setTimeout(() => {
        //   if(authStore.registerSuccessMessage) router.push({ name: 'Login' });
        // }, 3000);
      }
    } else {
      ElMessage.error('请正确填写表单信息')
      return false
    }
  })
}

const goToLogin = () => {
  authStore.clearAuthMessages() // 清除注册页可能的消息
  router.push({ name: 'Login' })
}

// 组件卸载时清除消息
onUnmounted(() => {
  authStore.clearAuthMessages()
})
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f0f2f5;
}

.register-card {
  width: 450px;
}

.card-header {
  text-align: center;
  font-size: 20px;
  font-weight: bold;
}

.register-form {
  padding-top: 20px;
}

.register-button {
  width: 100%;
}
</style>
