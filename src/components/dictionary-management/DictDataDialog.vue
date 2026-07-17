<template>
  <el-dialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="520px"
    destroy-on-close
    :show-close="!submitting"
    :close-on-click-modal="!submitting"
    :close-on-press-escape="!submitting"
    @closed="resetForm"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-position="top"
      @submit.prevent
    >
      <el-form-item v-if="!isEdit" label="字典代码" prop="dictCode">
        <el-input
          v-model.trim="formData.dictCode"
          maxlength="20"
          show-word-limit
          clearable
          placeholder="请输入字典代码"
          @keyup.enter="handleSubmit"
        />
      </el-form-item>

      <el-form-item label="字典名称" prop="dictName">
        <el-input
          v-model.trim="formData.dictName"
          maxlength="20"
          show-word-limit
          clearable
          :placeholder="dictNamePlaceholder"
          @keyup.enter="handleSubmit"
        />
      </el-form-item>

      <el-form-item v-if="isChildEdit" label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio :value="1">启用</el-radio>
          <el-radio :value="0">禁用</el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item label="备注" prop="remark">
        <el-input
          v-model="formData.remark"
          type="textarea"
          :rows="3"
          maxlength="64"
          show-word-limit
          :placeholder="remarkPlaceholder"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button :disabled="submitting" @click="dialogVisible = false">取消</el-button>
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
  mode: {
    type: String,
    default: 'create',
  },
  level: {
    type: String,
    default: 'father',
  },
  dictData: {
    type: Object,
    default: null,
  },
  pid: {
    type: String,
    default: 'VMP',
  },
})

const emit = defineEmits(['update:modelValue', 'saved'])

const formRef = ref()
const submitting = ref(false)
const initialForm = ref(null)
let requestSequence = 0
const formData = reactive({
  dictCode: '',
  dictName: '',
  status: '',
  remark: '',
})

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})
const isEdit = computed(() => props.mode === 'edit')
const isChild = computed(() => props.level === 'child')
const isChildEdit = computed(() => isEdit.value && isChild.value)
const levelName = computed(() => (isChild.value ? '二级字典' : '一级字典'))
const dialogTitle = computed(() => `${isEdit.value ? '修改' : '新增'}${levelName.value}`)
const originalDictName = computed(() => String(props.dictData?.dictName || ''))
const originalRemark = computed(() => String(props.dictData?.remark || ''))
const dictNamePlaceholder = computed(() => {
  return isEdit.value ? originalDictName.value || '请输入字典名称' : '请输入字典名称'
})
const remarkPlaceholder = computed(() => {
  return isEdit.value ? originalRemark.value || '请输入备注（选填）' : '请输入备注（选填）'
})
const effectiveDictName = computed(() => {
  return formData.dictName.trim() || (isEdit.value ? originalDictName.value : '')
})
const effectiveRemark = computed(() => {
  return formData.remark.trim() || (isEdit.value ? originalRemark.value : '')
})
const isComplete = computed(() => {
  if (!effectiveDictName.value) {
    return false
  }
  if (!isEdit.value && !formData.dictCode.trim()) {
    return false
  }
  return !isChildEdit.value || formData.status === 0 || formData.status === 1
})
const hasChanged = computed(() => {
  if (!isEdit.value || !initialForm.value) {
    return true
  }

  return (
    effectiveDictName.value !== initialForm.value.dictName ||
    effectiveRemark.value !== initialForm.value.remark ||
    (isChildEdit.value && formData.status !== initialForm.value.status)
  )
})
const canSubmit = computed(() => isComplete.value && hasChanged.value && !submitting.value)
const dictCodeFormatMessage = '字典代码只能包含数字、英文字母和“_”，下划线不能位于首尾或连续出现，且长度不超过 20 位'
const dictNameFormatMessage = '字典名称只能包含中文、数字、英文字母、“-”、“_”和半角空格，特殊字符不能连续，且长度不超过 20 位'

const validateDictCode = (rule, value, callback) => {
  const dictCode = String(value || '').trim()
  if (!dictCode) {
    callback(new Error('请输入字典代码'))
    return
  }

  Verify.dictCode({ ...rule, message: dictCodeFormatMessage }, dictCode, callback)
}

const validateDictName = (rule, value, callback) => {
  const dictName = String(value || '').trim()
  if (!dictName) {
    if (isEdit.value) {
      callback()
      return
    }
    callback(new Error('请输入字典名称'))
    return
  }

  Verify.dictName({ ...rule, message: dictNameFormatMessage }, dictName, callback)
}

const formRules = {
  dictCode: [
    {
      validator: validateDictCode,
      trigger: 'blur',
    },
  ],
  dictName: [
    {
      validator: validateDictName,
      trigger: 'blur',
    },
  ],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
}

const fillForm = () => {
  const dictData = props.dictData || {}
  formData.dictCode = ''
  formData.dictName = ''
  formData.status = isChildEdit.value ? Number(dictData.status) : ''
  formData.remark = ''
  initialForm.value = isEdit.value
    ? {
        dictName: originalDictName.value,
        remark: originalRemark.value,
        status: isChildEdit.value ? formData.status : '',
      }
    : null
}

const resetForm = () => {
  requestSequence += 1
  formRef.value?.clearValidate()
  formData.dictCode = ''
  formData.dictName = ''
  formData.status = ''
  formData.remark = ''
  initialForm.value = null
  submitting.value = false
}

const handleSubmit = async () => {
  if (!canSubmit.value || submitting.value) {
    return
  }

  const requestId = ++requestSequence
  submitting.value = true
  const valid = await formRef.value?.validate().catch(() => false)
  if (requestId !== requestSequence) {
    return
  }
  if (!valid) {
    submitting.value = false
    return
  }

  const submitMode = props.mode
  const submitLevel = props.level
  const submitIsEdit = submitMode === 'edit'
  const submitIsChild = submitLevel === 'child'
  const params = {
    dictName: effectiveDictName.value,
    remark: effectiveRemark.value,
  }
  if (submitIsEdit) {
    if (submitIsChild) {
      params.status = formData.status
    }
  } else {
    params.dictCode = formData.dictCode.trim()
  }

  const url = submitIsEdit
    ? `/admin/updateDictData/${encodeURIComponent(props.dictData.dictId)}`
    : `/admin/newDictData/${encodeURIComponent(props.pid)}`
  const successMessage = submitIsEdit
    ? `${submitIsChild ? '二级字典' : '一级字典'}信息已保存`
    : `${submitIsChild ? '二级字典' : '一级字典'}新增成功`
  const savedPayload = {
    mode: submitMode,
    level: submitLevel,
    dictId: submitIsEdit ? (props.dictData?.dictId ?? '') : '',
    dictCode: submitIsEdit
      ? String(props.dictData?.dictCode ?? '')
      : params.dictCode,
  }
  const response = await Request({
    url,
    params,
    showLoading: false,
  })

  if (requestId !== requestSequence) {
    return
  }

  submitting.value = false
  if (response === null) {
    return
  }

  ElMessage.success(successMessage)
  dialogVisible.value = false
  emit('saved', savedPayload)
}

watch(
  dialogVisible,
  async (visible) => {
    if (!visible) {
      requestSequence += 1
      submitting.value = false
      return
    }

    fillForm()
    await nextTick()
    formRef.value?.clearValidate()
  },
)
</script>

<style scoped lang="scss"></style>
