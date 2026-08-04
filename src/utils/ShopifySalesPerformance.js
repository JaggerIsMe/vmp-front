const hasValue = (value) => value !== '' && value !== null && value !== undefined
const padDatePart = (value) => String(value).padStart(2, '0')

export const formatShopifySalesLocalDate = (date) =>
  `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`

const shopifySalesTimeDimensions = new Set(['day', 'week', 'month', 'year'])
const normalizeShopifySalesTimeDimension = (dimension) =>
  shopifySalesTimeDimensions.has(dimension) ? dimension : 'day'

const parseShopifySalesReportDate = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value ?? ''))
  if (!match) return null
  const [, yearText, monthText, dayText] = match
  const year = Number(yearText)
  const month = Number(monthText) - 1
  const day = Number(dayText)
  const date = new Date(year, month, day)
  return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day
    ? date
    : null
}

const getShopifySalesPeriod = (date, dimension) => {
  const normalizedDimension = normalizeShopifySalesTimeDimension(dimension)
  if (normalizedDimension === 'week') {
    const mondayOffset = (date.getDay() + 6) % 7
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate() - mondayOffset)
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6)
    const key = formatShopifySalesLocalDate(start)
    return {
      key,
      label: `${key} 至 ${formatShopifySalesLocalDate(end)}`,
      sortValue: start.getTime(),
    }
  }
  if (normalizedDimension === 'month') {
    const key = `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}`
    return { key, label: key, sortValue: new Date(date.getFullYear(), date.getMonth(), 1).getTime() }
  }
  if (normalizedDimension === 'year') {
    const key = String(date.getFullYear())
    return { key, label: key, sortValue: new Date(date.getFullYear(), 0, 1).getTime() }
  }
  const key = formatShopifySalesLocalDate(date)
  return { key, label: key, sortValue: date.getTime() }
}

export const createDefaultShopifySalesDateRange = (nowFactory = () => new Date()) => {
  const now = nowFactory()
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29)
  return [formatShopifySalesLocalDate(start), formatShopifySalesLocalDate(end)]
}

export const buildShopifySalesPerformanceParams = (queryForm = {}) => {
  if (!Array.isArray(queryForm.createdAtRange) || queryForm.createdAtRange.length !== 2) {
    return null
  }
  const [createdAtStart, createdAtEnd] = queryForm.createdAtRange
  if (!hasValue(createdAtStart) || !hasValue(createdAtEnd)) return null

  const params = {}
  const productFields = ['storeId', 'productId', 'variantId']
  const hasSpecifiedProduct = productFields.every((field) => hasValue(queryForm[field]))
  const broadProductFields = ['storeIdList', 'brandList', 'personInChargeList']
  const arrayFields = hasSpecifiedProduct
    ? ['customerCountryCodeList']
    : [...broadProductFields, 'customerCountryCodeList']

  arrayFields.forEach((field) => {
    if (Array.isArray(queryForm[field]) && queryForm[field].length > 0) {
      params[field] = [...queryForm[field]]
    }
  })
  if (hasSpecifiedProduct) {
    productFields.forEach((field) => {
      params[field] = String(queryForm[field])
    })
  }
  params.createdAtStart = String(createdAtStart)
  params.createdAtEnd = String(createdAtEnd)
  return params
}

const metricDefinitions = [
  { field: 'totalSalesPrice', name: '总销售额', yAxisIndex: 0 },
  { field: 'totalSalesUnit', name: '总销量', yAxisIndex: 1 },
  { field: 'sessions', name: '总流量', yAxisIndex: 1 },
  { field: 'sessionsWithCartAdditions', name: '加车数', yAxisIndex: 1 },
  { field: 'sessionsThatReachedCheckout', name: '进入结账流程数', yAxisIndex: 1 },
]

const toFiniteMetric = (value) => {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : 0
}

const shopifySalesAmountFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const shopifySalesUnitFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
})

const currentPeriodCopy = {
  day: '今日',
  week: '本周',
  month: '本月',
  year: '本年',
}

