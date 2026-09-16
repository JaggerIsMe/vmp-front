import SparkMD5 from 'spark-md5'

export const CHUNK_UPLOAD_STATUS = Object.freeze({
  EMPTY: 'empty',
  HASHING: 'hashing',
  READY: 'ready',
  UPLOADING: 'uploading',
  PAUSED: 'paused',
  FINISHED: 'finished',
  ERROR: 'error',
})

const DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024
const ZIP_SIGNATURES = ['504b0304', '504b0506', '504b0708']

const getDefaultStorage = () => {
  if (typeof localStorage === 'undefined') return null
  return localStorage
}

const buildResumeKey = ({ url, file, fileMd5 }) => [
  'chunk-upload',
  url,
  fileMd5,
  file.name || '',
  file.size,
  file.lastModified || 0,
].join(':')

const readResumeState = (storage, key) => {
  if (!storage) return null
  try {
    return JSON.parse(storage.getItem(key) || 'null')
  } catch {
    storage.removeItem(key)
    return null
  }
}

const writeResumeState = (storage, key, state) => {
  if (!storage) return
  storage.setItem(key, JSON.stringify(state))
}

const clearResumeState = (storage, key) => storage?.removeItem(key)

export const validateZipArchive = async (file) => {
  if (!file || !/\.zip$/i.test(file.name || '')) {
    throw new Error('只能上传.zip压缩文件')
  }

  const bytes = new Uint8Array(await file.slice(0, 4).arrayBuffer())
  const signature = Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('')
  if (!ZIP_SIGNATURES.includes(signature)) {
    throw new Error('文件不是有效的ZIP压缩包')
  }

  return true
}

export const createChunkUploadClient = ({
  request,
  chunkSize = DEFAULT_CHUNK_SIZE,
  storage = getDefaultStorage(),
} = {}) => {
  if (typeof request !== 'function') throw new TypeError('request必须是函数')
  if (!Number.isFinite(chunkSize) || chunkSize <= 0) throw new TypeError('chunkSize必须大于0')

  const hashFile = async (file, { onProgress } = {}) => {
    const chunks = Math.max(1, Math.ceil(file.size / chunkSize))
    const spark = new SparkMD5.ArrayBuffer()

    for (let chunkIndex = 0; chunkIndex < chunks; chunkIndex += 1) {
      const start = chunkIndex * chunkSize
      const buffer = await file.slice(start, Math.min(start + chunkSize, file.size)).arrayBuffer()
      spark.append(buffer)
      onProgress?.(Math.round(((chunkIndex + 1) / chunks) * 100))
    }

    return spark.end()
  }

  const upload = async ({
    file,
    fileMd5,
    url,
    params = {},
    shouldPause = () => false,
    onProgress,
    onChunkComplete,
  }) => {
    if (!file || !fileMd5 || !url) throw new Error('缺少分片上传参数')

    const chunks = Math.max(1, Math.ceil(file.size / chunkSize))
    const resumeKey = buildResumeKey({ url, file, fileMd5 })
    const savedState = readResumeState(storage, resumeKey) || {}
    let fileId = savedState.fileId || ''
    let nextChunkIndex = Math.min(Number(savedState.nextChunkIndex) || 0, chunks)
    let lastResult = { fileId, status: CHUNK_UPLOAD_STATUS.UPLOADING }

    while (nextChunkIndex < chunks) {
      if (shouldPause()) {
        return { ...lastResult, status: CHUNK_UPLOAD_STATUS.PAUSED }
      }

      const start = nextChunkIndex * chunkSize
      const chunk = file.slice(start, Math.min(start + chunkSize, file.size))
      const response = await request({
        url,
        params: {
          ...params,
          file: chunk,
          fileId,
          fileMd5,
          fileName: file.name || '',
          fileSize: file.size,
          chunkIndex: nextChunkIndex,
          chunkSize: chunk.size,
          chunks,
        },
        showLoading: false,
      })

      if (!response) throw new Error('分片上传失败')
      lastResult = response.data || response
      fileId = lastResult.fileId || fileId
      nextChunkIndex += 1
      onChunkComplete?.(lastResult)
      onProgress?.(Math.round((nextChunkIndex / chunks) * 100))

      if (lastResult.status === CHUNK_UPLOAD_STATUS.FINISHED) {
        clearResumeState(storage, resumeKey)
        return lastResult
      }

      writeResumeState(storage, resumeKey, { fileId, nextChunkIndex })
    }

    clearResumeState(storage, resumeKey)
    return { ...lastResult, fileId, status: lastResult.status || CHUNK_UPLOAD_STATUS.FINISHED }
  }

  return { hashFile, upload }
}
