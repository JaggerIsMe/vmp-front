<template>
  <el-dialog
    v-model="dialogVisible"
    title="修改密码"
    width="480px"
    @closed="resetForm"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-position="top"
      @submit.prevent
    >
      <el-form-item label="新密码" prop="password">
        <el-input
          v-model="formData.password"
          clearable
          placeholder="请输入新密码"
          show-password
          type="password"
          @keyup.enter="handleSave"
        />
      </el-form-item>

      <el-form-item label="确认密码" prop="confirmPassword">
        <el-input
          v-model="formData.confirmPassword"
          clearable
          placeholder="请再次输入新密码"
          show-password
          type="password"
          @keyup.enter="handleSave"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="handleSave">修改</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import Message from '@/utils/Message'
import Verify from '@/utils/Verify'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])

const authStore = useAuthStore()
const formRef = ref()
const saving = ref(false)
const formData = reactive({
  password: '',
  confirmPassword: '',
})

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== formData.password) {
    callback(new Error('两次输入的密码不一致'))
    return
  }

  callback()
}

const formRules = {
  password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { validator: Verify.password, message: '密码需为 8 到 18 位，包含字母和数字', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' },
  ],
}

const resetForm = () => {
  formRef.value?.resetFields()
}

const handleSave = async () => {
  if (saving.value) {
    return
  }

  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) {
    return
  }

  saving.value = true
  const saved = await authStore.resetPassword(formData.password).finally(() => {
    saving.value = false
  })

  if (!saved) {
    return
  }

  Message.success('密码已修改')
  dialogVisible.value = false
}
</script>

<style scoped lang="scss"></style>
