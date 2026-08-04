<template>
  <section class="page-shell shopify-order-page">
    <div class="work-panel shopify-order-panel">
      <el-row :gutter="12" class="search-row shopify-order-search-row">
        <el-col :xs="24" :sm="12" :md="8" :lg="6">
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
              :value="getShopifyStoreOptionValue(item)"
            />
          </el-select>
        </el-col>

        <el-col :xs="24" :sm="12" :md="8" :lg="6">
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
              :value="getShopifyStoreOptionValue(item)"
            />
          </el-select>
        </el-col>

        <el-col :xs="24" :sm="12" :md="8" :lg="6">
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
              :value="getShopifyStoreOptionValue(item)"
            />
          </el-select>
        </el-col>

        <el-col :xs="24" :sm="12" :md="8" :lg="6">
          <el-select
            v-model="queryForm.customerCountryCodeList"
            placeholder="请选择国家"
            multiple
            filterable
            :reserve-keyword="false"
            clearable
            collapse-tags
            collapse-tags-tooltip
          >
            <el-option
              v-for="item in countryOptions"
              :key="item.dictId"
              :label="item.dictName"
              :value="getShopifyStoreOptionValue(item)"
            />
          </el-select>
        </el-col>

        <el-col :xs="24" :sm="12" :md="8" :lg="6">
          <el-select
            v-model="queryForm.displayFinancialStatusList"
            placeholder="请选择支付状态"
            multiple
            filterable
            :reserve-keyword="false"
            clearable
            collapse-tags
            collapse-tags-tooltip
          >
            <el-option
              v-for="item in financialStatusOptions"
              :key="item.dictId"
              :label="item.dictName"
              :value="getShopifyStoreOptionValue(item)"
            />
          </el-select>
        </el-col>

        <el-col :xs="24" :sm="12" :md="8" :lg="6">
          <el-select
            v-model="queryForm.displayFulfillmentStatusList"
            placeholder="请选择履约状态"
            multiple
            filterable
            :reserve-keyword="false"
            clearable
            collapse-tags
            collapse-tags-tooltip
          >
            <el-option
              v-for="item in fulfillmentStatusOptions"
              :key="item.dictId"
              :label="item.dictName"
              :value="getShopifyStoreOptionValue(item)"
            />
          </el-select>
        </el-col>

        <el-col :xs="24" :sm="12" :md="8" :lg="6">
          <el-input
            v-model="queryForm.orderName"
            placeholder="请输入订单名称"
            clearable
            :prefix-icon="Search"
            @keyup.enter="handleSearch"
          />
        </el-col>

        <el-col :xs="24" :sm="12" :md="8" :lg="6">
          <el-input
            v-model="queryForm.customerEmailFuzzy"
            placeholder="请输入客户邮箱"
            clearable
            :prefix-icon="Search"
            @keyup.enter="handleSearch"
          />
        </el-col>

        <el-col :xs="24" :sm="12" :md="8" :lg="6">
          <el-input
            v-model="queryForm.discountCodeFuzzy"
            placeholder="请输入折扣码"
            clearable
            :prefix-icon="Search"
            @keyup.enter="handleSearch"
          />
        </el-col>

        <el-col :xs="24" :sm="12" :md="10" :lg="10">
          <el-date-picker
            v-model="queryForm.createdAtRange"
            type="daterange"
            unlink-panels
            range-separator="至"
            start-placeholder="创建开始日期"
            end-placeholder="创建结束日期"
            value-format="YYYY-MM-DD"
            :shortcuts="dateShortcuts"
            :disabled-date="disableShopifyFutureDate"
            clearable
          />
        </el-col>

        <el-col :xs="24" :sm="24" :md="6" :lg="8" class="shopify-order-search-actions">
          <div class="shopify-order-search-button-group">
            <el-button type="success" @click="handleOpenProductSelector">指定产品</el-button>
            <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
            <el-button :icon="RefreshLeft" @click="handleReset">重置</el-button>
            <el-tag
              v-if="selectedProduct"
              class="shopify-order-selected-product"
              effect="plain"
              type="success"
            >
              已选：{{ selectedProductSummary }}
            </el-tag>
          </div>
        </el-col>
      </el-row>

      <div class="shopify-order-table-scroll">
        <el-table
          v-loading="tableLoading"
          :data="orderList"
          class="basic-table shopify-order-table"
          height="100%"
          border
          stripe
          empty-text="暂无 Shopify 订单数据"
        >
          <el-table-column prop="storeId" label="店铺" min-width="150" fixed="left">
            <template #default="{ row }">
              {{ findShopifyDictionaryName(storeOptions, row.storeId) }}
            </template>
          </el-table-column>

          <el-table-column
            prop="orderName"
            label="订单号名称"
            min-width="140"
            fixed="left"
            show-overflow-tooltip
          >
            <template #default="{ row }">
              {{ formatShopifyOrderCell(row.orderName) }}
            </template>
          </el-table-column>

          <el-table-column label="订单项详情" min-width="640">
            <template #default="{ row }">
              <ShopifyOrderItemList
                :items="row.orderItemList"
                :store-id="row.storeId"
                :currency-code="row.currencyCode"
              />
            </template>
          </el-table-column>

          <el-table-column prop="displayFinancialStatus" label="付款状态" min-width="140" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.displayFinancialStatus" type="info" effect="plain">
                {{ findShopifyDictionaryName(financialStatusOptions, row.displayFinancialStatus) }}
              </el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>

          <el-table-column
            prop="displayFulfillmentStatus"
            label="履约状态"
            min-width="150"
            align="center"
          >
            <template #default="{ row }">
              <el-tag v-if="row.displayFulfillmentStatus" type="warning" effect="plain">
                {{ findShopifyDictionaryName(fulfillmentStatusOptions, row.displayFulfillmentStatus) }}
              </el-tag>
              <span v-else>-</span>
            </template>
          </el-table-column>

          <el-table-column prop="totalPrice" label="订单金额" min-width="140" align="right">
            <template #default="{ row }">
              {{ formatShopifyOrderAmount(row.totalPrice, row.currencyCode) }}
            </template>
          </el-table-column>

          <el-table-column prop="totalDiscount" label="订单折扣" min-width="140" align="right">
            <template #default="{ row }">
              {{ formatShopifyOrderAmount(row.totalDiscount, row.currencyCode) }}
            </template>
          </el-table-column>

          <el-table-column prop="totalRefunded" label="退款金额" min-width="140" align="right">
            <template #default="{ row }">
              {{ formatShopifyOrderAmount(row.totalRefunded, row.currencyCode) }}
            </template>
          </el-table-column>

          <el-table-column
            prop="discountCode"
            label="折扣码"
            min-width="150"
            show-overflow-tooltip
          >
            <template #default="{ row }">
              {{ formatShopifyOrderCell(row.discountCode) }}
            </template>
          </el-table-column>

          <el-table-column
            prop="customerEmail"
            label="客户邮箱"
            min-width="220"
            show-overflow-tooltip
          >
            <template #default="{ row }">
              {{ formatShopifyOrderCell(row.customerEmail) }}
            </template>
          </el-table-column>

          <el-table-column prop="customerCountryCode" label="国家" min-width="100" align="center">
            <template #default="{ row }">
              {{ findShopifyDictionaryName(countryOptions, row.customerCountryCode) }}
            </template>
          </el-table-column>

          <el-table-column prop="createdAt" label="创建时间" min-width="180" show-overflow-tooltip>
            <template #default="{ row }">
              {{ formatShopifyOrderCell(row.createdAt) }}
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="shopify-order-pagination">
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
import { RefreshLeft, Search } from '@element-plus/icons-vue'
import ShopifyOrderItemList from '@/components/shopify-order/ShopifyOrderItemList.vue'
import ShopifyOrderProductSelectorDialog from '@/components/shopify-order/ShopifyOrderProductSelectorDialog.vue'
import Request from '@/utils/Request'
import {
  buildShopifyOrderListParams,
  createShopifyOrderDefaultDateRange,
  createShopifyOrderDateShortcuts,
  disableShopifyFutureDate,
  findShopifyDictionaryName,
  formatShopifyOrderAmount,
  formatShopifyOrderCell,
  formatShopifyOrderProductSelection,
  getShopifyStoreOptionValue,
  normalizeShopifyOrderProductSelection,
} from '@/utils/ShopifyOrder'

