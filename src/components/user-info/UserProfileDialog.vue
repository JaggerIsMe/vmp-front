<template>
  <el-dialog
    v-model="dialogVisible"
    title="修改用户信息"
    width="520px"
    @closed="resetForm"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-position="top"
      @submit.prevent
    >
      <el-form-item label="账号" prop="account">
        <el-input
          v-model.trim="formData.account"
          clearable
          :placeholder="userInfo?.account || '请输入账号'"
          @keyup.enter="handleSave"
        />
      </el-form-item>

      <el-form-item label="昵称" prop="nickName">
        <el-input
          v-model.trim="formData.nickName"
          clearable
          :placeholder="userInfo?.nickName || '请输入昵称'"
          @keyup.enter="handleSave"
        />
      </el-form-item>

      <el-form-item label="头像">
        <div class="profile-avatar-editor">
          <el-avatar :size="72" :src="previewUrl || avatarUrl">
            {{ avatarText }}
          </el-avatar>
          <el-upload
            ref="uploadRef"
            action=""
            accept="image/*"
            :auto-upload="false"
            :limit="1"
            :on-change="handleAvatarChange"
            :on-remove="handleAvatarRemove"
          >
            <el-button :icon="Upload">选择图片</el-button>
          </el-upload>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button
        type="primary"
        :disabled="!hasProfileChange"
        :loading="saving"
        @click="handleSave"
      >
        保存
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { Upload } from '@element-plus/icons-vue'
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
const uploadRef = ref()
const saving = ref(false)
const previewUrl = ref('')
const formData = reactive({
  account: '',
  nickName: '',
  avatarFile: null,
})

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})
const userInfo = computed(() => authStore.userInfo || {})
const avatarUrl = computed(() => authStore.avatarUrl)
const avatarText = computed(() => (authStore.nickName || 'U').slice(0, 1).toUpperCase())
const hasProfileChange = computed(() => {
  return Boolean(formData.account.trim() || formData.nickName.trim() || formData.avatarFile)
})

const formRules = {
  account: [
    { validator: Verify.account, message: '账号只能包含大小写英文和数字，且长度不超过 10 位', trigger: 'blur' },
  ],
  nickName: [
    { validator: Verify.nickName, message: '昵称不能包含特殊字符且长度小于 20 位', trigger: 'blur' },
  ],
}

const revokePreviewUrl = () => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = ''
  }
}

const resetForm = () => {
  formRef.value?.resetFields()
  formData.account = ''
  formData.nickName = ''
  formData.avatarFile = null
  uploadRef.value?.clearFiles()
  revokePreviewUrl()
}

const handleAvatarChange = (uploadFile) => {
  formData.avatarFile = uploadFile.raw || null
  revokePreviewUrl()

  if (formData.avatarFile) {
    previewUrl.value = URL.createObjectURL(formData.avatarFile)
  }
}

const handleAvatarRemove = () => {
  formData.avatarFile = null
  revokePreviewUrl()
}

const handleSave = async () => {
  if (saving.value || !hasProfileChange.value) {
    return
  }

  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) {
    return
  }

  saving.value = true
  const saved = await authStore.saveUserInfo(formData).finally(() => {
    saving.value = false
  })

  if (!saved) {
    return
  }

  Message.success('用户信息已保存')
  resetForm()
  dialogVisible.value = false
}

watch(dialogVisible, (visible) => {
  if (visible) {
    resetForm()
  }
})
</script>

<style scoped lang="scss"></style>
