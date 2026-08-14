<template>
  <div class="chunk-file-uploader">
    <el-upload
      v-if="!fileItem.file"
      drag
      :auto-upload="false"
      :show-file-list="false"
      :accept="accept"
      :disabled="busy"
      :on-change="handleFileChange"
    >
      <el-icon class="chunk-file-uploader__icon"><UploadFilled /></el-icon>
      <div class="el-upload__text">拖拽文件到此处，或<em>点击选择</em></div>
      <template #tip>
        <div class="el-upload__tip">{{ tip }}</div>
      </template>
    </el-upload>

    <div v-else class="chunk-file-task">
      <div class="chunk-file-task__header">
        <div class="chunk-file-task__identity">
          <el-icon><Document /></el-icon>
          <div>
            <strong :title="fileItem.file.name">{{ fileItem.file.name }}</strong>
            <span>{{ formatSize(fileItem.file.size) }}</span>
          </div>
        </div>
        <el-button
          v-if="!busy"
          type="danger"
          text
          :icon="Delete"
          @click="reset"
        >
          移除
        </el-button>
        <el-button
          v-else-if="fileItem.status === UPLOADER_STATUS.UPLOADING"
          type="warning"
          text
          :icon="VideoPause"
          @click="pause"
        >
          暂停
        </el-button>
      </div>

      <el-progress
        :percentage="displayProgress"
        :status="progressStatus"
        :stroke-width="10"
      />
      <div class="chunk-file-task__status">
        <span>{{ statusText }}</span>
        <small v-if="fileItem.status === UPLOADER_STATUS.UPLOADING">
          {{ formatSize(fileItem.uploadedBytes) }} / {{ formatSize(fileItem.file.size) }}
        </small>
        <small v-else-if="fileItem.md5">MD5：{{ fileItem.md5 }}</small>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { Delete, Document, UploadFilled, VideoPause } from '@element-plus/icons-vue'
import Request from '@/utils/Request'
import { CHUNK_UPLOAD_STATUS, createChunkUploadClient } from '@/utils/ChunkUpload'

const props = defineProps({
  accept: { type: String, default: '' },
  tip: { type: String, default: '请选择需要上传的文件' },
  validateFile: { type: Function, default: null },
})
const emit = defineEmits(['state-change'])

const UPLOADER_STATUS = Object.freeze({
  EMPTY: 'empty',
  HASHING: 'hashing',
  READY: 'ready',
  UPLOADING: 'uploading',
  PAUSED: 'paused',
  ERROR: 'error',
  SUCCESS: 'success',
})
const client = createChunkUploadClient({ request: Request })
const fileItem = reactive({
  file: null,
  md5: '',
  status: UPLOADER_STATUS.EMPTY,
  md5Progress: 0,
  uploadProgress: 0,
  uploadedBytes: 0,
  errorMessage: '',
})
let selectionId = 0
let pauseRequested = false

const busy = computed(() => {
  return fileItem.status === UPLOADER_STATUS.HASHING || fileItem.status === UPLOADER_STATUS.UPLOADING
})
const displayProgress = computed(() => {
  return fileItem.status === UPLOADER_STATUS.HASHING ? fileItem.md5Progress : fileItem.uploadProgress
})
const progressStatus = computed(() => {
  if (fileItem.status === UPLOADER_STATUS.SUCCESS) return 'success'
  if (fileItem.status === UPLOADER_STATUS.ERROR) return 'exception'
  return undefined
})
const statusText = computed(() => {
  const textMap = {
    [UPLOADER_STATUS.HASHING]: '正在计算文件MD5',
    [UPLOADER_STATUS.READY]: '文件校验完成，等待发布',
    [UPLOADER_STATUS.UPLOADING]: '正在分片上传',
    [UPLOADER_STATUS.PAUSED]: '上传已暂停，可点击发布继续',
    [UPLOADER_STATUS.ERROR]: fileItem.errorMessage || '上传失败，可点击发布重试',
    [UPLOADER_STATUS.SUCCESS]: '文件上传完成',
  }
  return textMap[fileItem.status] || '请选择文件'
})

const emitState = () => {
  emit('state-change', {
    status: fileItem.status,
    hasFile: Boolean(fileItem.file),
    canUpload: Boolean(fileItem.file && fileItem.md5) && [
      UPLOADER_STATUS.READY,
      UPLOADER_STATUS.PAUSED,
      UPLOADER_STATUS.ERROR,
    ].includes(fileItem.status),
  })
}

const reset = () => {
  selectionId += 1
  pauseRequested = true
  Object.assign(fileItem, {
    file: null,
    md5: '',
    status: UPLOADER_STATUS.EMPTY,
    md5Progress: 0,
    uploadProgress: 0,
    uploadedBytes: 0,
    errorMessage: '',
  })
  emitState()
}

const handleFileChange = async (uploadFile) => {
  const file = uploadFile?.raw
  if (!file) return
  const currentSelectionId = ++selectionId
  pauseRequested = false
  Object.assign(fileItem, {
    file,
    md5: '',
    status: UPLOADER_STATUS.HASHING,
    md5Progress: 0,
    uploadProgress: 0,
    uploadedBytes: 0,
    errorMessage: '',
  })
  emitState()

  try {
    await props.validateFile?.(file)
    const md5 = await client.hashFile(file, {
      onProgress: (percentage) => {
        if (currentSelectionId === selectionId) fileItem.md5Progress = percentage
      },
    })
    if (currentSelectionId !== selectionId) return
    fileItem.md5 = md5
    fileItem.status = UPLOADER_STATUS.READY
    emitState()
  } catch (error) {
    if (currentSelectionId !== selectionId) return
    fileItem.errorMessage = error?.message || '文件解析失败'
    ElMessage.error(fileItem.errorMessage)
    reset()
  }
}

const pause = () => {
  pauseRequested = true
}

const start = async ({ url, params }) => {
  if (!fileItem.file || !fileItem.md5) throw new Error('请先选择并完成文件校验')
  pauseRequested = false
  fileItem.status = UPLOADER_STATUS.UPLOADING
  fileItem.errorMessage = ''
  emitState()

  try {
    const result = await client.upload({
      file: fileItem.file,
      fileMd5: fileItem.md5,
      url,
      params,
      shouldPause: () => pauseRequested,
      onProgress: ({ percentage, uploadedBytes }) => {
        fileItem.uploadProgress = percentage
        fileItem.uploadedBytes = uploadedBytes
      },
    })

    if (result.status === CHUNK_UPLOAD_STATUS.PAUSED) {
      fileItem.status = UPLOADER_STATUS.PAUSED
    } else {
      fileItem.status = UPLOADER_STATUS.SUCCESS
      fileItem.uploadProgress = 100
      fileItem.uploadedBytes = fileItem.file.size
    }
    emitState()
    return result
  } catch (error) {
    fileItem.status = UPLOADER_STATUS.ERROR
    fileItem.errorMessage = error?.message || '文件上传失败，请重试'
    emitState()
    throw error
  }
}

const formatSize = (size) => {
  const bytes = Number(size || 0)
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(2)} KB`
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(2)} MB`
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`
}

defineExpose({ start, reset })
</script>

<style scoped lang="scss">
@use '@/assets/styles/chunk.file.uploader.scss';
</style>
