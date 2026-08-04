<template>
  <section class="page-shell shopify-listing-page">
    <div class="work-panel shopify-listing-panel">
      <el-row :gutter="12" class="search-row shopify-listing-search-row">
        <el-col :xs="24" :sm="12" :md="8" :lg="5">
          <el-select
            v-model="queryForm.storeIdList"
            placeholder="请选择店铺"
            multiple
            filterable
            :reserve-keyword="false"
            clearable
            collapse-tags
            collapse-tags-tooltip
          >
            <el-option
              v-for="item in storeOptions"
              :key="item.dictId"
              :label="item.dictName"
              :value="getDictionaryOptionValue(item)"
            />
          </el-select>
        </el-col>

        <el-col :xs="24" :sm="12" :md="8" :lg="5">
          <el-select
            v-model="queryForm.brandList"
            placeholder="请选择品牌"
            multiple
            filterable
            :reserve-keyword="false"
            clearable
            collapse-tags
            collapse-tags-tooltip
          >
            <el-option
              v-for="item in brandOptions"
              :key="item.dictId"
              :label="item.dictName"
              :value="getDictionaryOptionValue(item)"
            />
          </el-select>
        </el-col>

        <el-col :xs="24" :sm="12" :md="8" :lg="5">
          <el-select
            v-model="queryForm.personInChargeList"
            placeholder="请选择负责人"
            multiple
            filterable
            :reserve-keyword="false"
            clearable
            collapse-tags
            collapse-tags-tooltip
          >
            <el-option
              v-for="item in personOptions"
              :key="item.dictId"
              :label="item.dictName"
              :value="getDictionaryOptionValue(item)"
            />
          </el-select>
        </el-col>

        <el-col :xs="24" :sm="12" :md="8" :lg="5">
          <el-input
            v-model="queryForm.productTitleFuzzy"
            :prefix-icon="Search"
            placeholder="请输入产品标题"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-col>

        <el-col :xs="24" :sm="12" :md="8" :lg="4">
          <el-input
            v-model="queryForm.sku"
            :prefix-icon="Search"
            placeholder="请输入产品SKU"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-col>

        <el-col :xs="24" :sm="24" :md="16" :lg="8" class="shopify-listing-search-actions">
          <div class="shopify-listing-search-button-group">
            <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
            <el-button :icon="RefreshLeft" @click="handleReset">重置</el-button>
            <el-button type="success" :icon="PriceTag" @click="handleOpenTagDialog">
              打标
            </el-button>
          </div>
        </el-col>
      </el-row>

      <div class="shopify-listing-table-scroll">
        <el-table
          ref="tableRef"
          v-loading="tableLoading"
          :data="displayRows"
          :row-key="getShopifyDisplayRowKey"
          :row-class-name="getTableRowClassName"
          class="basic-table shopify-listing-table"
          height="100%"
          border
          stripe
          empty-text="暂无Shopify商品数据"
          @selection-change="handleSelectionChange"
        >
          <el-table-column
            type="selection"
            width="48"
            fixed="left"
            align="center"
            :selectable="isSelectableRow"
          />

          <el-table-column label="产品主图" width="96" fixed="left" align="center">
            <template #default="{ row }">
              <el-popover
                v-if="isParentRow(row)"
                placement="right"
                trigger="hover"
                :width="264"
                popper-class="shopify-product-image-popper"
              >
                <template #reference>
                  <button
                    type="button"
                    class="shopify-product-image-button"
                    :class="{ 'is-link': Boolean(row.productUrl) }"
                    :aria-disabled="String(!row.productUrl)"
                    :title="row.productUrl ? '在新标签页打开商品' : '暂无商品链接'"
                    @click="openProductUrl(row.productUrl)"
                  >
                    <img
                      v-if="getProductImageUrl(row) && !row.imageLoadError"
                      :src="getProductImageUrl(row)"
                      :alt="row.productTitle || 'Shopify商品主图'"
                      class="shopify-product-image"
                      @error="handleImageError(row)"
                    />
                    <span v-else class="shopify-product-image-fallback">
                      <el-icon><Picture /></el-icon>
                    </span>
                  </button>
                </template>

                <img
                  v-if="getProductImageUrl(row) && !row.imageLoadError"
                  :src="getProductImageUrl(row)"
                  :alt="row.productTitle || 'Shopify商品主图预览'"
                  class="shopify-product-image-preview"
                  @error="handleImageError(row)"
                />
                <div v-else class="shopify-product-image-preview-fallback">
                  <el-icon><Picture /></el-icon>
                  <span>暂无图片</span>
                </div>
              </el-popover>
            </template>
          </el-table-column>

          <el-table-column
            prop="productTitle"
            label="产品标题"
            min-width="240"
            show-overflow-tooltip
          >
            <template #default="{ row }">
              <span v-if="isParentRow(row)">{{ formatShopifyCell(row.productTitle) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="attribute" label="变体属性" min-width="210">
            <template #default="{ row }">
              <div v-if="isParentRow(row)" class="shopify-variant-toggle-cell">
                <span class="shopify-variant-toggle-cell__attribute">
                  {{ formatShopifyCell(row.attribute) }}
                </span>
                <el-button
                  type="primary"
                  link
                  :loading="row.variantState.loading"
                  class="shopify-variant-toggle-button"
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
                <span v-if="row.controlMode === 'loading'">变体数据加载中</span>
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
                <span v-else-if="row.controlMode === 'empty'">暂无变体数据</span>
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
          <el-table-column prop="sku" label="SKU" min-width="140" show-overflow-tooltip>
            <template #default="{ row }">
              <span v-if="row.shopifyRowType !== SHOPIFY_ROW_TYPES.CONTROL">
                {{ formatShopifyCell(row.sku) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="单价" min-width="130" align="right">
            <template #default="{ row }">
              <span v-if="row.shopifyRowType !== SHOPIFY_ROW_TYPES.CONTROL">
                {{ formatShopifyPrice(row.unitPrice, row.currencyCode) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="totalAvailableQuantity" label="库存" width="100" align="right">
            <template #default="{ row }">
              <span v-if="isParentRow(row)">
                {{ formatShopifyCell(row.totalAvailableQuantity) }}
              </span>
              <ShopifyVariantInventoryPopover
                v-else-if="row.shopifyRowType === SHOPIFY_ROW_TYPES.VARIANT"
                :quantity="row.totalAvailableQuantity"
                :state="row.inventoryState"
                @show="handleInventoryPopoverShow(row)"
                @retry="handleRetryInventory(row)"
              />
            </template>
          </el-table-column>
          <el-table-column prop="productStatus" label="产品状态" width="120" align="center">
            <template #default="{ row }">
              <template v-if="row.shopifyRowType !== SHOPIFY_ROW_TYPES.CONTROL">
                <el-tag
                  v-if="row.productStatus"
                  :type="getProductStatusTagType(row.productStatus)"
                  effect="plain"
                >
                  {{ row.productStatus }}
                </el-tag>
                <span v-else>-</span>
              </template>
            </template>
          </el-table-column>
          <el-table-column prop="availableForSale" label="可售状态" width="110" align="center">
            <template #default="{ row }">
              <template v-if="row.shopifyRowType !== SHOPIFY_ROW_TYPES.CONTROL">
                <el-tag
                  v-if="formatAvailableForSale(row.availableForSale) !== '-'"
                  :type="Number(row.availableForSale) === 1 ? 'success' : 'danger'"
                >
                  {{ formatAvailableForSale(row.availableForSale) }}
                </el-tag>
                <span v-else>-</span>
              </template>
            </template>
          </el-table-column>
          <el-table-column prop="productType" label="产品类型" min-width="140" show-overflow-tooltip>
            <template #default="{ row }">
              <span v-if="isParentRow(row)">{{ formatShopifyCell(row.productType) }}</span>
            </template>
          </el-table-column>
          <el-table-column
            prop="productCategory"
            label="产品类别"
            min-width="180"
            show-overflow-tooltip
          >
            <template #default="{ row }">
              <span v-if="isParentRow(row)">{{ formatShopifyCell(row.productCategory) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="storeId" label="店铺" min-width="150" show-overflow-tooltip>
            <template #default="{ row }">
              <span v-if="row.shopifyRowType !== SHOPIFY_ROW_TYPES.CONTROL">
                {{ getStoreDisplayName(row) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="brand" label="品牌" min-width="140" show-overflow-tooltip>
            <template #default="{ row }">
              <span v-if="row.shopifyRowType !== SHOPIFY_ROW_TYPES.CONTROL">
                {{ getBrandDisplayName(row) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column
            prop="personInCharge"
            label="负责人"
            min-width="140"
            show-overflow-tooltip
          >
            <template #default="{ row }">
              <span v-if="row.shopifyRowType !== SHOPIFY_ROW_TYPES.CONTROL">
                {{ getPersonDisplayName(row) }}
              </span>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="shopify-listing-pagination">
        <el-pagination
          v-model:current-page="pagination.pageNo"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 15, 20, 50]"
          :total="pagination.totalCount"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handlePageSizeChange"
          @current-change="handlePageNoChange"
        />
      </div>
    </div>

    <ShopifyProductTagDialog
      v-model="tagDialogVisible"
      :products="tagProducts"
      :brand-options="brandOptions"
      :person-options="personOptions"
      @saved="handleTagSaved"
    />
  </section>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowDown, Picture, PriceTag, RefreshLeft, Search } from '@element-plus/icons-vue'
import ShopifyProductTagDialog from '@/components/shopify-listing/ShopifyProductTagDialog.vue'
import ShopifyVariantInventoryPopover from '@/components/shopify-listing/ShopifyVariantInventoryPopover.vue'
import Request from '@/utils/Request'
import {
  appendUniqueShopifyVariants,
  buildShopifyDisplayRows,
  buildShopifyInventoryDetailsUrl,
  buildShopifyListParams,
  buildShopifyProductImageUrl,
  buildShopifyVariantListParams,
  createShopifyVariantInventoryState,
  createShopifyParentRow,
  findDictionaryName,
  formatAvailableForSale,
  formatShopifyCell,
  formatShopifyPrice,
  getDictionaryOptionValue,
  getShopifyDisplayRowKey,
  hasMoreShopifyVariants,
  isShopifyParentRow,
  SHOPIFY_ROW_TYPES,
} from '@/utils/ShopifyListing'

const DICTIONARY_PARENT_IDS = {
  store: 'DTAzyuRYrK1TNJihuw40',
  brand: 'vDAWBhM9UrKRagD5rrKc',
  personInCharge: 'rHvpefC53Kov2CEQa1v3',
}

const queryForm = reactive({
  storeIdList: [],
  brandList: [],
  personInChargeList: [],
  productTitleFuzzy: '',
  sku: '',
})
const pagination = reactive({
  pageNo: 1,
  pageSize: 15,
  totalCount: 0,
})

const tableRef = ref(null)
const tableLoading = ref(false)
const productList = ref([])
const displayRows = computed(() => buildShopifyDisplayRows(productList.value))
const selectedProducts = ref([])
const tagProducts = ref([])
const tagDialogVisible = ref(false)
const storeOptions = ref([])
const brandOptions = ref([])
const personOptions = ref([])

let listRequestId = 0
let destroyed = false

const loadDictionaryOptions = async (pid, target) => {
  const response = await Request({
    url: `/account/getAllEnableChildDictDataByPid/${encodeURIComponent(pid)}`,
    method: 'post',
    showLoading: false,
  })

  if (!destroyed && response) {
    target.value = Array.isArray(response.data) ? response.data : []
  }
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
    if (requestId === listRequestId) {
      tableLoading.value = false
    }
  })

  if (!response || destroyed || requestId !== listRequestId) {
    return response
  }

  const pageData = response.data || {}
  productList.value = Array.isArray(pageData.list)
    ? pageData.list.map(createShopifyParentRow)
    : []
  pagination.totalCount = Number(pageData.totalCount || 0)
  return response
}

const handleSearch = () => {
  pagination.pageNo = 1
  return loadProductList()
}

const handleReset = () => {
  queryForm.storeIdList = []
  queryForm.brandList = []
  queryForm.personInChargeList = []
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

const isParentRow = (row) => isShopifyParentRow(row)
const isSelectableRow = (row) => isParentRow(row)
const getStoreDisplayName = (row) => findDictionaryName(storeOptions.value, row.storeId)
const getBrandDisplayName = (row) => findDictionaryName(brandOptions.value, row.brand)
const getPersonDisplayName = (row) =>
  findDictionaryName(personOptions.value, row.personInCharge)

const getTableRowClassName = ({ row }) => {
  if (row.shopifyRowType === SHOPIFY_ROW_TYPES.VARIANT) return 'shopify-variant-row'
  if (row.shopifyRowType === SHOPIFY_ROW_TYPES.CONTROL) return 'shopify-variant-control-row'
  return 'shopify-parent-row'
}

const scheduleTableLayout = async () => {
  await nextTick()
  tableRef.value?.doLayout()
}

const loadVariantPage = async (row, pageNo) => {
  const state = row.variantState
  if (!row.storeId || !row.productId || state.loading) {
    if (!row.storeId || !row.productId) state.error = true
    return null
  }

  const requestId = ++state.requestId
  state.loading = true
  state.error = false
  const response = await Request({
    url: '/shopify/loadShopifyChildProductListUnderSpecificParent',
    method: 'post',
    params: buildShopifyVariantListParams(row, pageNo),
    showLoading: false,
  }).finally(() => {
    if (requestId === state.requestId) state.loading = false
  })

  if (!response || destroyed || requestId !== state.requestId) {
    if (!response && requestId === state.requestId) state.error = true
    await scheduleTableLayout()
    return response
  }

  const pageData = response.data || {}
  const incoming = Array.isArray(pageData.list)
    ? pageData.list.map((item) => ({
        ...item,
        inventoryState: createShopifyVariantInventoryState(),
      }))
    : []
  state.children = pageNo === 1
    ? appendUniqueShopifyVariants([], incoming)
    : appendUniqueShopifyVariants(state.children, incoming)
  state.pageNo = Number(pageData.pageNo || pageNo)
  state.totalCount = Number.isFinite(Number(pageData.totalCount))
    ? Number(pageData.totalCount)
    : state.children.length
  state.initialized = true
  state.error = false
  await scheduleTableLayout()
  return response
}

const handleToggleVariants = async (row) => {
  const state = row.variantState
  state.expanded = !state.expanded
  await scheduleTableLayout()

  if (state.expanded && !state.initialized && !state.loading) {
    return loadVariantPage(row, 1)
  }
  return null
}

const handleLoadMoreVariants = (row) => {
  const state = row.variantState
  if (state.loading || !hasMoreShopifyVariants(state)) return null
  return loadVariantPage(row, state.pageNo + 1)
}

const handleRetryVariants = (row) => {
  const state = row.variantState
  if (state.loading) return null
  return loadVariantPage(row, state.initialized ? state.pageNo + 1 : 1)
}

const loadInventoryDetails = async (row) => {
  const state = row.inventoryState
  if (!state || state.loading) return null

  const url = buildShopifyInventoryDetailsUrl(row)
  if (!url) {
    state.error = true
    return null
  }

  const requestId = ++state.requestId
  state.loading = true
  state.error = false
  const response = await Request({
    url,
    method: 'get',
    showLoading: false,
  }).finally(() => {
    if (requestId === state.requestId) state.loading = false
  })

  if (!response || destroyed || requestId !== state.requestId) {
    if (!response && requestId === state.requestId) state.error = true
    return response
  }

  state.details = Array.isArray(response.data)
    ? response.data.map((item) => ({ ...item }))
    : []
  state.initialized = true
  state.error = false
  return response
}

const handleInventoryPopoverShow = (row) => {
  const state = row.inventoryState
  if (!state || state.initialized || state.loading || state.error) return null
  return loadInventoryDetails(row)
}

const handleRetryInventory = (row) => {
  if (!row.inventoryState || row.inventoryState.loading) return null
  return loadInventoryDetails(row)
}

const handleSelectionChange = (rows) => {
  selectedProducts.value = Array.isArray(rows) ? rows.filter(isParentRow) : []
}

const handleOpenTagDialog = () => {
  if (selectedProducts.value.length === 0) {
    ElMessage.warning('请先选择需要打标的商品')
    return
  }

  const hasIncompleteProduct = selectedProducts.value.some(
    (product) => !product.storeId || !product.productId,
  )
  if (hasIncompleteProduct) {
    ElMessage.error('所选商品缺少店铺ID或产品ID，无法打标')
    return
  }

  tagProducts.value = selectedProducts.value.map((product) => ({ ...product }))
  tagDialogVisible.value = true
}

const handleTagSaved = () => {
  tableRef.value?.clearSelection()
  selectedProducts.value = []
  tagProducts.value = []
  return loadProductList()
}

const getProductImageUrl = (product) => buildShopifyProductImageUrl(product)

const handleImageError = (product) => {
  product.imageLoadError = true
}

const openProductUrl = (productUrl) => {
  if (productUrl) {
    window.open(productUrl, '_blank', 'noopener,noreferrer')
  }
}

const getProductStatusTagType = (status) => {
  const normalizedStatus = String(status || '').toUpperCase()
  if (normalizedStatus === 'ACTIVE') return 'success'
  if (normalizedStatus === 'DRAFT') return 'warning'
  if (normalizedStatus === 'ARCHIVED') return 'info'
  return 'primary'
}

onMounted(() => {
  Promise.all([
    loadProductList(),
    loadDictionaryOptions(DICTIONARY_PARENT_IDS.store, storeOptions),
    loadDictionaryOptions(DICTIONARY_PARENT_IDS.brand, brandOptions),
    loadDictionaryOptions(DICTIONARY_PARENT_IDS.personInCharge, personOptions),
  ])
})

onBeforeUnmount(() => {
  destroyed = true
  listRequestId += 1
})
</script>

<style scoped lang="scss"></style>
