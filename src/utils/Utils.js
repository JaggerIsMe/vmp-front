// 将文件以字节为单位的转换为其他单位
export default {
  size2Str: (limit) => {
    const size = Number(limit)

    if (!Number.isFinite(size) || size <= 0) {
      return '0B'
    }

    const units = ['B', 'KB', 'MB', 'GB']
    let value = size
    let unitIndex = 0

    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024
      unitIndex += 1
    }

    const formattedValue = unitIndex === 0
      ? String(Math.round(value))
      : value.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1')

    return `${formattedValue}${units[unitIndex]}`
  },
}
