const hasValue = (value) => value !== '' && value !== null && value !== undefined

export const buildShopifyOrderListParams = (queryForm, pagination) => {
  const params = {
    pageNo: pagination.pageNo,
    pageSize: pagination.pageSize,
  }

  const hasProductSelection = ['storeId', 'productId', 'variantId'].every((field) =>
    hasValue(queryForm[field]),
  )

  const arrayFilters = [
    'storeIdList',
    'brandList',
    'personInChargeList',
    'customerCountryCodeList',
    'displayFinancialStatusList',
    'displayFulfillmentStatusList',
  ]
  arrayFilters.forEach((field) => {
    if (field === 'storeIdList' && hasProductSelection) {
      return
    }
    if (Array.isArray(queryForm[field]) && queryForm[field].length > 0) {
      params[field] = [...queryForm[field]]
    }
  })

  if (hasProductSelection) {
    ;['storeId', 'productId', 'variantId'].forEach((field) => {
      params[field] = String(queryForm[field])
    })
  }

  const textFilters = ['orderName', 'customerEmailFuzzy', 'discountCodeFuzzy']
  textFilters.forEach((field) => {
    const value = String(queryForm[field] ?? '').trim()
    if (value) {
      params[field] = value
    }
  })

  if (Array.isArray(queryForm.createdAtRange) && queryForm.createdAtRange.length === 2) {
    const [createdAtStart, createdAtEnd] = queryForm.createdAtRange
    if (hasValue(createdAtStart) && hasValue(createdAtEnd)) {
      params.createdAtStart = createdAtStart
      params.createdAtEnd = createdAtEnd
    }
  }

  return params
}

export const formatShopifyOrderCell = (value) => (hasValue(value) ? value : '-')

export const formatShopifyOrderAmount = (value, currencyCode) => {
  if (!hasValue(value) || !Number.isFinite(Number(value))) {
    return '-'
  }

  const amount = Number(value).toFixed(2)
  return currencyCode ? `${currencyCode} ${amount}` : amount
}

export const getShopifyStoreOptionValue = (option) => String(option?.dictCode ?? '')

export const findShopifyDictionaryName = (options, value) => {
  if (!hasValue(value)) {
    return '-'
  }

  const normalizedValue = String(value)
  const match = options.find(
    (option) =>
      String(option.dictId) === normalizedValue || String(option.dictCode) === normalizedValue,
  )
  return match?.dictName || normalizedValue
}

const getShopifyOrderProductSummaryField = (row, parentProduct, field) => {
  const value = hasValue(row?.[field]) ? row[field] : parentProduct?.[field]
  return hasValue(value) ? String(value) : ''
}

export const normalizeShopifyOrderProductSelection = (row, parentProduct = null) => {
  const storeId = hasValue(row?.storeId) ? row.storeId : parentProduct?.storeId
  const productId = hasValue(row?.productId) ? row.productId : parentProduct?.productId
  const variantId = row?.variantId

  if (![storeId, productId, variantId].every(hasValue)) {
    return null
  }

  return {
    storeId: String(storeId),
    productId: String(productId),
    variantId: String(variantId),
    productTitle: getShopifyOrderProductSummaryField(row, parentProduct, 'productTitle'),
    attribute: getShopifyOrderProductSummaryField(row, parentProduct, 'attribute'),
    sku: getShopifyOrderProductSummaryField(row, parentProduct, 'sku'),
    brand: getShopifyOrderProductSummaryField(row, parentProduct, 'brand'),
  }
}

export const getShopifyOrderProductSelectionKey = (product) => {
  const normalizedProduct = normalizeShopifyOrderProductSelection(product)
  return normalizedProduct
    ? `${normalizedProduct.storeId}::${normalizedProduct.productId}::${normalizedProduct.variantId}`
    : ''
}

export const formatShopifyOrderProductSelection = (row, parentProduct = null) => {
  const normalizedProduct = normalizeShopifyOrderProductSelection(row, parentProduct)
  if (!normalizedProduct) {
    return ''
  }

  return [normalizedProduct.productTitle, normalizedProduct.attribute, normalizedProduct.sku]
    .filter(Boolean)
    .join(' / ')
}

