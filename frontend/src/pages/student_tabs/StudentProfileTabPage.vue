<template>
  <div class="student-profile-tab-page">
    <div
      v-if="
        !currentStudentDataComputed &&
        !studentStore.isUpdating &&
        studentStore.selectedStudent &&
        props.studentId
      "
      class="loading-state"
    >
      <el-icon class="is-loading" :size="20"><Loading /></el-icon>
      <p>加载学生档案...</p>
    </div>
    <div v-else-if="!props.studentId" class="placeholder-state">
      <el-alert
        title="请先从左侧选择一个学生以查看档案。"
        type="info"
        :closable="false"
        show-icon
      />
    </div>
    <div v-else-if="studentStore.updateError" style="margin-bottom: 15px">
      <el-alert
        :title="`更新失败: ${studentStore.updateError}`"
        type="error"
        show-icon
        @close="studentStore.clearStudentErrors()"
      />
    </div>

    <el-form
      v-if="props.studentId && currentStudentDataComputed"
      ref="profileFormRef"
      :model="profileForm"
      :rules="profileRules"
      label-width="100px"
      label-position="right"
      style="max-width: 500px; margin-top: 5px"
      @submit.prevent="saveProfileChanges"
    >
      <el-form-item label="学生姓名" prop="name">
        <el-input v-model="profileForm.name" placeholder="请输入学生姓名" />
      </el-form-item>
      <el-form-item label="年级" prop="grade">
        <el-input v-model="profileForm.grade" placeholder="例如：高一 / 三年级" />
      </el-form-item>
      <el-form-item label="学习状态" prop="status">
        <el-select v-model="profileForm.status" placeholder="请选择状态" style="width: 100%">
          <el-option label="进行中 (ongoing)" value="ongoing"></el-option>
          <el-option label="已完成 (completed)" value="completed"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="注意" prop="needsAttention">
        <el-switch v-model="profileForm.needsAttention" />
      </el-form-item>
      <el-form-item label="特别关注" prop="specialAttention">
        <el-switch v-model="profileForm.specialAttention" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" native-type="submit" :loading="studentStore.isUpdating">
          保存更改
        </el-button>
        <el-button @click="resetFormToStoreData">重置表单</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted, computed, nextTick } from 'vue'
import { useStudentStore } from '../../store/studentStore'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'

const props = defineProps({
  courseId: String, // 虽然此组件可能不直接用 courseId 发API，但父级传了就接收
  studentId: String,
})

const studentStore = useStudentStore()
const profileFormRef = ref(null)

// 表单数据，其初始值会通过 watch 从 store 同步
const profileForm = reactive({
  name: '',
  grade: '',
  status: 'ongoing',
  needsAttention: false,
  specialAttention: false,
})

// 用于从 store 安全地获取数据并触发响应式更新
const currentStudentDataComputed = computed(() => {
  if (studentStore.selectedStudent && studentStore.selectedStudent._id === props.studentId) {
    return studentStore.selectedStudent
  }
  return null
})

const profileRules = reactive({
  name: [{ required: true, message: '学生姓名不能为空', trigger: 'blur' }],
})

// 当选中的学生数据变化 (来自 store) 或 props.studentId 变化时，更新表单
watch(
  currentStudentDataComputed,
  (newStudent) => {
    // console.log('StudentProfileTabPage: watch currentStudentDataComputed triggered', newStudent);
    if (newStudent && newStudent._id === props.studentId) {
      // 再次确认 ID 匹配
      profileForm.name = newStudent.name || ''
      profileForm.grade = newStudent.grade || ''
      profileForm.status = newStudent.status || 'ongoing'
      profileForm.needsAttention = newStudent.needsAttention || false
      profileForm.specialAttention = newStudent.specialAttention || false
      nextTick(() => {
        // 清除可能存在的旧校验信息
        profileFormRef.value?.clearValidate()
      })
    } else if (!newStudent && props.studentId) {
      // 有 studentId prop 但 store 中没有匹配的学生数据，可能正在加载，或 MainLayout 未正确设置
      // console.warn(`StudentProfileTabPage: studentId prop is ${props.studentId}, but no matching student in store.`);
      // 此时可以考虑显示加载状态或等待 MainLayout 更新 store
      resetFormFieldsToDefaults() // 重置为默认空状态
    } else if (!props.studentId) {
      resetFormFieldsToDefaults() // 没有 studentId prop，也重置
    }
  },
  { immediate: true, deep: true },
)

