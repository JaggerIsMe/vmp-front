<template>
  <el-dialog
    :model-value="modelValue"
    :title="title"
    width="min(1080px, 94vw)"
    class="cross-platform-product-selector-dialog"
    align-center
    :close-on-click-modal="!submitting"
    :close-on-press-escape="!submitting"
    :show-close="!submitting"
    destroy-on-close
    @update:model-value="handleVisibleChange"
  >
    <div class="cross-platform-product-selector">
      <el-row :gutter="12" class="cross-platform-product-selector__search-row">
        <el-col :xs="24" :sm="12" :md="5">
          <el-select
            v-model="queryForm.salesPlatform"
            placeholder="请选择销售平台"
            :disabled="submitting"
            @change="handlePlatformChange"
          >
            <el-option
              v-for="option in platformOptions"
              :key="option.dictId || option.dictCode"
              :label="option.dictName"
              :value="getCrossPlatformOptionValue(option)"
            />
          </el-select>
        </el-col>

        <el-col :xs="24" :sm="12" :md="5">
          <el-select
            v-model="queryForm.storeId"
            placeholder="请选择店铺"
            filterable
            clearable
            :loading="storeLoading"
            :disabled="!queryForm.salesPlatform || submitting"
          >
            <el-option
              v-for="option in storeOptions"
              :key="option.dictId || option.dictCode"
              :label="option.dictName"
              :value="getCrossPlatformOptionValue(option)"
            />
          </el-select>
        </el-col>

        <el-col :xs="24" :sm="12" :md="8">
          <el-input
            v-model="queryForm.productTitleFuzzy"
            placeholder="请输入产品标题"
            :prefix-icon="Search"
            clearable
            :disabled="submitting"
            @keyup.enter="handleSearch"
          />
        </el-col>

        <el-col :xs="24" :sm="12" :md="6" class="cross-platform-product-selector__actions">
          <el-button type="primary" :icon="Search" :disabled="submitting" @click="handleSearch">
            查询
          </el-button>
          <el-button :icon="RefreshLeft" :disabled="submitting" @click="handleReset">
            重置
          </el-button>
        </el-col>
      </el-row>

      <div v-if="selectedProduct" class="cross-platform-product-selector__summary">
        当前选择：{{ selectedProduct.productTitle || selectedProduct.uid }}
      </div>

      <div class="cross-platform-product-selector__table-scroll">
        <el-table
          v-loading="tableLoading"
          :data="productList"
          row-key="uid"
          class="basic-table cross-platform-product-selector__table"
          height="100%"
          border
          stripe
          empty-text="暂无跨平台产品数据"
        >
          <el-table-column label="选择" width="64" fixed="left" align="center">
            <template #default="{ row }">
              <el-radio
                :model-value="selectedProductUid"
                :value="row.uid"
                @change="handleSelectProduct(row)"
              />
            </template>
          </el-table-column>

          <el-table-column label="产品图片" width="104" align="center">
            <template #default="{ row }">
              <el-image
                v-if="row.uid"
                class="cross-platform-product-selector__image"
                :src="buildCrossPlatformProductImageUrl(row.uid)"
                fit="cover"
                lazy
              >
                <template #error>
                  <div class="cross-platform-product-selector__image-fallback">暂无图片</div>
                </template>
              </el-image>
              <div v-else class="cross-platform-product-selector__image-fallback">暂无图片</div>
            </template>
          </el-table-column>

          <el-table-column prop="salesPlatform" label="销售平台" min-width="130">
            <template #default="{ row }">
              {{ findCrossPlatformOptionName(platformOptions, row.salesPlatform) }}
            </template>
          </el-table-column>

          <el-table-column prop="storeName" label="店铺名称" min-width="170" show-overflow-tooltip>
            <template #default="{ row }">
              {{ formatCrossPlatformProductCell(row.storeName) }}
            </template>
          </el-table-column>

          <el-table-column prop="productTitle" label="产品标题" min-width="320" show-overflow-tooltip>
            <template #default="{ row }">
              {{ formatCrossPlatformProductCell(row.productTitle) }}
            </template>
          </el-table-column>

          <el-table-column prop="countryCode" label="国家" min-width="100" align="center">
            <template #default="{ row }">
              {{ formatCrossPlatformProductCell(row.countryCode) }}
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="cross-platform-product-selector__pagination">
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

    <template #footer>
      <div class="cross-platform-product-selector__footer">
        <el-button
          v-if="showCancelBinding"
          type="danger"
          plain
          :loading="cancelBindingSubmitting"
          :disabled="submitting"
          @click="handleCancelBinding"
        >
          取消已有绑定
        </el-button>
        <el-button :disabled="submitting" @click="handleCancel">取消</el-button>
        <el-button
          type="primary"
          :loading="submitting"
          :disabled="!selectedProduct || submitting"
          @click="handleConfirm"
        >
          确认
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { RefreshLeft, Search } from '@element-plus/icons-vue'
import Request from '@/utils/Request'
import {
  buildCrossPlatformProductImageUrl,
  buildCrossPlatformProductListParams,
  CROSS_PLATFORM_PRODUCT_PLATFORM_OPTIONS,
  findCrossPlatformOptionName,
  formatCrossPlatformProductCell,
  getCrossPlatformOptionValue,
  normalizeCrossPlatformProduct,
} from '@/utils/CrossPlatformProduct'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '选择产品',
  },
  platformOptions: {
    type: Array,
    default: () => CROSS_PLATFORM_PRODUCT_PLATFORM_OPTIONS,
  },
  submitting: {
    type: Boolean,
    default: false,
  },
  showCancelBinding: {
    type: Boolean,
    default: false,
  },
  cancelBindingSubmitting: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel-binding'])

