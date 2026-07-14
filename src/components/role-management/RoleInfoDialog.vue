<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? '修改角色信息' : '新增角色'"
    width="520px"
    destroy-on-close
    @closed="resetForm"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-position="top"
      @submit.prevent
    >
      <el-form-item label="角色名" prop="name">
        <el-input
          v-model.trim="formData.name"
          maxlength="20"
          show-word-limit
          clearable
          :placeholder="roleNamePlaceholder"
          @keyup.enter="handleSubmit"
        />
      </el-form-item>

      <el-form-item label="角色等级" prop="level">
        <el-radio-group v-model="formData.level">
          <el-radio v-for="item in roleLevelOptions" :key="item.value" :value="item.value">
            {{ item.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="角色状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio :value="1">启用</el-radio>
          <el-radio :value="0">停用</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button
        type="primary"
        :disabled="!canSubmit"
        :loading="submitting"
        @click="handleSubmit"
      >
        {{ isEdit ? '保存' : '新增' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import Request from '@/utils/Request'
import Verify from '@/utils/Verify'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  role: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue', 'saved'])

const roleLevelOptions = [
  { label: '开发者', value: 0 },
  { label: '老板', value: 1 },
  { label: '主管', value: 2 },
  { label: '组长', value: 3 },
  { label: '组员', value: 4 },
]

const formRef = ref()
const submitting = ref(false)
const initialForm = ref(null)
const formData = reactive({
  name: '',
  level: '',
  status: '',
})

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})
const isEdit = computed(() => Boolean(props.role?.roleId))
const roleNamePlaceholder = computed(() => {
  return isEdit.value ? String(props.role?.name || '请输入角色名') : '请输入角色名'
})
const effectiveRoleName = computed(() => {
  return formData.name.trim() || (isEdit.value ? String(props.role?.name || '').trim() : '')
})
const isComplete = computed(() => {
  return Boolean(effectiveRoleName.value) && formData.level !== '' && formData.status !== ''
})
const hasChanged = computed(() => {
  if (!isEdit.value || !initialForm.value) {
    return true
  }

  return (
    effectiveRoleName.value !== initialForm.value.name ||
    formData.level !== initialForm.value.level ||
    formData.status !== initialForm.value.status
  )
})
const canSubmit = computed(() => isComplete.value && hasChanged.value && !submitting.value)

const validateRoleName = (rule, value, callback) => {
  const name = String(value || '').trim()
  if (!name) {
    if (isEdit.value) {
      callback()
    } else {
      callback(new Error('请输入角色名'))
    }
    return
  }

  Verify.roleName(rule, name, callback)
}

const formRules = {
  name: [
    {
      validator: validateRoleName,
      message: '角色名不能包含特殊字符且长度不超过 20 位',
      trigger: 'blur',
    },
  ],
  level: [{ required: true, message: '请选择角色等级', trigger: 'change' }],
  status: [{ required: true, message: '请选择角色状态', trigger: 'change' }],
}

const fillForm = () => {
  const role = props.role || {}
  formData.name = ''
  formData.level = isEdit.value ? Number(role.level) : ''
  formData.status = isEdit.value ? Number(role.status) : ''
  initialForm.value = isEdit.value
    ? { name: String(role.name || '').trim(), level: formData.level, status: formData.status }
    : null
}

const resetForm = () => {
  formRef.value?.clearValidate()
  formData.name = ''
  formData.level = ''
  formData.status = ''
  initialForm.value = null
  submitting.value = false
}

const handleSubmit = async () => {
  if (!canSubmit.value) {
    return
  }

  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) {
    return
  }

  submitting.value = true
  const url = isEdit.value
    ? `/admin/updateRole/${encodeURIComponent(props.role.roleId)}`
    : '/admin/newRole'
  const response = await Request({
    url,
    params: {
      name: effectiveRoleName.value,
      level: formData.level,
      status: formData.status,
    },
    showLoading: false,
  }).finally(() => {
    submitting.value = false
  })

  if (!response) {
    return
  }

  ElMessage.success(isEdit.value ? '角色信息已保存' : '角色新增成功')
  dialogVisible.value = false
  emit('saved')
}

watch(dialogVisible, async (visible) => {
  if (!visible) {
    return
  }

  fillForm()
  await nextTick()
  formRef.value?.clearValidate()
})
</script>

<style scoped lang="scss"></style>
