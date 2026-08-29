<template>
  <section class="page-shell google-ads-page">
    <div v-show="summaryCardsVisible" v-loading="summaryLoading" class="google-ads-metric-grid">
      <article
        v-for="card in summaryCards"
        :key="card.key"
        class="google-ads-metric-card"
        :data-kind="card.kind"
      >
        <div class="google-ads-metric-card__header">
          <span>{{ card.label }}</span>
          <component :is="card.icon" class="google-ads-metric-card__icon" />
        </div>
        <strong>{{ card.value }}</strong>
        <small>{{ selectedDateSummary }}</small>
      </article>
    </div>

    <div class="work-panel google-ads-list-panel">
      <div class="google-ads-panel-heading">
        <div>
          <p class="page-kicker">Google Ads</p>
          <h2>广告系列数据</h2>
        </div>
        <el-button
          text
          type="primary"
          :icon="summaryCardsVisible ? ArrowUp : ArrowDown"
          @click="summaryCardsVisible = !summaryCardsVisible"
        >
          {{ summaryCardsVisible ? '隐藏数据卡片' : '显示数据卡片' }}
        </el-button>
      </div>

      <el-row :gutter="12" class="search-row google-ads-search-row">
        <el-col :xs="24" :sm="12" :md="8" :lg="5">
          <el-input
            v-model="queryForm.campaignNameFuzzy"
            placeholder="请输入广告系列名称"
            clearable
            :prefix-icon="Search"
            @keyup.enter="handleSearch"
          />
        </el-col>

        <el-col :xs="24" :sm="12" :md="8" :lg="4">
          <el-select v-model="queryForm.status" placeholder="请选择广告状态" clearable>
            <el-option
              v-for="option in statusOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
        </el-col>

        <el-col :xs="24" :sm="12" :md="8" :lg="4">
          <el-select
            v-model="queryForm.personInCharge"
            placeholder="请选择负责人"
            filterable
            clearable
          >
            <el-option
              v-for="option in personOptions"
              :key="option.dictId"
              :label="option.dictName"
              :value="option.dictId"
            />
          </el-select>
        </el-col>

        <el-col :xs="24" :sm="24" :md="16" :lg="7">
          <el-date-picker
            v-model="queryForm.dateRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            unlink-panels
            clearable
            :shortcuts="dateShortcuts"
            :disabled-date="disableFutureDate"
          />
        </el-col>

        <el-col :xs="24" :sm="24" :md="24" :lg="24" class="google-ads-search-actions">
          <el-button type="success" @click="handleOpenSpecifiedProductDialog">指定产品</el-button>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="RefreshLeft" @click="handleReset">重置</el-button>
          <el-button type="warning" @click="handleOpenAllocatePersonDialog">分配投手</el-button>
          <el-button type="success" plain @click="handleOpenLinkProductDialog">绑定产品</el-button>
          <el-tag
            v-if="specifiedProduct"
            type="success"
            effect="plain"
            closable
            class="google-ads-specified-product"
            :title="specifiedProductSummary"
            @close="handleClearSpecifiedProduct"
          >
            已指定：{{ specifiedProductSummary }}
          </el-tag>
        </el-col>
      </el-row>

      <div class="google-ads-table-scroll">
        <el-table
          ref="tableRef"
          v-loading="tableLoading"
          :data="campaignList"
          row-key="campaignId"
          class="basic-table google-ads-table"
          height="100%"
          border
          stripe
          empty-text="暂无 Google 广告系列数据"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="48" fixed="left" align="center" />

          <el-table-column
            prop="campaignName"
            label="广告系列"
            min-width="240"
            fixed="left"
            show-overflow-tooltip
          >
            <template #default="{ row }">{{ formatGoogleAdsCell(row.campaignName) }}</template>
          </el-table-column>

          <el-table-column prop="budgetAmount" label="预算" min-width="135" align="right">
            <template #default="{ row }">
              {{ formatGoogleAdsAmount(row.budgetAmount, row.currencyCode) }}
            </template>
          </el-table-column>

          <el-table-column prop="status" label="状态" min-width="100" align="center">
            <template #default="{ row }">
              <el-tag
                v-if="getGoogleAdsStatusOption(row.status)"
                :type="getGoogleAdsStatusOption(row.status).tagType"
                effect="plain"
              >
                {{ getGoogleAdsStatusOption(row.status).label }}
              </el-tag>
              <span v-else>{{ formatGoogleAdsCell(row.status) }}</span>
            </template>
          </el-table-column>

          <el-table-column
            prop="advertisingChannelType"
            label="广告系列类型"
            min-width="140"
            align="center"
          >
            <template #default="{ row }">
              {{
                channelTypeLabels[row.advertisingChannelType] ||
                formatGoogleAdsCell(row.advertisingChannelType)
              }}
            </template>
          </el-table-column>

          <el-table-column prop="costAmount" label="广告花费" min-width="140" align="right">
            <template #default="{ row }">
              {{ formatGoogleAdsAmount(row.costAmount, row.currencyCode) }}
            </template>
          </el-table-column>

          <el-table-column prop="impressions" label="展示次数" min-width="120" align="right">
            <template #default="{ row }">{{ formatGoogleAdsCount(row.impressions) }}</template>
          </el-table-column>

          <el-table-column prop="clicks" label="点击次数" min-width="110" align="right">
            <template #default="{ row }">{{ formatGoogleAdsCount(row.clicks) }}</template>
          </el-table-column>

          <el-table-column prop="conversions" label="转化次数" min-width="120" align="right">
            <template #default="{ row }">{{ formatGoogleAdsCount(row.conversions, 2) }}</template>
          </el-table-column>

          <el-table-column
            prop="conversionsValue"
            label="转化价值"
            min-width="140"
            align="right"
          >
            <template #default="{ row }">
              {{ formatGoogleAdsAmount(row.conversionsValue, row.currencyCode) }}
            </template>
          </el-table-column>

          <el-table-column prop="ctr" label="点击率" min-width="100" align="right">
            <template #default="{ row }">{{ formatGoogleAdsRate(row.ctr) }}</template>
          </el-table-column>

          <el-table-column prop="cpc" label="单次点击费用" min-width="135" align="right">
            <template #default="{ row }">
              {{ formatGoogleAdsAmount(row.cpc, row.currencyCode) }}
            </template>
          </el-table-column>

          <el-table-column prop="cvr" label="转化率" min-width="100" align="right">
            <template #default="{ row }">{{ formatGoogleAdsRate(row.cvr) }}</template>
          </el-table-column>

          <el-table-column prop="roas" label="回报率" min-width="100" align="right">
            <template #default="{ row }">{{ formatGoogleAdsRoas(row.roas) }}</template>
          </el-table-column>

          <el-table-column prop="cpa" label="单次行动成本" min-width="135" align="right">
            <template #default="{ row }">
              {{ formatGoogleAdsAmount(row.cpa, row.currencyCode) }}
            </template>
          </el-table-column>

          <el-table-column label="绑定产品" min-width="390">
            <template #default="{ row }">
              <div
                v-if="row.crossPlatformProductCommonInfoVO"
                class="google-ads-bound-product"
              >
                <el-image
                  v-if="row.crossPlatformProductCommonInfoVO.uid"
                  class="google-ads-bound-product__image"
                  :src="buildCrossPlatformProductImageUrl(row.crossPlatformProductCommonInfoVO.uid)"
                  fit="cover"
                  lazy
                >
                  <template #error>
                    <div class="google-ads-bound-product__image-fallback">暂无图片</div>
                  </template>
                </el-image>
                <div v-else class="google-ads-bound-product__image-fallback">暂无图片</div>

                <div class="google-ads-bound-product__details">
                  <div class="google-ads-bound-product__field">
                    <span>平台</span>
                    <b>
                      {{
                        findCrossPlatformOptionName(
                          crossPlatformProductOptions,
                          row.crossPlatformProductCommonInfoVO.salesPlatform,
                        )
                      }}
                    </b>
                  </div>
                  <div class="google-ads-bound-product__field">
                    <span>店铺</span>
                    <b :title="row.crossPlatformProductCommonInfoVO.storeName">
                      {{
                        formatCrossPlatformProductCell(
                          row.crossPlatformProductCommonInfoVO.storeName,
                        )
                      }}
                    </b>
                  </div>
                  <div class="google-ads-bound-product__field">
                    <span>标题</span>
                    <b :title="row.crossPlatformProductCommonInfoVO.productTitle">
                      {{
                        formatCrossPlatformProductCell(
                          row.crossPlatformProductCommonInfoVO.productTitle,
                        )
                      }}
                    </b>
                  </div>
                  <div class="google-ads-bound-product__field">
                    <span>国家</span>
                    <b>
                      {{
                        formatCrossPlatformProductCell(
                          row.crossPlatformProductCommonInfoVO.countryCode,
                        )
                      }}
                    </b>
                  </div>
                </div>
              </div>
              <span v-else>-</span>
            </template>
          </el-table-column>

          <el-table-column
            prop="personInCharge"
            label="负责人"
            min-width="120"
            fixed="right"
            show-overflow-tooltip
          >
            <template #default="{ row }">
              {{ findGoogleAdsPersonName(personOptions, row.personInCharge) }}
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="google-ads-pagination">
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

    <GoogleAdsAllocatePersonDialog
      v-model="allocatePersonDialogVisible"
      :campaigns="allocateCampaigns"
      :person-options="personOptions"
      @saved="handleAllocatePersonSaved"
    />

    <CrossPlatformProductSelectorDialog
      v-model="specifiedProductDialogVisible"
      title="指定产品"
      :platform-options="crossPlatformProductOptions"
      @confirm="handleSpecifiedProductConfirm"
    />

    <CrossPlatformProductSelectorDialog
      v-model="linkProductDialogVisible"
      title="绑定产品"
      :platform-options="crossPlatformProductOptions"
      :submitting="linkProductSubmitting || cancelLinkProductSubmitting"
      show-cancel-binding
      :cancel-binding-submitting="cancelLinkProductSubmitting"
      @confirm="handleLinkProductConfirm"
      @cancel-binding="handleCancelLinkProduct"
    />
  </section>