const queryForm = reactive({
  salesPlatform: '',
  storeId: '',
  productTitleFuzzy: '',
})
const pagination = reactive({
  pageNo: 1,
  pageSize: 15,
  totalCount: 0,
})
const productList = ref([])
const storeOptions = ref([])
const selectedProduct = ref(null)
const tableLoading = ref(false)
const storeLoading = ref(false)
const storeOptionCache = new Map()
const selectedProductUid = computed(() => selectedProduct.value?.uid || '')

let listRequestId = 0
let storeRequestId = 0
let destroyed = false

const getSelectedPlatformOption = () =>
  props.platformOptions.find(
    (option) => getCrossPlatformOptionValue(option) === queryForm.salesPlatform,
  )

const loadStoreOptions = async () => {
  const platformOption = getSelectedPlatformOption()
  const dictionaryPid = String(platformOption?.dictId ?? '')
  const requestId = ++storeRequestId

  if (!dictionaryPid) {
    storeOptions.value = []
    return null
  }
  if (storeOptionCache.has(dictionaryPid)) {
    storeOptions.value = storeOptionCache.get(dictionaryPid)
    return storeOptions.value
  }

  storeLoading.value = true
  const response = await Request({
    url: `/account/getAllEnableChildDictDataByPid/${encodeURIComponent(dictionaryPid)}`,
    method: 'post',
    showLoading: false,
  }).finally(() => {
    if (requestId === storeRequestId) storeLoading.value = false
  })

  if (!response || destroyed || requestId !== storeRequestId) return response
  const options = Array.isArray(response.data) ? response.data : []
  storeOptionCache.set(dictionaryPid, options)
  storeOptions.value = options
  return response
}

const loadProductList = async () => {
  const requestId = ++listRequestId
  tableLoading.value = true
  const response = await Request({
    url: '/productCommon/loadDataList',
    method: 'post',
    params: buildCrossPlatformProductListParams(queryForm, pagination),
    showLoading: false,
  }).finally(() => {
    if (requestId === listRequestId) tableLoading.value = false
  })

  if (!response || destroyed || requestId !== listRequestId) return response
  const pageData = response.data || {}
  productList.value = Array.isArray(pageData.list) ? pageData.list : []
  pagination.totalCount = Number(pageData.totalCount || 0)
  return response
}

const resetSelection = () => {
  selectedProduct.value = null
}

const resetQuery = () => {
  queryForm.salesPlatform = getCrossPlatformOptionValue(props.platformOptions[0])
  queryForm.storeId = ''
  queryForm.productTitleFuzzy = ''
  pagination.pageNo = 1
}

const initializeDialog = async () => {
  resetQuery()
  resetSelection()
  await Promise.all([loadStoreOptions(), loadProductList()])
}

const handlePlatformChange = async () => {
  queryForm.storeId = ''
  storeOptions.value = []
  pagination.pageNo = 1
  resetSelection()
  await loadStoreOptions()
}

const handleSearch = () => {
  pagination.pageNo = 1
  resetSelection()
  return loadProductList()
}

const handleReset = async () => {
  resetQuery()
  resetSelection()
  await loadStoreOptions()
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

const handleSelectProduct = (product) => {
  selectedProduct.value = normalizeCrossPlatformProduct(product)
}

const handleVisibleChange = (visible) => {
  if (!props.submitting) emit('update:modelValue', visible)
}

const handleCancel = () => {
  if (!props.submitting) emit('update:modelValue', false)
}

const handleConfirm = () => {
  if (selectedProduct.value && !props.submitting) emit('confirm', selectedProduct.value)
}

const handleCancelBinding = () => {
  if (!props.submitting) emit('cancel-binding')
}

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) void initializeDialog()
    else {
      listRequestId += 1
      storeRequestId += 1
      tableLoading.value = false
      storeLoading.value = false
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  destroyed = true
  listRequestId += 1
  storeRequestId += 1
})
</script>

<style scoped lang="scss"></style>
