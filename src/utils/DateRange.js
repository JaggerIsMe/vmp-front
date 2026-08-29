const localDateBefore = (source, daysBefore) =>
  new Date(source.getFullYear(), source.getMonth(), source.getDate() - daysBefore)

const startOfLocalWeek = (source) => {
  const daysSinceMonday = (source.getDay() + 6) % 7
  return localDateBefore(source, daysSinceMonday)
}

export const formatLocalDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const createDefaultDateRange = (nowFactory = () => new Date(), dayCount = 30) => {
  const now = nowFactory()
  const normalizedDayCount = Math.max(1, Number(dayCount) || 1)
  return [localDateBefore(now, normalizedDayCount - 1), localDateBefore(now, 0)].map(
    formatLocalDate,
  )
}

export const disableFutureDate = (date, nowFactory = () => new Date()) => {
  const now = nowFactory()
  if (
    !(date instanceof Date) ||
    !Number.isFinite(date.getTime()) ||
    !(now instanceof Date) ||
    !Number.isFinite(now.getTime())
  ) {
    return false
  }

  const candidateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  const currentDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  return candidateDay > currentDay
}

export const createDateRangeShortcuts = (nowFactory = () => new Date()) => [
  {
    text: '今天',
    value: () => {
      const now = nowFactory()
      return [localDateBefore(now, 0), localDateBefore(now, 0)]
    },
  },
  {
    text: '昨天',
    value: () => {
      const now = nowFactory()
      return [localDateBefore(now, 1), localDateBefore(now, 1)]
    },
  },
  {
    text: '过去7天',
    value: () => {
      const now = nowFactory()
      return [localDateBefore(now, 7), localDateBefore(now, 1)]
    },
  },
  {
    text: '过去30天',
    value: () => {
      const now = nowFactory()
      return [localDateBefore(now, 30), localDateBefore(now, 1)]
    },
  },
  {
    text: '本周',
    value: () => {
      const now = nowFactory()
      return [startOfLocalWeek(now), localDateBefore(now, 0)]
    },
  },
  {
    text: '上周',
    value: () => {
      const currentWeekStart = startOfLocalWeek(nowFactory())
      return [localDateBefore(currentWeekStart, 7), localDateBefore(currentWeekStart, 1)]
    },
  },
  {
    text: '本月',
    value: () => {
      const now = nowFactory()
      return [new Date(now.getFullYear(), now.getMonth(), 1), localDateBefore(now, 0)]
    },
  },
  {
    text: '上月',
    value: () => {
      const now = nowFactory()
      return [
        new Date(now.getFullYear(), now.getMonth() - 1, 1),
        new Date(now.getFullYear(), now.getMonth(), 0),
      ]
    },
  },
  {
    text: '今年',
    value: () => {
      const now = nowFactory()
      return [new Date(now.getFullYear(), 0, 1), localDateBefore(now, 0)]
    },
  },
  {
    text: '去年',
    value: () => {
      const now = nowFactory()
      return [new Date(now.getFullYear() - 1, 0, 1), new Date(now.getFullYear() - 1, 11, 31)]
    },
  },
]