</template>

<script setup>
import { computed, markRaw, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import {
  ArrowDown,
  ArrowUp,
  Finished,
  Money,
  Mouse,
  RefreshLeft,
  Search,
  TrendCharts,
  View,
} from '@element-plus/icons-vue'
import CrossPlatformProductSelectorDialog from '@/components/cross-platform-product/CrossPlatformProductSelectorDialog.vue'
import GoogleAdsAllocatePersonDialog from '@/components/google-ads/GoogleAdsAllocatePersonDialog.vue'
import Confirm from '@/utils/Confirm'
import Message from '@/utils/Message'
import Request from '@/utils/Request'
import {
  createDateRangeShortcuts,
  createDefaultDateRange,
  disableFutureDate,
} from '@/utils/DateRange'
import {
  buildCrossPlatformProductImageUrl,
  CROSS_PLATFORM_PRODUCT_PLATFORM_OPTIONS,
  findCrossPlatformOptionName,
  formatCrossPlatformProductCell,
} from '@/utils/CrossPlatformProduct'
import {
  aggregateGoogleAdsDailyPerformance,
  buildGoogleAdsCommonParams,
  buildGoogleAdsListParams,
  findGoogleAdsPersonName,
  formatGoogleAdsAmount,
  formatGoogleAdsCell,
  formatGoogleAdsCount,
  formatGoogleAdsRate,
  formatGoogleAdsRoas,
  getGoogleAdsStatusOption,
  GOOGLE_ADS_CAMPAIGN_STATUS_OPTIONS,
  GOOGLE_ADS_CHANNEL_TYPE_LABELS,
} from '@/utils/GoogleAds'

const PERSON_DICTIONARY_PARENT_ID = 'rHvpefC53Kov2CEQa1v3'

const queryForm = reactive({
  campaignNameFuzzy: '',
  status: '',
  personInCharge: '',
  mappingProductUid: '',
  dateRange: createDefaultDateRange(),
})
const pagination = reactive({
  pageNo: 1,
  pageSize: 15,
  totalCount: 0,
})

const campaignList = ref([])
const dailyPerformance = ref([])
const summaryCardsVisible = ref(true)
const personOptions = ref([])
const selectedCampaigns = ref([])
const specifiedProduct = ref(null)
const specifiedProductDialogVisible = ref(false)
const allocateCampaigns = ref([])
const allocatePersonDialogVisible = ref(false)
const linkCampaigns = ref([])
const linkProductDialogVisible = ref(false)
const linkProductSubmitting = ref(false)
const cancelLinkProductSubmitting = ref(false)
const tableRef = ref(null)
const tableLoading = ref(false)
const summaryLoading = ref(false)
const dateShortcuts = createDateRangeShortcuts()
const statusOptions = GOOGLE_ADS_CAMPAIGN_STATUS_OPTIONS
const channelTypeLabels = GOOGLE_ADS_CHANNEL_TYPE_LABELS
const crossPlatformProductOptions = CROSS_PLATFORM_PRODUCT_PLATFORM_OPTIONS

const selectedDateSummary = computed(() =>
  Array.isArray(queryForm.dateRange) && queryForm.dateRange.length === 2
    ? `${queryForm.dateRange[0]} 至 ${queryForm.dateRange[1]}`
    : '未选择日期',
)
const specifiedProductSummary = computed(
  () => specifiedProduct.value?.productTitle || specifiedProduct.value?.uid || '-',
)
const summary = computed(() => aggregateGoogleAdsDailyPerformance(dailyPerformance.value))
const summaryCards = computed(() => [
  {
    key: 'costAmount',
    label: '总广告花费',
    value: formatGoogleAdsAmount(summary.value.costAmount),
    icon: markRaw(Money),
    kind: 'blue',
  },
  {
    key: 'conversionsValue',
    label: '总转化价值',
    value: formatGoogleAdsAmount(summary.value.conversionsValue),
    icon: markRaw(TrendCharts),
    kind: 'green',
  },
  {
    key: 'impressions',
    label: '总展示次数',
    value: formatGoogleAdsCount(summary.value.impressions),
    icon: markRaw(View),
    kind: 'violet',
  },
  {
    key: 'clicks',
    label: '总点击次数',
    value: formatGoogleAdsCount(summary.value.clicks),
    icon: markRaw(Mouse),
    kind: 'orange',
  },
  {
    key: 'conversions',
    label: '总转化次数',
    value: formatGoogleAdsCount(summary.value.conversions, 2),
    icon: markRaw(Finished),
    kind: 'cyan',
  },
])

let listRequestId = 0
let summaryRequestId = 0
let destroyed = false

const loadPersonOptions = async () => {
  const response = await Request({
    url: `/account/getAllEnableChildDictDataByPid/${encodeURIComponent(PERSON_DICTIONARY_PARENT_ID)}`,
    method: 'post',
    showLoading: false,
  })
  if (!destroyed && response) {
    personOptions.value = Array.isArray(response.data) ? response.data : []
  }
  return response
}

const loadCampaignList = async () => {
  const params = buildGoogleAdsListParams(queryForm, pagination)
  if (!params) return null

  const requestId = ++listRequestId
  tableLoading.value = true
  const response = await Request({
    url: '/googleAds/loadGoogleAdsCampaignMetrics',
    method: 'post',
    params,
    showLoading: false,
  }).finally(() => {
    if (requestId === listRequestId) tableLoading.value = false
  })

  if (!response || destroyed || requestId !== listRequestId) return response
  const pageData = response.data || {}
  tableRef.value?.clearSelection()
  selectedCampaigns.value = []
  campaignList.value = Array.isArray(pageData.list) ? pageData.list : []
  pagination.totalCount = Number(pageData.totalCount || 0)
  return response
}

const loadDailyPerformance = async () => {
  const params = buildGoogleAdsCommonParams(queryForm)
  if (!params) return null

  const requestId = ++summaryRequestId
  summaryLoading.value = true
  const response = await Request({
    url: '/googleAds/getGoogleAdsCampaignMetricsDailyPerformance',
    method: 'post',
    params,
    showLoading: false,
  }).finally(() => {
    if (requestId === summaryRequestId) summaryLoading.value = false
  })

  if (!response || destroyed || requestId !== summaryRequestId) return response
  dailyPerformance.value = Array.isArray(response.data) ? response.data : []
  return response
}

const loadPageData = () => {
  if (!buildGoogleAdsCommonParams(queryForm)) {
    Message.warning('请选择日期范围')
    return Promise.resolve([])
  }
  return Promise.all([loadCampaignList(), loadDailyPerformance()])
}

const handleSearch = () => {
  pagination.pageNo = 1
  return loadPageData()
}

const handleReset = () => {
  queryForm.campaignNameFuzzy = ''
  queryForm.status = ''
  queryForm.personInCharge = ''
  queryForm.mappingProductUid = ''
  queryForm.dateRange = createDefaultDateRange()
  specifiedProduct.value = null
  specifiedProductDialogVisible.value = false
  pagination.pageNo = 1
  return loadPageData()
}

const handleOpenSpecifiedProductDialog = () => {
  specifiedProductDialogVisible.value = true
}

const handleSpecifiedProductConfirm = (product) => {
  const mappingProductUid = String(product?.uid ?? '').trim()
  if (!mappingProductUid) return null

  specifiedProduct.value = { ...product, uid: mappingProductUid }
  queryForm.mappingProductUid = mappingProductUid
  specifiedProductDialogVisible.value = false
  pagination.pageNo = 1
  return loadPageData()
}

const handleClearSpecifiedProduct = () => {
  specifiedProduct.value = null
  queryForm.mappingProductUid = ''
  pagination.pageNo = 1
  return loadPageData()
}

const handleSelectionChange = (rows) => {
  selectedCampaigns.value = Array.isArray(rows)
    ? rows.filter((campaign) => campaign?.campaignId)
    : []
}

const handleOpenAllocatePersonDialog = () => {
  if (selectedCampaigns.value.length === 0) {
    Message.warning('请先选择需要分配投手的广告系列')
    return
  }

  allocateCampaigns.value = selectedCampaigns.value.map((campaign) => ({ ...campaign }))
  allocatePersonDialogVisible.value = true
}

const handleAllocatePersonSaved = () => {
  tableRef.value?.clearSelection()
  selectedCampaigns.value = []
  allocateCampaigns.value = []
  return loadCampaignList()
}

const handleOpenLinkProductDialog = () => {
  if (selectedCampaigns.value.length === 0) {
    Message.warning('请先选择需要绑定产品的广告系列')
    return
  }

  linkCampaigns.value = selectedCampaigns.value.map((campaign) => ({ ...campaign }))
  linkProductDialogVisible.value = true
}

const submitProductBinding = async (newMappingProductUid, successMessage, submittingState) => {
  const adsCampaignIdList = linkCampaigns.value
    .map((campaign) => String(campaign?.campaignId ?? '').trim())
    .filter(Boolean)
  if (!newMappingProductUid || adsCampaignIdList.length === 0 || submittingState.value) {
    return null
  }

  submittingState.value = true
  const response = await Request({
    url: '/googleAds/linkProduct',
    method: 'post',
    params: {
      adsCampaignIdList,
      newMappingProductUid,
    },
    showLoading: false,
  }).finally(() => {
    submittingState.value = false
  })

  if (!response) return response
  Message.success(successMessage)
  linkProductDialogVisible.value = false
  linkCampaigns.value = []
  tableRef.value?.clearSelection()
  selectedCampaigns.value = []
  return loadCampaignList()
}

const handleLinkProductConfirm = (product) => {
  const newMappingProductUid = String(product?.uid ?? '').trim()
  return submitProductBinding(
    newMappingProductUid,
    '广告系列绑定产品成功',
    linkProductSubmitting,
  )
}

const handleCancelLinkProduct = () =>
  Confirm(
    `确定取消已选 ${linkCampaigns.value.length} 个广告系列的产品绑定吗？`,
    () =>
      submitProductBinding(
        'cancel_mark',
        '广告系列已取消产品绑定',
        cancelLinkProductSubmitting,
      ),
    {
      title: '取消已有绑定',
      type: 'warning',
      confirmButtonText: '确认取消',
    },
  )

const handlePageSizeChange = (pageSize) => {
  pagination.pageSize = pageSize
  pagination.pageNo = 1
  return loadCampaignList()
}

const handlePageNoChange = (pageNo) => {
  pagination.pageNo = pageNo
  return loadCampaignList()
}

onMounted(() => {
  Promise.all([loadPageData(), loadPersonOptions()])
})

onBeforeUnmount(() => {
  destroyed = true
  listRequestId += 1
  summaryRequestId += 1
})
</script>

<style scoped lang="scss"></style>
