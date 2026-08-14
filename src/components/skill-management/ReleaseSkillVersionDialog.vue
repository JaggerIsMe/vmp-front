<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="680px"
    top="4vh"
    class="release-skill-version-dialog"
    append-to-body
    destroy-on-close
    @closed="resetDialog"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-position="top"
      @submit.prevent
    >
      <el-form-item label="版本号" prop="versionName">
        <el-input
          v-model.trim="formData.versionName"
          maxlength="9"
          clearable
          placeholder="v0.0.0"
          @keyup.enter="handleRelease"
        />
      </el-form-item>

      <el-form-item label="备注" prop="remark">
        <el-input
          v-model="formData.remark"
          type="textarea"
          resize="none"
          :rows="3"
          maxlength="250"
          show-word-limit
          placeholder="请输入版本备注"
        />
      </el-form-item>

      <el-form-item label="版本文件" required :error="fileError">
        <ChunkFileUploader
          ref="uploaderRef"
          accept=".zip,application/zip"
          tip="仅支持.zip压缩文件，文件将自动分片并支持断点续传"
          :validate-file="validateZipArchive"
          @state-change="handleUploaderStateChange"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button :disabled="submitting" @click="visible = false">取消</el-button>
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
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import ChunkFileUploader from '@/components/common/ChunkFileUploader.vue'
import { CHUNK_UPLOAD_STATUS, validateZipArchive } from '@/utils/ChunkUpload'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  skill: { type: Object, default: null },
})
const emit = defineEmits(['update:modelValue', 'saved'])
const SKILL_VERSION_PATTERN = /^[vV]\d{1,2}\.\d{1,2}\.\d{1,2}$/
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})
const dialogTitle = computed(() => {
  const skillName = String(props.skill?.name || '').trim()
  return skillName ? `发布新版本 - ${skillName}` : '发布新版本'
})
const formRef = ref(null)
const uploaderRef = ref(null)
const submitting = ref(false)
const fileError = ref('')
const uploaderState = reactive({ status: 'empty', hasFile: false, canUpload: false })
const formData = reactive({ versionName: '', remark: '' })

const validateVersionName = (rule, value, callback) => {
  const versionName = String(value || '').trim()
  if (!versionName) {
    callback(new Error('请输入版本号'))
    return
  }
  if (!SKILL_VERSION_PATTERN.test(versionName)) {
    callback(new Error('版本号格式应为vxx.xx.xx或Vxx.xx.xx，每段数字最多两位'))
    return
  }
  callback()
}

const rules = {
  versionName: [{ validator: validateVersionName, trigger: ['blur', 'change'] }],
  remark: [
    { required: true, message: '请输入版本备注', trigger: 'blur' },
    { max: 250, message: '版本备注长度不能超过250位', trigger: 'change' },
  ],
}
const canSubmit = computed(() => {
  return Boolean(
    formData.versionName.trim() &&
    formData.remark.trim() &&
    uploaderState.canUpload &&
    !submitting.value,
  )
})

const handleUploaderStateChange = (state) => {
  Object.assign(uploaderState, state)
  if (state.hasFile) fileError.value = ''
}

const resetDialog = () => {
  formRef.value?.clearValidate()
  uploaderRef.value?.reset()
  Object.assign(formData, { versionName: '', remark: '' })
  Object.assign(uploaderState, { status: 'empty', hasFile: false, canUpload: false })
  fileError.value = ''
  submitting.value = false
}

const handleRelease = async () => {
  if (!uploaderState.hasFile) {
    fileError.value = '请选择ZIP版本文件'
  }
  if (!canSubmit.value) return

  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid || !props.skill?.skillId) return

  submitting.value = true
  try {
    const result = await uploaderRef.value.start({
      url: '/skill/releaseSkillVersion',
      params: {
        skillId: props.skill.skillId,
        versionName: formData.versionName.trim(),
        remark: formData.remark.trim(),
      },
    })

    if (result.status === CHUNK_UPLOAD_STATUS.PAUSED) return
    ElMessage.success('Skill新版本发布成功，文件正在处理中')
    emit('saved')
    visible.value = false
  } catch (error) {
    ElMessage.error(error?.message || 'Skill版本发布失败，请重试')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped lang="scss">
@use '@/assets/styles/release.skill.version.dialog.scss';
</style>
