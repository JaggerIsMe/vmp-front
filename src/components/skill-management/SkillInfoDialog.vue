<template>
  <el-dialog
    v-model="visible"
    title="修改Skill信息"
    width="620px"
    top="4vh"
    class="skill-info-dialog"
    append-to-body
    destroy-on-close
    @closed="handleClosed"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-position="top"
      @submit.prevent
    >
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
          <el-option v-for="item in platformOptions" :key="item.dictId" :label="item.dictName" :value="String(item.dictCode ?? '')" />
        </el-select>
      </el-form-item>
      <el-form-item label="部门" prop="dept">
        <el-select v-model="formData.dept" placeholder="请选择部门" filterable clearable>
          <el-option v-for="item in departmentOptions" :key="item.dictId" :label="item.dictName" :value="String(item.dictCode ?? '')" />
        </el-select>
      </el-form-item>
      <el-form-item label="状态" prop="status">
        <el-radio-group v-model="formData.status">
          <el-radio
            v-for="item in statusOptions"
            :key="item.value"
            :value="item.value"
            :disabled="statusLocked || item.value === 2 || item.value === 3"
          >
            {{ item.label }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" :disabled="!hasChanged" @click="handleSave">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import Request from '@/utils/Request'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  skill: { type: Object, default: null },
  platformOptions: { type: Array, default: () => [] },
  departmentOptions: { type: Array, default: () => [] },
  statusOptions: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:modelValue', 'saved'])
const visible = computed({ get: () => props.modelValue, set: (value) => emit('update:modelValue', value) })
const formRef = ref(null)
const submitting = ref(false)
const formData = reactive({ description: '', remark: '', platform: '', dept: '', status: 0 })
const initialData = ref('')
const statusLocked = computed(() => {
  const originalStatus = Number(props.skill?.status)
  return originalStatus === 2 || originalStatus === 3
})
const rules = {
  platform: [{ required: true, message: '请选择平台', trigger: 'change' }],
  dept: [{ required: true, message: '请选择部门', trigger: 'change' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
}
const snapshot = () => JSON.stringify({
  description: formData.description,
  remark: formData.remark,
  platform: formData.platform,
  dept: formData.dept,
  status: formData.status,
})
const hasChanged = computed(() => Boolean(props.skill?.skillId) && snapshot() !== initialData.value)

const fillForm = () => {
  Object.assign(formData, {
    description: props.skill?.description || '', remark: props.skill?.remark || '',
    platform: props.skill?.platform || '', dept: props.skill?.dept || '', status: Number(props.skill?.status ?? 0),
  })
  initialData.value = snapshot()
}
watch(() => props.modelValue, (value) => { if (value) fillForm() })

const handleSave = async () => {
  if (!hasChanged.value || submitting.value) return
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  const response = await Request({
    url: `/skill/updateSkillInfo/${encodeURIComponent(props.skill.skillId)}`,
    params: {
      description: formData.description,
      remark: formData.remark,
      platform: formData.platform,
      dept: formData.dept,
      status: formData.status,
    },
    showLoading: false,
  }).finally(() => { submitting.value = false })
  if (!response) return
  ElMessage.success('Skill基础信息修改成功')
  emit('saved')
  visible.value = false
}
const handleClosed = () => { submitting.value = false; formRef.value?.clearValidate() }
</script>

<style scoped lang="scss">
@use '@/assets/styles/skill.info.dialog.scss';
</style>
