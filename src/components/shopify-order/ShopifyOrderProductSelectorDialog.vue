<template>
  <el-dialog
    title="指定产品"
    width="min(1200px, 94vw)"
    class="shopify-order-product-selector-dialog"
    align-center
    :model-value="modelValue"
    @update:model-value="handleDialogVisibleChange"
  >
    <div class="shopify-order-product-selector">
      <el-row class="shopify-order-product-selector__search-row" :gutter="12">
        <el-col :xs="24" :sm="12" :md="6">
          <el-select
            v-model="queryForm.storeIdList"
            multiple
            filterable
            clearable
            collapse-tags
            placeholder="请选择店铺"
          >
            <el-option
              v-for="option in storeOptions"
              :key="option.dictId || option.dictCode"
              :label="option.dictName"
              :value="getDictionaryOptionValue(option)"
            />
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-select
            v-model="queryForm.brandList"
            multiple
            filterable
            clearable
            collapse-tags
            placeholder="请选择品牌"
          >
            <el-option
              v-for="option in brandOptions"
              :key="option.dictId || option.dictCode"
              :label="option.dictName"
              :value="getDictionaryOptionValue(option)"
            />
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-input
            v-model="queryForm.productTitleFuzzy"
            placeholder="请输入产品标题"
            :prefix-icon="Search"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <el-input
            v-model="queryForm.sku"
            placeholder="请输入产品SKU"
            :prefix-icon="Search"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-col>
        <el-col
          class="shopify-order-product-selector__search-actions"
          :xs="24"
          :sm="24"
          :md="24"
        >
          <div class="shopify-order-product-selector__search-button-group">
            <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
          </div>
        </el-col>
      </el-row>

      <div v-if="draftSelection" class="shopify-order-product-selector__summary">
        当前选择：{{ draftSelectionSummary }}
      </div>

      <div class="shopify-order-product-selector__table-scroll">
        <el-table
          ref="shopifyTableRef"
          v-loading="tableLoading"
          class="basic-table shopify-order-product-selector__table"
          :data="displayRows"
          :row-key="getShopifyDisplayRowKey"
          :row-class-name="getTableRowClassName"
          empty-text="暂无 Shopify 产品数据"
          height="100%"
          border
          stripe
          style="width: 100%"
        >
        <el-table-column label="选择" width="64" fixed="left" align="center">
          <template #default="{ row }">
            <el-radio
              v-if="isSelectableProductRow(row)"
              :model-value="draftSelectionKey"
              :value="getShopifyOrderProductSelectionKey(row)"
              :disabled="!isSelectableProductRow(row)"
              @change="handleSelectProduct(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="productTitle" label="产品标题" min-width="260">
          <template #default="{ row }">
            <span v-if="row.shopifyRowType === SHOPIFY_ROW_TYPES.PARENT">
              {{ formatShopifyCell(row.productTitle) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="attribute" label="变体属性" min-width="180">
          <template #default="{ row }">
            <div
              v-if="row.shopifyRowType === SHOPIFY_ROW_TYPES.PARENT"
              class="shopify-variant-toggle-cell"
            >
              <span class="shopify-variant-toggle-cell__attribute">
                {{ formatShopifyCell(row.attribute) }}
              </span>
              <el-button
                type="primary"
                link
                class="shopify-variant-toggle-button"
                :loading="row.variantState.loading"
                @click="handleToggleVariants(row)"
              >
                <el-icon
                  class="shopify-variant-toggle-button__icon"
                  :class="{ 'is-expanded': row.variantState.expanded }"
                >
                  <ArrowDown />
                </el-icon>
                {{ row.variantState.expanded ? '收起变体' : '展开变体' }}
              </el-button>
            </div>
            <span v-else-if="row.shopifyRowType === SHOPIFY_ROW_TYPES.VARIANT">
              {{ formatShopifyCell(row.attribute) }}
            </span>
            <div v-else class="shopify-variant-control">
              <template v-if="row.controlMode === 'loading'">
                变体数据加载中
              </template>
              <template v-else-if="row.controlMode === 'initial-error'">
                <span>变体数据加载失败</span>
                <el-button
                  type="primary"
                  link
                  @click="handleRetryVariants(row.parentProduct)"
                >
                  重新加载
                </el-button>
              </template>
              <template v-else-if="row.controlMode === 'empty'">
                暂无变体数据
              </template>
              <el-button
                v-else-if="row.controlMode === 'load-more'"
                type="primary"
                link
                @click="handleLoadMoreVariants(row.parentProduct)"
              >
                加载更多
              </el-button>
              <el-button
                v-else-if="row.controlMode === 'loading-more'"
                type="primary"
                link
                loading
              >
                加载更多
              </el-button>
              <template v-else-if="row.controlMode === 'load-more-error'">
                <span>加载更多失败，请重试</span>
                <el-button
                  type="primary"
                  link
                  @click="handleRetryVariants(row.parentProduct)"
                >
                  重试
                </el-button>
              </template>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="sku" label="SKU" min-width="150">
          <template #default="{ row }">
            <span v-if="row.shopifyRowType !== SHOPIFY_ROW_TYPES.CONTROL">
              {{ formatShopifyCell(row.sku) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="storeId" label="店铺" min-width="150">
          <template #default="{ row }">
            <span v-if="row.shopifyRowType !== SHOPIFY_ROW_TYPES.CONTROL">
              {{ findDictionaryName(storeOptions, row.storeId) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="brand" label="品牌" min-width="140">
          <template #default="{ row }">
            <span v-if="row.shopifyRowType !== SHOPIFY_ROW_TYPES.CONTROL">
              {{ findDictionaryName(brandOptions, row.brand) }}
            </span>
          </template>
        </el-table-column>
        </el-table>
      </div>

      <el-pagination
        class="shopify-order-product-selector__pagination"
        v-model:current-page="pagination.pageNo"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 15, 20, 50]"
        :total="pagination.totalCount"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handlePageSizeChange"
        @current-change="handlePageNoChange"
      />
    </div>

    <template #footer>
      <div class="shopify-order-product-selector__footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" :disabled="!draftSelection" @click="handleConfirm">
          确认
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { ArrowDown, Search } from '@element-plus/icons-vue'
import Request from '@/utils/Request'
import {
  formatShopifyOrderProductSelection,
  getShopifyOrderProductSelectionKey,
  normalizeShopifyOrderProductSelection,
} from '@/utils/ShopifyOrder'
import {
  appendUniqueShopifyVariants,
  buildShopifyDisplayRows,
  buildShopifyListParams,
  buildShopifyVariantListParams,
  createShopifyParentRow,
  findDictionaryName,
  formatShopifyCell,
  getDictionaryOptionValue,
  getShopifyDisplayRowKey,
  hasMoreShopifyVariants,
  SHOPIFY_ROW_TYPES,
} from '@/utils/ShopifyListing'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  storeOptions: {
    type: Array,
    default: () => [],
  },
  selectedProduct: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue', 'confirm'])

const queryForm = reactive({
  storeIdList: [],
  brandList: [],
  productTitleFuzzy: '',
  sku: '',
})
const pagination = reactive({
  pageNo: 1,
  pageSize: 15,
  totalCount: 0,
})
const productList = ref([])
const displayRows = computed(() => buildShopifyDisplayRows(productList.value))
const brandOptions = ref([])
const tableLoading = ref(false)
const shopifyTableRef = ref(null)
const draftSelection = ref(null)
const draftSelectionSummary = computed(() =>
  formatShopifyOrderProductSelection(draftSelection.value),
)
const draftSelectionKey = computed(() =>
  getShopifyOrderProductSelectionKey(draftSelection.value),
)

let listRequestId = 0
let destroyed = false

const scheduleTableLayout = () => {
  void nextTick(() => {
    if (!destroyed) shopifyTableRef.value?.doLayout?.()
  })
}

const invalidateVariantRequests = () => {
  productList.value.forEach((parent) => {
    const state = parent.variantState
    if (!state) return
    state.requestId += 1
    state.loading = false
  })
}

const invalidateParentRequests = () => {
  listRequestId += 1
  tableLoading.value = false
  invalidateVariantRequests()
}

const loadBrandOptions = async () => {
  if (brandOptions.value.length > 0) return null
  const response = await Request({
    url: '/account/getAllEnableChildDictDataByPid/vDAWBhM9UrKRagD5rrKc',
    method: 'post',
    showLoading: false,
  })
  if (!destroyed && response) {
    brandOptions.value = Array.isArray(response.data) ? response.data : []
  }
  return response
}

const loadProductList = async () => {
  const requestId = ++listRequestId
  tableLoading.value = true
  const response = await Request({
    url: '/shopify/loadShopifyParentProductList',
    method: 'post',
    params: buildShopifyListParams(queryForm, pagination),
    showLoading: false,
  }).finally(() => {
    if (requestId === listRequestId) tableLoading.value = false
  })

  if (!response || destroyed || requestId !== listRequestId) return response

  const pageData = response.data || {}
  productList.value = Array.isArray(pageData.list)
    ? pageData.list.map(createShopifyParentRow)
    : []
  const totalCount = Number(pageData.totalCount)
  pagination.totalCount = Number.isFinite(totalCount) ? totalCount : 0
  return response
}

const hasParentIdentity = (parent) =>
  parent?.storeId !== '' &&
  parent?.storeId !== null &&
  parent?.storeId !== undefined &&
  parent?.productId !== '' &&
  parent?.productId !== null &&
  parent?.productId !== undefined

const loadVariantPage = async (parent, pageNo) => {
  const state = parent?.variantState
  if (!state) return null
  if (!hasParentIdentity(parent)) {
    state.error = true
    scheduleTableLayout()
    return null
  }
  if (state.loading) return null

  const requestId = ++state.requestId
  state.loading = true
  state.error = false
  let response
  try {
    response = await Request({
      url: '/shopify/loadShopifyChildProductListUnderSpecificParent',
      method: 'post',
      params: buildShopifyVariantListParams(parent, pageNo),
      showLoading: false,
    })
  } finally {
    if (requestId === state.requestId) state.loading = false
    scheduleTableLayout()
  }

  if (destroyed || !props.modelValue || requestId !== state.requestId) return response
  if (!response) {
    state.error = true
    return response
  }

  const pageData = response.data || {}
  const incoming = Array.isArray(pageData.list) ? pageData.list : []
  state.children = appendUniqueShopifyVariants(
    Number(pageNo) === 1 ? [] : state.children,
    incoming,
  )
  const responsePageNo = Number(pageData.pageNo)
  const responseTotalCount = Number(pageData.totalCount)
  state.pageNo = Number.isFinite(responsePageNo) ? responsePageNo : Number(pageNo)
  state.totalCount = Number.isFinite(responseTotalCount)
    ? responseTotalCount
    : state.children.length
  state.initialized = true
  state.error = false
  scheduleTableLayout()
  return response
}

const handleToggleVariants = (parent) => {
  const state = parent?.variantState
  if (!state) return null
  state.expanded = !state.expanded
  scheduleTableLayout()
  if (state.expanded && !state.initialized && !state.loading) {
    return loadVariantPage(parent, 1)
  }
  return null
}

const handleLoadMoreVariants = (parent) => {
  const state = parent?.variantState
  if (!state || state.loading || !hasMoreShopifyVariants(state)) return null
  return loadVariantPage(parent, state.pageNo + 1)
}

const handleRetryVariants = (parent) => {
  const state = parent?.variantState
  if (!state || state.loading) return null
  return loadVariantPage(parent, state.initialized ? state.pageNo + 1 : 1)
}

const handleSearch = () => {
  pagination.pageNo = 1
  return loadProductList()
}

const handleReset = () => {
  queryForm.storeIdList = []
  queryForm.brandList = []
  queryForm.productTitleFuzzy = ''
  queryForm.sku = ''
  pagination.pageNo = 1
  return loadProductList()
}

const handlePageSizeChange = (pageSize) => {
  pagination.pageSize = pageSize
  pagination.pageNo = 1
  return loadProductList()
}

const handlePageNoChange = (pageNo) => {
  pagination.pageNo = pageNo
  return loadProductList()
}

const findParentProduct = (row) => {
  if (row?.shopifyRowType !== SHOPIFY_ROW_TYPES.VARIANT) return null
  return productList.value.find(
    (product) =>
      String(product.storeId) === String(row.storeId) &&
      String(product.productId) === String(row.productId),
  ) || null
}

const normalizeProductRow = (row) => {
  if (!row || row.shopifyRowType === SHOPIFY_ROW_TYPES.CONTROL) return null
  if (![SHOPIFY_ROW_TYPES.PARENT, SHOPIFY_ROW_TYPES.VARIANT].includes(row.shopifyRowType)) {
    return null
  }
  const parent = findParentProduct(row)
  if (row.shopifyRowType === SHOPIFY_ROW_TYPES.VARIANT && parent) {
    return normalizeShopifyOrderProductSelection({
      ...row,
      productTitle: parent.productTitle,
      brand: parent.brand,
    }, parent)
  }
  return normalizeShopifyOrderProductSelection(row, parent)
}

const isSelectableProductRow = (row) =>
  [SHOPIFY_ROW_TYPES.PARENT, SHOPIFY_ROW_TYPES.VARIANT].includes(row?.shopifyRowType)

const getTableRowClassName = ({ row }) => {
  if (row?.shopifyRowType === SHOPIFY_ROW_TYPES.PARENT) return 'shopify-parent-row'
  if (row?.shopifyRowType === SHOPIFY_ROW_TYPES.VARIANT) return 'shopify-variant-row'
  if (row?.shopifyRowType === SHOPIFY_ROW_TYPES.CONTROL) {
    return 'shopify-variant-control-row'
  }
  return ''
}

const handleSelectProduct = (row) => {
  const normalizedProduct = normalizeProductRow(row)
  if (!normalizedProduct) return null
  draftSelection.value = { ...normalizedProduct }
  return normalizedProduct
}

const handleDialogVisibleChange = (visible) => {
  if (!visible) invalidateParentRequests()
  emit('update:modelValue', visible)
}

const handleCancel = () => {
  emit('update:modelValue', false)
}

const handleConfirm = () => {
  const normalizedProduct = normalizeShopifyOrderProductSelection(draftSelection.value)
  if (!normalizedProduct) return null
  emit('confirm', { ...normalizedProduct })
  emit('update:modelValue', false)
  return normalizedProduct
}

watch(
  () => props.modelValue,
  (visible) => {
    if (!visible) {
      invalidateParentRequests()
      return
    }
    const normalizedProduct = normalizeShopifyOrderProductSelection(props.selectedProduct)
    draftSelection.value = normalizedProduct ? { ...normalizedProduct } : null
    void Promise.all([loadProductList(), loadBrandOptions()])
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  destroyed = true
  invalidateParentRequests()
})
</script>

<style scoped lang="scss"></style>
