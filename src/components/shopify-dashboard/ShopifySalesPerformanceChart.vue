<template>
  <div class="shopify-daily-performance-chart-shell">
    <el-empty v-if="!hasRows" description="暂无 Shopify 销售表现数据" />
    <div v-else ref="chartElement" class="shopify-daily-performance-chart" />
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import {
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  TooltipComponent,
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { buildShopifySalesPerformanceChartOption } from '@/utils/ShopifySalesPerformance'

echarts.use([
  LineChart,
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  CanvasRenderer,
])

const props = defineProps({
  rows: { type: Array, default: () => [] },
  dimension: { type: String, default: 'day' },
})

const chartElement = ref(null)
const hasRows = computed(() => props.rows.length > 0)
let chartInstance = null
let resizeObserver = null

const disposeChart = () => {
  resizeObserver?.disconnect()
  resizeObserver = null
  chartInstance?.dispose()
  chartInstance = null
}

const renderChart = async () => {
  if (!hasRows.value) {
    disposeChart()
    return
  }
  await nextTick()
  if (!chartElement.value) return
  if (!chartInstance) {
    chartInstance = echarts.init(chartElement.value)
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => chartInstance?.resize())
      resizeObserver.observe(chartElement.value)
    }
  }
  chartInstance.setOption(
    buildShopifySalesPerformanceChartOption(props.rows, props.dimension),
    true,
  )
}

watch(
  [() => props.rows, () => props.dimension],
  renderChart,
  { deep: true, flush: 'post' },
)
onMounted(renderChart)
onBeforeUnmount(disposeChart)
</script>

<style scoped lang="scss"></style>
