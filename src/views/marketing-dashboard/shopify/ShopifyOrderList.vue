<template>
  <PagePlaceholder
    module-name="营销驾驶舱 / Shopify"
    title="订单列表Shopify"
    search-placeholder="请输入Shopify订单号、客户或SKU"
    :metrics="metrics"
  />
</template>

<script setup>
import PagePlaceholder from '@/components/common/PagePlaceholder.vue'

const metrics = [
  { label: '今日订单', value: '--', trend: '待接入Shopify订单接口' },
  { label: '未发货', value: '--', trend: '待接入Shopify履约接口' },
  { label: '退款订单', value: '--', trend: '待接入Shopify退款接口' },
  { label: '高风险订单', value: '--', trend: '待接入Shopify风控接口' },
]
</script>

<style scoped lang="scss"></style>