const DICTIONARY_PARENT_IDS = {
  store: 'DTAzyuRYrK1TNJihuw40',
  brand: 'vDAWBhM9UrKRagD5rrKc',
  personInCharge: 'rHvpefC53Kov2CEQa1v3',
  country: 'eWkT9R7hyW8RHHhwJ0AT',
  financialStatus: 'GFkjz6vq9De2G1m0ZgDP',
  fulfillmentStatus: '0KIzLRNZXZwihNm77GQd',
}

const queryForm = reactive({
  storeIdList: [],
  brandList: [],
  personInChargeList: [],
  storeId: '',
  productId: '',
  variantId: '',
  customerCountryCodeList: [],
  displayFinancialStatusList: [],
  displayFulfillmentStatusList: [],
  orderName: '',
  customerEmailFuzzy: '',
  discountCodeFuzzy: '',
  createdAtRange: createShopifyOrderDefaultDateRange(),
})
const pagination = reactive({
  pageNo: 1,
  pageSize: 15,
  totalCount: 0,
})

const tableLoading = ref(false)
const orderList = ref([])
const storeOptions = ref([])
const brandOptions = ref([])
const personOptions = ref([])
const countryOptions = ref([])
const financialStatusOptions = ref([])
const fulfillmentStatusOptions = ref([])
const productSelectorVisible = ref(false)
const selectedProduct = ref(null)
const selectedProductSummary = computed(() =>
  formatShopifyOrderProductSelection(selectedProduct.value),
)
const dateShortcuts = createShopifyOrderDateShortcuts()

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

  return response
}

