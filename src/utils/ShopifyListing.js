const hasValue = (value) => value !== '' && value !== null && value !== undefined

const copyNonEmptyList = (target, key, value) => {
  if (Array.isArray(value) && value.length > 0) {
    target[key] = [...value]
  }
}

export const buildShopifyListParams = (queryForm, pagination) => {
  const params = {
    pageNo: pagination.pageNo,
    pageSize: pagination.pageSize,
  }

  copyNonEmptyList(params, 'storeIdList', queryForm.storeIdList)
  copyNonEmptyList(params, 'brandList', queryForm.brandList)
  copyNonEmptyList(params, 'personInChargeList', queryForm.personInChargeList)

  const productTitleFuzzy = String(queryForm.productTitleFuzzy || '').trim()
  const sku = String(queryForm.sku || '').trim()
  if (productTitleFuzzy) {
    params.productTitleFuzzy = productTitleFuzzy
  }
  if (sku) {
    params.sku = sku
  }

  return params
}

export const buildShopifyTagParams = (products, changes) => {
  const params = {
    storeIdList: products.map((product) => String(product.storeId)),
    productIdList: products.map((product) => String(product.productId)),
  }

  if (hasValue(changes.brand)) {
    params.newBrand = changes.brand
  }
  if (hasValue(changes.personInCharge)) {
    params.newPersonInCharge = changes.personInCharge
  }

  return params
}

export const formatShopifyCell = (value) => (hasValue(value) ? value : '-')

export const formatShopifyPrice = (unitPrice, currencyCode) => {
  if (!hasValue(unitPrice) || !Number.isFinite(Number(unitPrice))) {
    return '-'
  }

  const amount = Number(unitPrice).toFixed(2)
  return currencyCode ? `${currencyCode} ${amount}` : amount
}

export const formatAvailableForSale = (value) => {
  if (Number(value) === 1) {
    return '可售'
  }
  if (Number(value) === 0 && hasValue(value)) {
    return '不可售'
  }
  return '-'
}

export const getDictionaryOptionValue = (option) => String(option?.dictCode ?? '')

export const findDictionaryName = (options, value) => {
  if (!hasValue(value)) {
    return '-'
  }

  const normalizedValue = String(value)
  const match = options.find(
    (option) =>
      String(option.dictId) === normalizedValue || String(option.dictCode) === normalizedValue,
  )
  return match?.dictName || String(value)
}

export const buildShopifyProductImageUrl = (product) => {
  const segments = [product.storeId, product.productId]
  if (segments.some((value) => !hasValue(value))) {
    return ''
  }

  return `/api/shopify/getProductImg/${segments
    .map((value) => encodeURIComponent(value))
    .join('/')}`
}

export const createShopifyVariantState = () => ({
  expanded: false,
  initialized: false,
  loading: false,
  error: false,
  pageNo: 0,
  totalCount: 0,
  children: [],
  requestId: 0,
})

export const buildShopifyVariantListParams = (product, pageNo) => ({
  pageNo,
  pageSize: 10,
  storeId: product.storeId,
  productId: product.productId,
})

export const hasMoreShopifyVariants = (state) =>
  state.children.length < Number(state.totalCount || 0)

const getVariantKey = (variant) =>
  `${variant.storeId ?? ''}::${variant.productId ?? ''}::${variant.variantId ?? ''}`

export const appendUniqueShopifyVariants = (existing, incoming) => {
  const seen = new Set(existing.map(getVariantKey))
  return [
    ...existing,
    ...incoming.filter((variant) => {
      const key = getVariantKey(variant)
      if (seen.has(key)) return false
      seen.add(key)
      return true
    }),
  ]
}

export const getShopifyParentRowKey = (product) =>
  `${product.storeId ?? ''}::${product.productId ?? ''}`

export const SHOPIFY_ROW_TYPES = Object.freeze({
  PARENT: 'parent',
  VARIANT: 'variant',
  CONTROL: 'control',
})

export const createShopifyParentRow = (product) => ({
  ...product,
  imageLoadError: false,
  shopifyRowType: SHOPIFY_ROW_TYPES.PARENT,
  shopifyRowKey: `${getShopifyParentRowKey(product)}::parent`,
  variantState: createShopifyVariantState(),
})

const getVariantControlMode = (state) => {
  if (!state.initialized && state.loading) return 'loading'
  if (!state.initialized && state.error) return 'initial-error'
  if (state.initialized && state.children.length === 0) return 'empty'
  if (state.children.length > 0 && state.loading) return 'loading-more'
  if (state.children.length > 0 && state.error) return 'load-more-error'
  if (hasMoreShopifyVariants(state)) return 'load-more'
  return ''
}

export const buildShopifyDisplayRows = (parents) => {
  const rows = []
  parents.forEach((parent) => {
    rows.push(parent)
    const state = parent.variantState
    if (!state.expanded) return

    state.children.forEach((variant, index) => {
      rows.push({
        ...variant,
        storeId: hasValue(variant.storeId) ? variant.storeId : parent.storeId,
        productId: hasValue(variant.productId) ? variant.productId : parent.productId,
        brand: hasValue(variant.brand) ? variant.brand : parent.brand,
        personInCharge: hasValue(variant.personInCharge)
          ? variant.personInCharge
          : parent.personInCharge,
        shopifyRowType: SHOPIFY_ROW_TYPES.VARIANT,
        shopifyRowKey: `${getShopifyParentRowKey(parent)}::variant::${variant.variantId ?? index}`,
      })
    })

    const controlMode = getVariantControlMode(state)
    if (controlMode) {
      rows.push({
        shopifyRowType: SHOPIFY_ROW_TYPES.CONTROL,
        shopifyRowKey: `${getShopifyParentRowKey(parent)}::control`,
        controlMode,
        parentProduct: parent,
      })
    }
  })
  return rows
}

export const getShopifyDisplayRowKey = (row) => row.shopifyRowKey

export const isShopifyParentRow = (row) =>
  row.shopifyRowType === SHOPIFY_ROW_TYPES.PARENT

export const createShopifyVariantInventoryState = () => ({
  initialized: false,
  loading: false,
  error: false,
  details: [],
  requestId: 0,
})

export const buildShopifyInventoryDetailsUrl = (variant) => {
  const segments = [variant.storeId, variant.productId, variant.variantId]
  if (segments.some((value) => !hasValue(value))) return ''
  return `/shopify/getProductInventoryDetails/${segments
    .map((value) => encodeURIComponent(value))
    .join('/')}`
}
