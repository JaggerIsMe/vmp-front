import axios from 'axios'
import { ElLoading } from 'element-plus'
import router from '@/router'
import Message from '@/utils/Message'

// 封装 HTTP 请求，统一适配后端 ResponseVO: { status, code, info, data }
const contentTypeForm = 'application/x-www-form-urlencoded;charset=UTF-8'
const contentTypeJson = 'application/json;charset=UTF-8'
const responseTypeJson = 'json'
const sessionExpiredCodes = [901, 902]

let loading = null
let loadingCount = 0

const instance = axios.create({
  baseURL: '/api',
  timeout: 30 * 1000,
  withCredentials: true,
})

const openLoading = () => {
  loadingCount += 1

  if (!loading) {
    loading = ElLoading.service({
      lock: true,
      text: '加载中...',
      background: 'rgba(0, 0, 0, 0.7)',
    })
  }
}

const closeLoading = () => {
  if (loadingCount > 0) {
    loadingCount -= 1
  }

  if (loadingCount === 0 && loading) {
    loading.close()
    loading = null
  }
}

const isPlainObject = (value) => {
  return Object.prototype.toString.call(value) === '[object Object]'
}

const isFileLike = (value) => {
  const isBlob = typeof Blob !== 'undefined' && value instanceof Blob
  const isFile = typeof File !== 'undefined' && value instanceof File
  return isBlob || isFile
}

const normalizeValue = (value) => {
  if (value === undefined || value === null) {
    return ''
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  if (isPlainObject(value)) {
    return JSON.stringify(value)
  }

  return value
}

const appendValue = (target, key, value) => {
  if (Array.isArray(value)) {
    value.forEach((item) => appendValue(target, key, item))
    return
  }

  target.append(key, normalizeValue(value))
}

const buildFormData = (params) => {
  if (params instanceof FormData) {
    return params
  }

  const formData = new FormData()
  Object.keys(params || {}).forEach((key) => {
    appendValue(formData, key, params[key])
  })

  return formData
}

const buildUrlSearchParams = (params) => {
  const searchParams = new URLSearchParams()
  Object.keys(params || {}).forEach((key) => {
    appendValue(searchParams, key, params[key])
  })

  return searchParams
}

const hasFile = (params) => {
  if (params instanceof FormData) {
    return true
  }

  return Object.values(params || {}).some((value) => {
    if (Array.isArray(value)) {
      return value.some((item) => isFileLike(item))
    }

    return isFileLike(value)
  })
}

const buildRequestData = (params, dataType) => {
  if (dataType === 'json') {
    return {
      data: params || {},
      headers: {
        'Content-Type': contentTypeJson,
      },
    }
  }

  if (dataType === 'form') {
    return {
      data: buildUrlSearchParams(params),
      headers: {
        'Content-Type': contentTypeForm,
      },
    }
  }

  return {
    data: buildFormData(params),
    // FormData 由浏览器自动补 boundary，不手动设置 Content-Type。
    headers: hasFile(params) ? {} : {},
  }
}

const redirectToLogin = () => {
  const currentRoute = router.currentRoute.value
  const redirectUrl = encodeURIComponent(currentRoute.fullPath || currentRoute.path || '/')
  const loginPath = `/login?redirectUrl=${redirectUrl}`

  if (router.resolve('/login').matched.length > 0) {
    router.push(loginPath)
  }
}

// 请求前拦截器
instance.interceptors.request.use(
  (config) => {
    if (config.showLoading) {
      openLoading()
    }

    return config
  },
  (error) => {
    if (error.config?.showLoading) {
      closeLoading()
    }

    Message.error('请求发送失败')
    return Promise.reject({ showError: false, msg: '请求发送失败', origin: error })
  },
)

// 请求后拦截器
instance.interceptors.response.use(
  (response) => {
    const {
      showLoading,
      errorCallback,
      showError = true,
      responseType,
    } = response.config

    if (showLoading) {
      closeLoading()
    }

    const responseData = response.data
    if (responseType === 'arraybuffer' || responseType === 'blob') {
      return responseData
    }

    if (responseData?.code === 200 || responseData?.status === 'success') {
      return responseData
    }

    const msg = responseData?.info || responseData?.message || '请求失败'

    if (sessionExpiredCodes.includes(responseData?.code)) {
      redirectToLogin()
      return Promise.reject({ showError: false, msg, data: responseData })
    }

    if (typeof errorCallback === 'function') {
      errorCallback(msg, responseData)
    }

    return Promise.reject({ showError, msg, data: responseData })
  },
  (error) => {
    if (error.config?.showLoading) {
      closeLoading()
    }

    const { showError = true } = error.config || {}
    const responseData = error.response?.data
    const msg = responseData?.info || responseData?.message || '网络异常'

    return Promise.reject({ showError, msg, data: responseData, origin: error })
  },
)

const request = (config) => {
  const {
    url,
    params = {},
    dataType = 'formData',
    method = 'post',
    showLoading = true,
    showError = true,
    responseType = responseTypeJson,
    headers = {},
  } = config

  const requestMethod = method.toLowerCase()
  const axiosConfig = {
    url,
    method: requestMethod,
    responseType,
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      ...headers,
    },
    showLoading,
    showError,
    errorCallback: config.errorCallback,
    onUploadProgress: (event) => {
      if (typeof config.uploadProgressCallback === 'function') {
        config.uploadProgressCallback(event)
      }
    },
  }

  if (requestMethod === 'get' || requestMethod === 'delete') {
    axiosConfig.params = params
  } else {
    const { data, headers: requestHeaders } = buildRequestData(params, dataType)
    axiosConfig.data = data
    axiosConfig.headers = {
      ...axiosConfig.headers,
      ...requestHeaders,
    }
  }

  return instance(axiosConfig).catch((error) => {
    if (error.showError !== false) {
      Message.error(error.msg || '网络异常')
    }

    return null
  })
}

export default request
