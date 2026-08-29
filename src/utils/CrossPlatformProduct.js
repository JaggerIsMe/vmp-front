const hasValue = (value) => value !== '' && value !== null && value !== undefined

export const CROSS_PLATFORM_PRODUCT_PLATFORM_OPTIONS = [
  {
    dictId: 'DTAzyuRYrK1TNJihuw40',
    dictCode: 'shopify',
    dictName: 'Shopify',
  },
]

export const getCrossPlatformOptionValue = (option) => String(option?.dictCode ?? '')

export const buildCrossPlatformProductListParams = (queryForm, pagination) => {
  const params = {
    pageNo: pagination.pageNo,
    pageSize: pagination.pageSize,
  }

  ;['salesPlatform', 'storeId', 'productTitleFuzzy'].forEach((field) => {
    const value = String(queryForm?.[field] ?? '').trim()
    if (value) params[field] = value
  })
  return params
}

export const buildCrossPlatformProductImageUrl = (uid) =>
  hasValue(uid) ? `/api/productCommon/getProductImg/${encodeURIComponent(uid)}` : ''

export const formatCrossPlatformProductCell = (value) => (hasValue(value) ? value : '-')

export const findCrossPlatformOptionName = (options, value) => {
  if (!hasValue(value)) return '-'
  const normalizedValue = String(value)
  const match = options.find(
    (option) =>
      String(option?.dictCode) === normalizedValue || String(option?.dictId) === normalizedValue,
  )
  return match?.dictName || normalizedValue
}

export const normalizeCrossPlatformProduct = (product) => {
  const uid = String(product?.uid ?? '').trim()
  if (!uid) return null
  return {
    ...product,
    uid,
    salesPlatform: String(product?.salesPlatform ?? ''),
    storeId: String(product?.storeId ?? ''),
    storeName: String(product?.storeName ?? ''),
    productTitle: String(product?.productTitle ?? ''),
    countryCode: String(product?.countryCode ?? ''),
  }
}
