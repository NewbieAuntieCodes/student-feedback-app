<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <div class="card-header">
          <span>学生反馈系统 - 登录</span>
        </div>
      </template>
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        label-width="80px"
        class="login-form"
        @submit.prevent="handleLogin"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="loginForm.username" placeholder="请输入用户名" clearable />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            show-password
            clearable
          />
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="rememberMe">记住密码</el-checkbox>
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            native-type="submit"
            class="login-button"
            :loading="authStore.isLoading"
          >
            登 录
          </el-button>
        </el-form-item>
        <el-form-item>
          <el-link type="primary" @click="goToRegister">还没有账号？去注册</el-link>
        </el-form-item>
        <el-alert
          v-if="authStore.loginError"
          :title="authStore.loginError"
          type="error"
          show-icon
          :closable="false"
          style="margin-top: 10px"
        />
        <el-alert
          v-if="authStore.registerSuccessMessage"
          :title="authStore.registerSuccessMessage"
          type="success"
          show-icon
          :closable="false"
          style="margin-top: 10px"
        />
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../store/authStore'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute() // 获取当前路由信息
const authStore = useAuthStore()

const loginForm = reactive({
  username: '',
  password: '',
})

const rememberMe = ref(false)
const loginFormRef = ref(null)

const loginRules = reactive({
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
})

const handleLogin = async () => {
  if (!loginFormRef.value) return
  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      const success = await authStore.login({
        username: loginForm.username,
        password: loginForm.password,
      })

      if (success) {
        if (rememberMe.value) {
          localStorage.setItem('rememberedUser', loginForm.username)
        } else {
          localStorage.removeItem('rememberedUser')
        }
        // 检查是否有重定向路径
        const redirectPath = route.query.redirect || '/' // 默认跳转到首页或欢迎页
        router.push(redirectPath)
      }
      // 登录失败的错误提示由 authStore.loginError 在模板中显示
    } else {
      ElMessage.error('请正确填写表单')
      return false
    }
  })
}

const goToRegister = () => {
  authStore.clearAuthMessages() // 清除登录页可能的消息
  router.push({ name: 'Register' })
}

onMounted(() => {
  // 如果是从注册页面跳转过来的，注册成功消息会通过 authStore 显示
  // 这里不需要特别处理 authStore.registerSuccessMessage，因为它已经在模板中绑定了

  // 检查是否"记住密码"
  const rememberedUsername = localStorage.getItem('rememberedUser')
  if (rememberedUsername) {
    loginForm.username = rememberedUsername
    rememberMe.value = true
  }
})

// 组件卸载时清除消息，避免在其他页面显示
onUnmounted(() => {
  authStore.clearAuthMessages()
})
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f0f2f5;
}

.login-card {
  width: 400px;
}

.card-header {
  text-align: center;
  font-size: 20px;
  font-weight: bold;
}

.login-form {
  padding-top: 20px;
}

.login-button {
  width: 100%;
}
</style>
