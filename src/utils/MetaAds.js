const hasValue = (value) => value !== '' && value !== null && value !== undefined

const toFiniteNumber = (value) => {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : 0
}

// Meta Campaign.EffectiveStatus: https://github.com/facebook/facebook-nodejs-business-sdk/blob/main/src/objects/campaign.js
export const META_ADS_CAMPAIGN_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: '已启用', tagType: 'success' },
  { value: 'PAUSED', label: '已暂停', tagType: 'warning' },
  { value: 'ARCHIVED', label: '已归档', tagType: 'info' },
  { value: 'DELETED', label: '已删除', tagType: 'danger' },
  { value: 'IN_PROCESS', label: '处理中', tagType: 'info' },
  { value: 'WITH_ISSUES', label: '存在问题', tagType: 'danger' },
]

// 与后端 MetaAdsAccountStatusEnum 保持一致，其他值在表格中按原值展示。
export const META_ADS_ACCOUNT_STATUS_OPTIONS = [
  { value: 1, label: '活跃', tagType: 'success' },
  { value: 2, label: '已停用', tagType: 'danger' },
]

export const getMetaAdsAccountStatusOption = (status) =>
  META_ADS_ACCOUNT_STATUS_OPTIONS.find((option) => option.value === Number(status))

export const buildMetaAdsCommonParams = (queryForm = {}) => {
  if (!Array.isArray(queryForm.dateRange) || queryForm.dateRange.length !== 2) {
    return null
  }

  const [dateRangeStart, dateRangeEnd] = queryForm.dateRange
  if (!hasValue(dateRangeStart) || !hasValue(dateRangeEnd)) {
    return null
  }

  const params = { dateRangeStart, dateRangeEnd }
  ;['campaignNameFuzzy', 'effectiveStatus', 'personInCharge', 'mappingProductUid'].forEach((field) => {
    const value = String(queryForm[field] ?? '').trim()
    if (value) params[field] = value
  })
  return params
}

export const buildMetaAdsListParams = (queryForm, pagination) => {
  const commonParams = buildMetaAdsCommonParams(queryForm)
  if (!commonParams) return null
  return {
    ...commonParams,
    pageNo: pagination.pageNo,
    pageSize: pagination.pageSize,
  }
}

export const aggregateMetaAdsDailyPerformance = (rows) =>
  (Array.isArray(rows) ? rows : []).reduce(
    (summary, row) => ({
      costAmount: summary.costAmount + toFiniteNumber(row?.costAmount),
      conversionsValue: summary.conversionsValue + toFiniteNumber(row?.conversionsValue),
      impressions: summary.impressions + toFiniteNumber(row?.impressions),
      clicks: summary.clicks + toFiniteNumber(row?.clicks),
      conversions: summary.conversions + toFiniteNumber(row?.conversions),
    }),
    {
      costAmount: 0,
      conversionsValue: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
    },
  )

export const getMetaAdsStatusOption = (status) =>
  META_ADS_CAMPAIGN_STATUS_OPTIONS.find((option) => option.value === status)

export const formatMetaAdsCell = (value) => (hasValue(value) ? value : '-')

export const formatMetaAdsAmount = (value, currencyCode = '') => {
  if (!hasValue(value) || !Number.isFinite(Number(value))) return '-'
  const amount = Number(value).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return currencyCode ? `${currencyCode} ${amount}` : amount
}

export const formatMetaAdsCount = (value, maximumFractionDigits = 0) => {
  if (!hasValue(value) || !Number.isFinite(Number(value))) return '-'
  return Number(value).toLocaleString('zh-CN', { maximumFractionDigits })
}

export const formatMetaAdsRate = (value) => {
  if (!hasValue(value) || !Number.isFinite(Number(value))) return '-'
  return `${(Number(value) * 100).toFixed(2)}%`
}

export const formatMetaAdsRoas = (value) => {
  if (!hasValue(value) || !Number.isFinite(Number(value))) return '-'
  return `${Number(value).toFixed(2)}x`
}

export const findMetaAdsPersonName = (options, value) => {
  if (!hasValue(value)) return '-'
  const normalizedValue = String(value)
  return (
    options.find((option) => String(option?.dictId) === normalizedValue)?.dictName ||
    normalizedValue
  )
}
