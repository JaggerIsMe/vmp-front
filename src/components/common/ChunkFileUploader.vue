<template>
  <div class="chunk-file-uploader">
    <el-upload
      ref="uploadRef"
      :accept="accept"
      :auto-upload="false"
      :limit="1"
      :file-list="fileList"
      :on-change="handleFileChange"
      :on-remove="handleFileRemove"
      :on-exceed="handleExceed"
    >
      <el-button type="primary" plain :disabled="isBusy">选择文件</el-button>
      <template #tip>
        <div v-if="tip" class="chunk-file-uploader__tip">{{ tip }}</div>
      </template>
    </el-upload>

    <el-progress
      v-if="state.hasFile"
      class="chunk-file-uploader__progress"
      :percentage="progress"
      :status="progressStatus"
    />

    <div v-if="state.status === CHUNK_UPLOAD_STATUS.UPLOADING" class="chunk-file-uploader__actions">
      <el-button @click="pause">暂停上传</el-button>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import Request from '@/utils/Request'
import { CHUNK_UPLOAD_STATUS, createChunkUploadClient } from '@/utils/ChunkUpload'

const props = defineProps({
  accept: { type: String, default: '' },
  tip: { type: String, default: '' },
  validateFile: { type: Function, default: null },
  chunkSize: { type: Number, default: undefined },
})
const emit = defineEmits(['state-change'])

const uploadRef = ref(null)
const fileList = ref([])
const selectedFile = ref(null)
const progress = ref(0)
const paused = ref(false)
const state = reactive({ status: CHUNK_UPLOAD_STATUS.EMPTY, hasFile: false, canUpload: false })
const client = createChunkUploadClient({ request: Request, chunkSize: props.chunkSize })
const isBusy = computed(() => [CHUNK_UPLOAD_STATUS.HASHING, CHUNK_UPLOAD_STATUS.UPLOADING].includes(state.status))
const progressStatus = computed(() => state.status === CHUNK_UPLOAD_STATUS.ERROR ? 'exception' : undefined)

const updateState = (patch) => {
  Object.assign(state, patch)
  emit('state-change', { ...state, progress: progress.value })
}

const setFile = async (file) => {
  const rawFile = file?.raw || file
  try {
    if (props.validateFile) await props.validateFile(rawFile)
    selectedFile.value = rawFile
    fileList.value = file ? [file] : []
    progress.value = 0
    updateState({ status: CHUNK_UPLOAD_STATUS.READY, hasFile: true, canUpload: true })
  } catch (error) {
    reset()
    ElMessage.error(error?.message || '文件校验失败')
  }
}

const handleFileChange = (file) => setFile(file)
const handleFileRemove = () => reset()
const handleExceed = (files) => {
  uploadRef.value?.clearFiles()
  setFile({ name: files[0]?.name, raw: files[0] })
}

const pause = () => {
  paused.value = true
}

const start = async ({ url, params = {} }) => {
  if (!selectedFile.value) throw new Error('请先选择文件')
  paused.value = false
  progress.value = 0
  updateState({ status: CHUNK_UPLOAD_STATUS.HASHING, hasFile: true, canUpload: false })

  try {
    const fileMd5 = await client.hashFile(selectedFile.value, {
      onProgress: (value) => { progress.value = Math.round(value * 0.2) },
    })
    updateState({ status: CHUNK_UPLOAD_STATUS.UPLOADING, hasFile: true, canUpload: false })
    const result = await client.upload({
      file: selectedFile.value,
      fileMd5,
      url,
      params,
      shouldPause: () => paused.value,
      onProgress: (value) => { progress.value = 20 + Math.round(value * 0.8) },
    })

    if (result.status === CHUNK_UPLOAD_STATUS.PAUSED) {
      updateState({ status: CHUNK_UPLOAD_STATUS.PAUSED, hasFile: true, canUpload: true })
      return result
    }

    progress.value = 100
    updateState({ status: CHUNK_UPLOAD_STATUS.FINISHED, hasFile: true, canUpload: false })
    return result
  } catch (error) {
    updateState({ status: CHUNK_UPLOAD_STATUS.ERROR, hasFile: true, canUpload: true })
    throw error
  }
}

function reset() {
  paused.value = false
  progress.value = 0
  selectedFile.value = null
  fileList.value = []
  uploadRef.value?.clearFiles()
  updateState({ status: CHUNK_UPLOAD_STATUS.EMPTY, hasFile: false, canUpload: false })
}

defineExpose({ start, pause, reset })
</script>

<style scoped lang="scss">
@use '@/assets/styles/chunk.file.uploader.scss';
</style>
