import { ElMessageBox } from 'element-plus'

const confirm = (message, okfun, options = {}) => {
  const { title = '提示', ...messageBoxOptions } = options

  return ElMessageBox.confirm(message, title, {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'info',
    ...messageBoxOptions,
  })
    .then(() => {
      if (typeof okfun === 'function') {
        return okfun()
      }
      return undefined
    })
    .catch(() => undefined)
}

export default confirm