const loadOrderList = async () => {
  const requestId = ++listRequestId
  tableLoading.value = true
  const response = await Request({
    url: '/shopify/loadShopifyOrderListByMultiQuery',
    method: 'post',
    params: buildShopifyOrderListParams(queryForm, pagination),
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
  orderList.value = Array.isArray(pageData.list) ? pageData.list : []
  pagination.totalCount = Number(pageData.totalCount || 0)
  return response
}

const handleSearch = () => {
  pagination.pageNo = 1
  return loadOrderList()
}

const handleOpenProductSelector = () => {
  productSelectorVisible.value = true
}

const handleProductSelected = (product) => {
  const normalizedProduct = normalizeShopifyOrderProductSelection(product)
  if (!normalizedProduct) return null

  selectedProduct.value = normalizedProduct
  queryForm.storeIdList = []
  queryForm.brandList = []
  queryForm.personInChargeList = []
  queryForm.storeId = normalizedProduct.storeId
  queryForm.productId = normalizedProduct.productId
  queryForm.variantId = normalizedProduct.variantId
  productSelectorVisible.value = false
  pagination.pageNo = 1
  return loadOrderList()
}

const handleReset = () => {
  queryForm.storeIdList = []
  queryForm.brandList = []
  queryForm.personInChargeList = []
  queryForm.storeId = ''
  queryForm.productId = ''
  queryForm.variantId = ''
  queryForm.customerCountryCodeList = []
  queryForm.displayFinancialStatusList = []
  queryForm.displayFulfillmentStatusList = []
  queryForm.orderName = ''
  queryForm.customerEmailFuzzy = ''
  queryForm.discountCodeFuzzy = ''
  queryForm.createdAtRange = createShopifyOrderDefaultDateRange()
  selectedProduct.value = null
  productSelectorVisible.value = false
  pagination.pageNo = 1
  return loadOrderList()
}

const handlePageSizeChange = (pageSize) => {
  pagination.pageSize = pageSize
  pagination.pageNo = 1
  return loadOrderList()
}

const handlePageNoChange = (pageNo) => {
  pagination.pageNo = pageNo
  return loadOrderList()
}

onMounted(() => {
  Promise.all([
    loadOrderList(),
    loadDictionaryOptions(DICTIONARY_PARENT_IDS.store, storeOptions),
    loadDictionaryOptions(DICTIONARY_PARENT_IDS.brand, brandOptions),
    loadDictionaryOptions(DICTIONARY_PARENT_IDS.personInCharge, personOptions),
    loadDictionaryOptions(DICTIONARY_PARENT_IDS.country, countryOptions),
    loadDictionaryOptions(DICTIONARY_PARENT_IDS.financialStatus, financialStatusOptions),
    loadDictionaryOptions(DICTIONARY_PARENT_IDS.fulfillmentStatus, fulfillmentStatusOptions),
  ])
})

onBeforeUnmount(() => {
  destroyed = true
  listRequestId += 1
})
</script>

<style scoped lang="scss"></style>