export const buildShopifySalesSummaryCards = (
  rows,
  dimension = 'day',
  todayFactory = () => new Date(),
) => {
  const normalizedDimension = normalizeShopifySalesTimeDimension(dimension)
  const currentDate = todayFactory()
  const currentPeriod = currentDate instanceof Date && Number.isFinite(currentDate.getTime())
    ? getShopifySalesPeriod(currentDate, normalizedDimension)
    : null
  const summary = (Array.isArray(rows) ? rows : []).reduce(
    (totals, row) => {
      const salesPrice = toFiniteMetric(row?.totalSalesPrice)
      const salesUnit = toFiniteMetric(row?.totalSalesUnit)
      totals.rangeSalesPrice += salesPrice
      totals.rangeSalesUnit += salesUnit
      const reportDate = parseShopifySalesReportDate(row?.reportDate)
      if (
        currentPeriod &&
        reportDate &&
        getShopifySalesPeriod(reportDate, normalizedDimension).key === currentPeriod.key
      ) {
        totals.currentSalesPrice += salesPrice
        totals.currentSalesUnit += salesUnit
      }
      return totals
    },
    { currentSalesPrice: 0, currentSalesUnit: 0, rangeSalesPrice: 0, rangeSalesUnit: 0 },
  )

  const currentCopy = currentPeriodCopy[normalizedDimension]

  return [
    { key: 'currentSalesPrice', label: `${currentCopy}总销售额`, value: shopifySalesAmountFormatter.format(summary.currentSalesPrice), kind: 'amount' },
    { key: 'currentSalesUnit', label: `${currentCopy}总销量`, value: shopifySalesUnitFormatter.format(summary.currentSalesUnit), kind: 'unit' },
    { key: 'rangeSalesPrice', label: '累计总销售额', value: shopifySalesAmountFormatter.format(summary.rangeSalesPrice), kind: 'amount' },
    { key: 'rangeSalesUnit', label: '累计总销量', value: shopifySalesUnitFormatter.format(summary.rangeSalesUnit), kind: 'unit' },
  ]
}

const formatShopifySalesAmountAxisLabel = (value) =>
  String(Number(toFiniteMetric(value).toFixed(2)))

export const normalizeShopifySalesPerformanceRows = (rows) => {
  if (!Array.isArray(rows)) return []
  return rows
    .map((row) => ({
      reportDate: String(row?.reportDate ?? ''),
      ...Object.fromEntries(
        metricDefinitions.map(({ field }) => [field, toFiniteMetric(row?.[field])]),
      ),
    }))
    .sort((left, right) => left.reportDate.localeCompare(right.reportDate))
}

export const aggregateShopifySalesPerformanceRows = (rawRows, dimension = 'day') => {
  const normalizedDimension = normalizeShopifySalesTimeDimension(dimension)
  if (normalizedDimension === 'day') {
    return normalizeShopifySalesPerformanceRows(rawRows)
  }
  const buckets = new Map()
  normalizeShopifySalesPerformanceRows(rawRows).forEach((row) => {
    const date = parseShopifySalesReportDate(row.reportDate)
    if (!date) return
    const period = getShopifySalesPeriod(date, normalizedDimension)
    if (!buckets.has(period.key)) {
      buckets.set(period.key, {
        reportDate: period.label,
        sortValue: period.sortValue,
        ...Object.fromEntries(metricDefinitions.map(({ field }) => [field, 0])),
      })
    }
    const bucket = buckets.get(period.key)
    metricDefinitions.forEach(({ field }) => {
      bucket[field] += row[field]
    })
  })
  return [...buckets.values()]
    .sort((left, right) => left.sortValue - right.sortValue)
    .map(({ sortValue, ...row }) => row)
}

const formatShopifySalesTooltip = (params) => {
  if (!Array.isArray(params) || params.length === 0) return ''
  const lines = [String(params[0].axisValueLabel ?? params[0].axisValue ?? '')]
  params.forEach((item) => {
    const value = item.seriesName === '总销售额'
      ? toFiniteMetric(item.value).toFixed(2)
      : toFiniteMetric(item.value)
    lines.push(`${item.seriesName}：${value}`)
  })
  return lines.join('\n')
}

export const buildShopifySalesPerformanceChartOption = (rawRows, dimension = 'day') => {
  const rows = aggregateShopifySalesPerformanceRows(rawRows, dimension)
  const enableZoom = rows.length > 30
  const option = {
    color: ['#2563eb', '#16a34a', '#7c3aed', '#ea580c', '#0891b2'],
    animationDuration: 300,
    grid: { left: 24, right: 24, top: 72, bottom: enableZoom ? 76 : 32, containLabel: true },
    legend: { top: 12, data: metricDefinitions.map(({ name }) => name) },
    tooltip: {
      trigger: 'axis',
      renderMode: 'richText',
      axisPointer: { type: 'cross' },
      formatter: formatShopifySalesTooltip,
    },
    xAxis: { type: 'category', boundaryGap: false, data: rows.map(({ reportDate }) => reportDate) },
    yAxis: [
      { type: 'value', name: '销售额', min: 0 },
      { type: 'value', name: '数量', min: 0, splitLine: { show: false } },
    ],
    dataZoom: enableZoom
      ? [{ type: 'inside', xAxisIndex: 0 }, { type: 'slider', xAxisIndex: 0, bottom: 18 }]
      : [],
    series: metricDefinitions.map(({ field, name, yAxisIndex }) => ({
      name,
      type: 'line',
      yAxisIndex,
      symbol: 'circle',
      symbolSize: 6,
      showSymbol: rows.length <= 31,
      emphasis: { focus: 'series' },
      data: rows.map((row) => row[field]),
    })),
  }
  option.yAxis[0].axisLabel = { formatter: formatShopifySalesAmountAxisLabel }
  return option
}
