<template>
  <el-dialog
    v-model="dialogVisible"
    title="初始化用户信息"
    width="520px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
    @closed="resetForm"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-position="top"
      @submit.prevent
    >
      <el-form-item label="昵称" prop="nickName">
        <el-input
          v-model.trim="formData.nickName"
          clearable
          :placeholder="userInfo?.nickName || '请输入昵称'"
          @keyup.enter="handleSave"
        />
      </el-form-item>

      <el-form-item label="账号" prop="account">
        <el-input
          v-model.trim="formData.account"
          clearable
          :placeholder="userInfo?.account || '请输入账号'"
          @keyup.enter="handleSave"
        />
      </el-form-item>

      <el-form-item label="密码" prop="password">
        <el-input
          v-model="formData.password"
          clearable
          placeholder="请输入密码"
          show-password
          type="password"
          @keyup.enter="handleSave"
        />
      </el-form-item>

      <el-form-item label="确认密码" prop="confirmPassword">
        <el-input
          v-model="formData.confirmPassword"
          clearable
          placeholder="请再次输入密码"
          show-password
          type="password"
          @keyup.enter="handleSave"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button type="primary" :loading="saving" @click="handleSave">确认</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
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
  nickName: '',
  account: '',
  password: '',
  confirmPassword: '',
})

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})
const userInfo = computed(() => authStore.userInfo || {})

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== formData.password) {
    callback(new Error('两次输入的密码不一致'))
    return
  }

  callback()
}

const formRules = {
  nickName: [
    { validator: Verify.nickName, message: '昵称不能包含特殊字符且长度小于 20 位', trigger: 'blur' },
  ],
  account: [
    { validator: Verify.account, message: '账号只能包含大小写英文和数字，且长度不超过 10 位', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { validator: Verify.password, message: '密码需为 8 到 18 位，包含字母和数字', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
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
  const saved = await authStore.initUserInfo(formData).finally(() => {
    saving.value = false
  })

  if (!saved) {
    return
  }

  Message.success('用户信息已初始化')
  dialogVisible.value = false
}

watch(dialogVisible, (visible) => {
  if (visible) {
    resetForm()
  }
})
</script>

<style scoped lang="scss"></style>
