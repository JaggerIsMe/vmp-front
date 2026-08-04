<template>
  <section class="page-shell shopify-sales-performance-page">
    <div class="work-panel shopify-sales-performance-filter-panel">
      <el-row
        class="search-row shopify-sales-performance-search-row"
        :gutter="12"
      >
        <el-col :xs="24" :sm="12" :md="8" :lg="6">
          <el-select
            v-model="queryForm.storeIdList"
            multiple
            filterable
            :reserve-keyword="false"
            :disabled="Boolean(selectedProduct)"
            clearable
            collapse-tags
            collapse-tags-tooltip
            placeholder="请选择店铺"
          >
            <el-option
              v-for="item in storeOptions"
              :key="item.dictId || item.dictCode"
              :label="item.dictName"
              :value="getShopifyStoreOptionValue(item)"
            />
          </el-select>
        </el-col>

        <el-col :xs="24" :sm="12" :md="8" :lg="6">
          <el-select
            v-model="queryForm.brandList"
            multiple
            filterable
            :reserve-keyword="false"
            :disabled="Boolean(selectedProduct)"
            clearable
            collapse-tags
            collapse-tags-tooltip
            placeholder="请选择品牌"
          >
            <el-option
              v-for="item in brandOptions"
              :key="item.dictId || item.dictCode"
              :label="item.dictName"
              :value="getShopifyStoreOptionValue(item)"
            />
          </el-select>
        </el-col>

        <el-col :xs="24" :sm="12" :md="8" :lg="6">
          <el-select
            v-model="queryForm.personInChargeList"
            multiple
            filterable
            :reserve-keyword="false"
            :disabled="Boolean(selectedProduct)"
            clearable
            collapse-tags
            collapse-tags-tooltip
            placeholder="请选择负责人"
          >
            <el-option
              v-for="item in personOptions"
              :key="item.dictId || item.dictCode"
              :label="item.dictName"
              :value="getShopifyStoreOptionValue(item)"
            />
          </el-select>
        </el-col>

        <el-col :xs="24" :sm="12" :md="8" :lg="6">
          <el-select
            v-model="queryForm.customerCountryCodeList"
            multiple
            filterable
            :reserve-keyword="false"
            clearable
            collapse-tags
            collapse-tags-tooltip
            placeholder="请选择国家"
          >
            <el-option
              v-for="item in countryOptions"
              :key="item.dictId || item.dictCode"
              :label="item.dictName"
              :value="getShopifyStoreOptionValue(item)"
            />
          </el-select>
        </el-col>

        <el-col :xs="24" :sm="24" :md="12" :lg="10">
          <el-date-picker
            v-model="queryForm.createdAtRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            :shortcuts="dateShortcuts"
            :disabled-date="disableShopifyFutureDate"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            unlink-panels
            clearable
          />
        </el-col>

        <el-col
          class="shopify-sales-performance-search-actions"
          :xs="24"
          :sm="24"
          :md="12"
          :lg="14"
        >
          <div class="shopify-sales-performance-search-button-group">
            <el-button type="success" @click="handleOpenProductSelector">指定产品</el-button>
            <el-button type="primary" :icon="Refresh" @click="handleRefresh">刷新</el-button>
            <el-tag
              v-if="selectedProduct"
              closable
              effect="plain"
              type="success"
              class="shopify-sales-performance-selected-product"
              @close="handleClearProduct"
            >
              已选：{{ selectedProductSummary }}
            </el-tag>
          </div>
        </el-col>
      </el-row>
    </div>

    <div v-loading="chartLoading" class="work-panel shopify-sales-performance-chart-panel">
      <div class="shopify-sales-performance-chart-header">
        <div>
          <p class="page-kicker">Shopify 数据趋势</p>
          <h2>{{ timeDimensionTitle }}销售与流量趋势</h2>
        </div>
        <div class="shopify-sales-performance-chart-controls">
          <el-radio-group
            v-model="timeDimension"
            size="small"
            aria-label="时间维度"
          >
            <el-radio-button
              v-for="option in timeDimensionOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </el-radio-button>
          </el-radio-group>
          <span>{{ selectedDateSummary }}</span>
        </div>
      </div>
      <div class="shopify-sales-performance-content">
        <ShopifySalesPerformanceChart
          :rows="dailyPerformance"
          :dimension="timeDimension"
        />
        <ShopifySalesSummaryCards
          :rows="dailyPerformance"
          :dimension="timeDimension"
        />
      </div>
    </div>

    <ShopifyOrderProductSelectorDialog
      v-model="productSelectorVisible"
      :store-options="storeOptions"
      :selected-product="selectedProduct"
      @confirm="handleProductSelected"
    />
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import ShopifySalesPerformanceChart from '@/components/shopify-dashboard/ShopifySalesPerformanceChart.vue'
import ShopifySalesSummaryCards from '@/components/shopify-dashboard/ShopifySalesSummaryCards.vue'
import ShopifyOrderProductSelectorDialog from '@/components/shopify-order/ShopifyOrderProductSelectorDialog.vue'
import Message from '@/utils/Message'
import Request from '@/utils/Request'
import {
  createShopifyOrderDateShortcuts,
  disableShopifyFutureDate,
  formatShopifyOrderProductSelection,
  getShopifyStoreOptionValue,
  normalizeShopifyOrderProductSelection,
} from '@/utils/ShopifyOrder'
import {
  buildShopifySalesPerformanceParams,
  createDefaultShopifySalesDateRange,
} from '@/utils/ShopifySalesPerformance'

