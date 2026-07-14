const regs = {
  number: /^([0]|[1-9][0-9]*)$/,
  password: /^(?=.*\d)(?=.*[a-zA-Z])[\da-zA-Z~!@#$%^&*_]{8,18}$/,
  account: /^[A-Za-z0-9]{1,10}$/,
  nickName: /^[\u4e00-\u9fa5A-Za-z0-9]{1,19}$/,
  roleName: /^[\u4e00-\u9fa5A-Za-z0-9]{1,20}$/,
}
const verify = (rule, value, reg, callback) => {
  if (value !== undefined && value !== null && value !== '') {
    if (reg.test(String(value))) {
      callback()
    } else {
      callback(new Error(rule.message || '格式不正确'))
    }
  } else {
    callback()
  }
}

export default {
  number: (rule, value, callback) => {
    return verify(rule, value, regs.number, callback)
  },
  password: (rule, value, callback) => {
    return verify(rule, value, regs.password, callback)
  },
  account: (rule, value, callback) => {
    return verify(rule, value, regs.account, callback)
  },
  nickName: (rule, value, callback) => {
    return verify(rule, value, regs.nickName, callback)
  },
  roleName: (rule, value, callback) => {
    return verify(rule, value, regs.roleName, callback)
  },
}
