export const SKILL_TEMPLATE_VERSION_ID = 'template'

const buildDownloadUrl = (code) => `/api/skill/downloadSkill/${encodeURIComponent(code)}`

const triggerBrowserDownload = (code, documentRef) => {
  if (!documentRef?.body || typeof documentRef.createElement !== 'function') {
    throw new Error('当前环境不支持Skill文件下载')
  }

  const downloadUrl = buildDownloadUrl(code)
  const link = documentRef.createElement('a')
  link.href = downloadUrl
  link.download = ''
  link.style.display = 'none'
  documentRef.body.appendChild(link)

  try {
    link.click()
  } finally {
    link.remove()
  }

  return downloadUrl
}

export const downloadSkillFile = async (versionId, options = {}) => {
  const normalizedVersionId = String(versionId || '').trim()
  if (!normalizedVersionId) throw new Error('缺少Skill版本信息')

  const { request, documentRef = globalThis.document } = options
  if (typeof request !== 'function') throw new Error('Skill下载请求方法不可用')

  const response = await request({
    url: `/skill/createDownloadUrl4Skill/${encodeURIComponent(normalizedVersionId)}`,
    method: 'get',
    showLoading: false,
  })
  if (!response) return null

  const code = String(response.data || '').trim()
  if (!code) throw new Error('未获取到Skill下载码')

  return {
    code,
    url: triggerBrowserDownload(code, documentRef),
  }
}
