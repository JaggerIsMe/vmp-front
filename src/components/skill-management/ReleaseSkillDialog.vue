<template>
  <el-dialog
    v-model="visible"
    title="发布Skill"
    width="620px"
    top="4vh"
    class="release-skill-dialog"
    append-to-body
    destroy-on-close
    @closed="resetForm"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-position="top"
      @submit.prevent
    >
      <el-form-item label="Skill名称" prop="name">
        <el-input
          v-model.trim="formData.name"
          maxlength="64"
          show-word-limit
          clearable
          placeholder="your-skill-name"
          @keyup.enter="handleRelease"
        />
      </el-form-item>

      <el-form-item label="描述" prop="description">
        <el-input
          v-model="formData.description"
          type="textarea"
          resize="none"
          :rows="4"
          maxlength="200"
          show-word-limit
          placeholder="请输入描述"
        />
      </el-form-item>

      <el-form-item label="备注" prop="remark">
        <el-input
          v-model="formData.remark"
          type="textarea"
          resize="none"
          :rows="3"
          maxlength="200"
          show-word-limit
          placeholder="请输入备注"
        />
      </el-form-item>

      <el-form-item label="平台" prop="platform">
        <el-select v-model="formData.platform" placeholder="请选择平台" filterable clearable>
          <el-option
            v-for="item in platformOptions"
            :key="item.dictId"
            :label="item.dictName"
            :value="String(item.dictCode ?? '')"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="部门" prop="dept">
        <el-select v-model="formData.dept" placeholder="请选择部门" filterable clearable>
          <el-option
            v-for="item in departmentOptions"
            :key="item.dictId"
            :label="item.dictName"
            :value="String(item.dictCode ?? '')"
          />
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button
        type="primary"
        :loading="submitting"
        :disabled="!canSubmit"
        @click="handleRelease"
      >
        发布
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import Request from '@/utils/Request'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  platformOptions: { type: Array, default: () => [] },
  departmentOptions: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:modelValue', 'saved'])
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})
const formRef = ref(null)
const submitting = ref(false)
const formData = reactive({ name: '', description: '', remark: '', platform: '', dept: '' })

const validateSkillName = (rule, value, callback) => {
  const name = String(value || '').trim()
  if (!name) {
    callback(new Error('请输入Skill名称'))
    return
  }
  if (name.length > 64 || !/^[a-z0-9-]+$/.test(name)) {
    callback(new Error('Skill名称只能包含小写字母、数字和连字符，且长度不超过64位'))
    return
  }
  callback()
}

const rules = {
  name: [{ validator: validateSkillName, trigger: ['blur', 'change'] }],
  description: [{ max: 200, message: '描述长度不能超过200位', trigger: 'change' }],
  remark: [{ max: 200, message: '备注长度不能超过200位', trigger: 'change' }],
  platform: [{ required: true, message: '请选择平台', trigger: 'change' }],
  dept: [{ required: true, message: '请选择部门', trigger: 'change' }],
}
const canSubmit = computed(() => {
  return Boolean(formData.name.trim() && formData.platform && formData.dept) && !submitting.value
})

const resetForm = () => {
  formRef.value?.clearValidate()
  Object.assign(formData, { name: '', description: '', remark: '', platform: '', dept: '' })
  submitting.value = false
}

const handleRelease = async () => {
  if (!canSubmit.value) return
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  const response = await Request({
    url: '/skill/releaseSkill',
    params: {
      name: formData.name.trim(),
      description: formData.description,
      remark: formData.remark,
      platform: formData.platform,
      dept: formData.dept,
    },
    showLoading: false,
  }).finally(() => {
    submitting.value = false
  })

  if (!response) return
  ElMessage.success('Skill发布成功')
  emit('saved')
  visible.value = false
}

watch(visible, (isVisible) => {
  if (isVisible) resetForm()
})
</script>

<style scoped lang="scss">
@use '@/assets/styles/release.skill.dialog.scss';
</style>
