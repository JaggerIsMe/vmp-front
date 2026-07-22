const handledAuthCodes = new Set()

export const claimDingTalkAuthCode = (authCode) => {
  const normalizedAuthCode = String(authCode || '').trim()

  if (!normalizedAuthCode || handledAuthCodes.has(normalizedAuthCode)) {
    return ''
  }

  handledAuthCodes.add(normalizedAuthCode)
  return normalizedAuthCode
}
