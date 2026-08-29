const hasValue = (value) => value !== '' && value !== null && value !== undefined

const toFiniteNumber = (value) => {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : 0
}

export const GOOGLE_ADS_CAMPAIGN_STATUS_OPTIONS = [
  { value: 'ENABLED', label: '已启用', tagType: 'success' },
  { value: 'PAUSED', label: '已暂停', tagType: 'warning' },
  { value: 'REMOVED', label: '已移除', tagType: 'danger' },
  { value: 'UNKNOWN', label: '未知', tagType: 'info' },
  { value: 'UNSPECIFIED', label: '未指定', tagType: 'info' },
]

export const GOOGLE_ADS_CHANNEL_TYPE_LABELS = {
  DEMAND_GEN: '需求开发',
  DISPLAY: '展示',
  HOTEL: '酒店',
  LOCAL: '本地',
  LOCAL_SERVICES: '本地服务',
  MULTI_CHANNEL: '多渠道',
  PERFORMANCE_MAX: '效果最大化',
  SEARCH: '搜索',
  SHOPPING: '购物',
  SMART: '智能',
  TRAVEL: '旅游',
  UNKNOWN: '未知',
  UNSPECIFIED: '未指定',
  VIDEO: '视频',
}

export const buildGoogleAdsCommonParams = (queryForm = {}) => {
  if (!Array.isArray(queryForm.dateRange) || queryForm.dateRange.length !== 2) {
    return null
  }

  const [dateRangeStart, dateRangeEnd] = queryForm.dateRange
  if (!hasValue(dateRangeStart) || !hasValue(dateRangeEnd)) {
    return null
  }

  const params = { dateRangeStart, dateRangeEnd }
  ;['campaignNameFuzzy', 'status', 'personInCharge', 'mappingProductUid'].forEach((field) => {
    const value = String(queryForm[field] ?? '').trim()
    if (value) params[field] = value
  })
  return params
}

export const buildGoogleAdsListParams = (queryForm, pagination) => {
  const commonParams = buildGoogleAdsCommonParams(queryForm)
  if (!commonParams) return null
  return {
    ...commonParams,
    pageNo: pagination.pageNo,
    pageSize: pagination.pageSize,
  }
}

export const aggregateGoogleAdsDailyPerformance = (rows) =>
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

export const getGoogleAdsStatusOption = (status) =>
  GOOGLE_ADS_CAMPAIGN_STATUS_OPTIONS.find((option) => option.value === status)

export const formatGoogleAdsCell = (value) => (hasValue(value) ? value : '-')

export const formatGoogleAdsAmount = (value, currencyCode = '') => {
  if (!hasValue(value) || !Number.isFinite(Number(value))) return '-'
  const amount = Number(value).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return currencyCode ? `${currencyCode} ${amount}` : amount
}

export const formatGoogleAdsCount = (value, maximumFractionDigits = 0) => {
  if (!hasValue(value) || !Number.isFinite(Number(value))) return '-'
  return Number(value).toLocaleString('zh-CN', { maximumFractionDigits })
}

export const formatGoogleAdsRate = (value) => {
  if (!hasValue(value) || !Number.isFinite(Number(value))) return '-'
  return `${(Number(value) * 100).toFixed(2)}%`
}

export const formatGoogleAdsRoas = (value) => {
  if (!hasValue(value) || !Number.isFinite(Number(value))) return '-'
  return `${Number(value).toFixed(2)}x`
}

export const findGoogleAdsPersonName = (options, value) => {
  if (!hasValue(value)) return '-'
  const normalizedValue = String(value)
  return (
    options.find((option) => String(option?.dictId) === normalizedValue)?.dictName ||
    normalizedValue
  )
}