const DICTIONARY_PARENT_IDS = {
  store: 'DTAzyuRYrK1TNJihuw40',
  brand: 'vDAWBhM9UrKRagD5rrKc',
  personInCharge: 'rHvpefC53Kov2CEQa1v3',
  country: 'eWkT9R7hyW8RHHhwJ0AT',
}

const queryForm = reactive({
  storeIdList: [],
  brandList: [],
  personInChargeList: [],
  customerCountryCodeList: [],
  storeId: '',
  productId: '',
  variantId: '',
  createdAtRange: createDefaultShopifySalesDateRange(),
})

const dailyPerformance = ref([])
const chartLoading = ref(false)
const timeDimension = ref('day')
const timeDimensionOptions = [
  { value: 'day', label: '日', title: '按日' },
  { value: 'week', label: '周', title: '按周' },
  { value: 'month', label: '月', title: '按月' },
  { value: 'year', label: '年', title: '按年' },
]
const storeOptions = ref([])
const brandOptions = ref([])
const personOptions = ref([])
const countryOptions = ref([])
const productSelectorVisible = ref(false)
const selectedProduct = ref(null)
const selectedProductSummary = computed(() =>
  formatShopifyOrderProductSelection(selectedProduct.value),
)
const timeDimensionTitle = computed(
  () => timeDimensionOptions.find(({ value }) => value === timeDimension.value)?.title || '按日',
)
const selectedDateSummary = computed(() =>
  Array.isArray(queryForm.createdAtRange) && queryForm.createdAtRange.length === 2
    ? `${queryForm.createdAtRange[0]} 至 ${queryForm.createdAtRange[1]}`
    : '未选择日期',
)
const dateShortcuts = createShopifyOrderDateShortcuts()

let performanceRequestId = 0
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

  return response
}

const loadDailyPerformance = async () => {
  const params = buildShopifySalesPerformanceParams(queryForm)
  if (!params) {
    performanceRequestId += 1
    chartLoading.value = false
    Message.warning('请选择日期范围')
    return null
  }

  const requestId = ++performanceRequestId
  chartLoading.value = true
  const response = await Request({
    url: '/shopify/getShopifySalesDailyPerformance',
    method: 'post',
    params,
    showLoading: false,
  }).finally(() => {
    if (requestId === performanceRequestId) chartLoading.value = false
  })

  if (!response || destroyed || requestId !== performanceRequestId) return response
  dailyPerformance.value = Array.isArray(response.data) ? response.data : []
  return response
}

const handleRefresh = () => loadDailyPerformance()

const handleOpenProductSelector = () => {
  productSelectorVisible.value = true
}

const handleProductSelected = (product) => {
  const normalized = normalizeShopifyOrderProductSelection(product)
  if (!normalized) return null
  selectedProduct.value = normalized
  queryForm.storeIdList = []
  queryForm.brandList = []
  queryForm.personInChargeList = []
  queryForm.storeId = normalized.storeId
  queryForm.productId = normalized.productId
  queryForm.variantId = normalized.variantId
  productSelectorVisible.value = false
  return normalized
}

const handleClearProduct = () => {
  selectedProduct.value = null
  queryForm.storeId = ''
  queryForm.productId = ''
  queryForm.variantId = ''
}

onMounted(() => {
  Promise.all([
    loadDailyPerformance(),
    loadDictionaryOptions(DICTIONARY_PARENT_IDS.store, storeOptions),
    loadDictionaryOptions(DICTIONARY_PARENT_IDS.brand, brandOptions),
    loadDictionaryOptions(DICTIONARY_PARENT_IDS.personInCharge, personOptions),
    loadDictionaryOptions(DICTIONARY_PARENT_IDS.country, countryOptions),
  ])
})

onBeforeUnmount(() => {
  destroyed = true
  performanceRequestId += 1
})
</script>

<style scoped lang="scss"></style>
