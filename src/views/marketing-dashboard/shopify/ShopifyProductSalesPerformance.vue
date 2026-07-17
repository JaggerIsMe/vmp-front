<template>
  <PagePlaceholder
    module-name="营销驾驶舱 / Shopify"
    title="产品销售表现Shopify"
    search-placeholder="请输入Shopify产品名称或SKU"
    :metrics="metrics"
  />
</template>

<script setup>
import PagePlaceholder from '@/components/common/PagePlaceholder.vue'

const metrics = [
  { label: '今日销售额', value: '--', trend: '待接入Shopify销售接口' },
  { label: '订单量', value: '--', trend: '待接入Shopify订单接口' },
  { label: '客单价', value: '--', trend: '待接入Shopify财务接口' },
  { label: '转化率', value: '--', trend: '待接入Shopify分析接口' },
]
</script>

<style scoped lang="scss"></style>