const resetFormFieldsToDefaults = () => {
  profileForm.name = ''
  profileForm.grade = ''
  profileForm.status = 'ongoing'
  profileForm.needsAttention = false
  profileForm.specialAttention = false
  nextTick(() => {
    profileFormRef.value?.clearValidate()
  })
}

const resetFormToStoreData = () => {
  if (currentStudentDataComputed.value) {
    const student = currentStudentDataComputed.value
    profileForm.name = student.name || ''
    profileForm.grade = student.grade || ''
    profileForm.status = student.status || 'ongoing'
    profileForm.needsAttention = student.needsAttention || false
    profileForm.specialAttention = student.specialAttention || false
    nextTick(() => {
      profileFormRef.value?.clearValidate()
    })
  } else {
    resetFormFieldsToDefaults() // 如果 store 中也没有，则重置为空
  }
}

const saveProfileChanges = async () => {
  if (!props.courseId || !props.studentId) {
    ElMessage.error('课程或学生信息丢失，无法保存。')
    return
  }
  if (!profileFormRef.value) return

  await profileFormRef.value.validate(async (valid) => {
    if (valid) {
      const dataToUpdate = {
        name: profileForm.name,
        grade: profileForm.grade,
        status: profileForm.status,
        needsAttention: profileForm.needsAttention,
        specialAttention: profileForm.specialAttention,
      }
      const success = await studentStore.updateStudentDetails(
        props.courseId,
        props.studentId,
        dataToUpdate,
      )
      if (success) {
        ElMessage.success('学生档案更新成功！')
        // store 更新后，watch(currentStudentDataComputed) 会自动用新数据同步表单
      } else {
        ElMessage.error(studentStore.updateError || '学生档案更新失败，请稍后再试。')
      }
    } else {
      ElMessage.warning('请检查表单填写是否正确。')
      return false
    }
  })
}

onMounted(() => {
  // watch(currentStudentDataComputed) 的 immediate:true 会负责初始填充
  // 如果 studentId prop 存在但 store 中没有对应学生，
  // MainLayout.vue 的 onMounted 或 watch 应该负责从API加载并填充 store,
  // 然后这里的 watch 就会响应。
  if (!props.studentId) {
    // console.log('StudentProfileTabPage: No studentId prop on mount.')
  } else if (
    !studentStore.selectedStudent ||
    studentStore.selectedStudent._id !== props.studentId
  ) {
    // console.log(
    //   `StudentProfileTabPage: studentId prop is ${props.studentId}, selected student in store is ${studentStore.selectedStudent?._id}. Waiting for store update or MainLayout to set.`,
    // )
    // 这里可以考虑，如果 MainLayout 没有在导航前设置好 selectedStudent，
    // 此组件是否应该自己尝试从 studentStore.studentsInCurrentCourse 查找 (如果列表已加载)
    // 但通常父组件或导航逻辑应该保证 props 对应的核心数据在 store 中就绪。
  }
})
</script>

<style scoped>
.student-profile-tab-page {
  /* padding: 10px 0; */ /* 由 StudentDashboardPage 的 tab-content 控制 */
}
.loading-state,
.placeholder-state {
  text-align: center;
  padding: 30px 0;
  color: #909399;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.el-form {
  padding: 10px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background-color: #fff;
}
</style>
