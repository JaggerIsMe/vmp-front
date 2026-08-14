import SparkMD5 from 'spark-md5'

export const DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024

export const CHUNK_UPLOAD_STATUS = Object.freeze({
  UPLOADING: 'uploading',
  FINISHED: 'upload_finish',
  INSTANT: 'upload_seconds',
  PAUSED: 'paused',
})

const ZIP_LOCAL_FILE_HEADER = [0x50, 0x4b, 0x03, 0x04]

const getDefaultStorage = () => {
  return typeof localStorage === 'undefined' ? null : localStorage
}

const readCheckpoint = (storage, key) => {
  if (!storage) return null
  try {
    const value = JSON.parse(storage.getItem(key))
    return value && Number.isInteger(value.nextChunk) ? value : null
  } catch {
    return null
  }
}

const writeCheckpoint = (storage, key, value) => {
  if (!storage) return
  try {
    storage.setItem(key, JSON.stringify(value))
  } catch {
    // 浏览器禁用本地存储时仍允许本次会话继续上传。
  }
}

const removeCheckpoint = (storage, key) => {
  if (!storage) return
  try {
    storage.removeItem(key)
  } catch {
    // 检查点清理失败不影响已经完成的上传结果。
  }
}

const stableParams = (params = {}) => {
  return Object.keys(params)
    .sort()
    .reduce((result, key) => {
      result[key] = params[key]
      return result
    }, {})
}

const buildCheckpointKey = ({ url, file, fileMd5, params }) => {
  const identity = JSON.stringify({
    url,
    fileName: file.name,
    fileSize: file.size,
    fileMd5,
    params: stableParams(params),
  })
  return `vmp:chunk-upload:${SparkMD5.hash(identity)}`
}

const createChunkFile = (file, start, end) => {
  const blob = file.slice(start, end, file.type)
  if (typeof File === 'undefined') return blob
  return new File([blob], file.name, {
    type: file.type || 'application/zip',
    lastModified: file.lastModified,
  })
}

export const validateZipArchive = async (file) => {
  if (!file || file.size <= 0) {
    throw new Error('请选择非空的ZIP压缩文件')
  }
  if (!String(file.name || '').toLowerCase().endsWith('.zip')) {
    throw new Error('只能上传.zip压缩文件')
  }

  const header = new Uint8Array(await file.slice(0, 4).arrayBuffer())
  const validHeader = ZIP_LOCAL_FILE_HEADER.every((value, index) => header[index] === value)
  if (!validHeader) {
    throw new Error('文件内容不是有效的ZIP压缩文件')
  }
  return true
}

export const createChunkUploadClient = ({
  request,
  storage = getDefaultStorage(),
  chunkSize = DEFAULT_CHUNK_SIZE,
} = {}) => {
  if (typeof request !== 'function') {
    throw new TypeError('分片上传模块需要提供请求适配器')
  }
  if (!Number.isFinite(chunkSize) || chunkSize <= 0) {
    throw new TypeError('分片大小必须是正数')
  }

  const hashFile = async (file, { onProgress } = {}) => {
    const chunks = Math.max(1, Math.ceil(file.size / chunkSize))
    const spark = new SparkMD5.ArrayBuffer()

    for (let index = 0; index < chunks; index += 1) {
      const start = index * chunkSize
      const end = Math.min(file.size, start + chunkSize)
      spark.append(await file.slice(start, end).arrayBuffer())
      onProgress?.(Math.round(((index + 1) / chunks) * 100))
    }

    const md5 = spark.end()
    spark.destroy()
    return md5
  }

  const upload = async ({
    file,
    fileMd5,
    url,
    params = {},
    onProgress,
    shouldPause = () => false,
  }) => {
    if (!file || !fileMd5 || !url) {
      throw new Error('缺少分片上传所需参数')
    }

    const chunks = Math.max(1, Math.ceil(file.size / chunkSize))
    const checkpointKey = buildCheckpointKey({ url, file, fileMd5, params })
    const checkpoint = readCheckpoint(storage, checkpointKey)
    let fileId = checkpoint?.fileId || ''
    let nextChunk = checkpoint?.nextChunk || 0

    if (nextChunk < 0 || nextChunk >= chunks) {
      nextChunk = 0
      fileId = ''
      removeCheckpoint(storage, checkpointKey)
    }

    onProgress?.({
      percentage: Math.floor((Math.min(nextChunk * chunkSize, file.size) / file.size) * 100),
      uploadedBytes: Math.min(nextChunk * chunkSize, file.size),
      totalBytes: file.size,
      chunkIndex: nextChunk,
      chunks,
    })

    for (let index = nextChunk; index < chunks; index += 1) {
      if (shouldPause()) {
        return { fileId, status: CHUNK_UPLOAD_STATUS.PAUSED, nextChunk: index, chunks }
      }

      const start = index * chunkSize
      const end = Math.min(file.size, start + chunkSize)
      const chunkFile = createChunkFile(file, start, end)
      let serverErrorMessage = ''
      const response = await request({
        url,
        params: {
          ...params,
          file: chunkFile,
          fileMd5,
          fileId,
          chunkIndex: index,
          chunks,
        },
        showLoading: false,
        showError: false,
        errorCallback: (message) => {
          serverErrorMessage = message
        },
        uploadProgressCallback: (event) => {
          const chunkLoaded = Math.min(Number(event.loaded || 0), end - start)
          const uploadedBytes = Math.min(start + chunkLoaded, file.size)
          onProgress?.({
            percentage: Math.floor((uploadedBytes / file.size) * 100),
            uploadedBytes,
            totalBytes: file.size,
            chunkIndex: index,
            chunks,
          })
        },
      })

      if (!response?.data) {
        if (serverErrorMessage) removeCheckpoint(storage, checkpointKey)
        throw new Error(serverErrorMessage || '分片上传失败，请重试')
      }

      fileId = response.data.fileId || fileId
      const status = response.data.status
      if (status === CHUNK_UPLOAD_STATUS.FINISHED || status === CHUNK_UPLOAD_STATUS.INSTANT) {
        removeCheckpoint(storage, checkpointKey)
        onProgress?.({
          percentage: 100,
          uploadedBytes: file.size,
          totalBytes: file.size,
          chunkIndex: index,
          chunks,
        })
        return { fileId, status, nextChunk: chunks, chunks }
      }
      if (status !== CHUNK_UPLOAD_STATUS.UPLOADING) {
        throw new Error('服务端返回了未知的上传状态')
      }

      nextChunk = index + 1
      writeCheckpoint(storage, checkpointKey, { fileId, nextChunk })
      onProgress?.({
        percentage: Math.floor((Math.min(nextChunk * chunkSize, file.size) / file.size) * 100),
        uploadedBytes: Math.min(nextChunk * chunkSize, file.size),
        totalBytes: file.size,
        chunkIndex: index,
        chunks,
      })
    }

    throw new Error('文件上传未正常完成')
  }

  return { hashFile, upload }
}
