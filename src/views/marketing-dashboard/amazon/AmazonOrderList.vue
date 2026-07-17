<template>
  <PagePlaceholder
    module-name="营销驾驶舱 / Amazon"
    title="订单列表Amazon"
    search-placeholder="请输入Amazon订单号、ASIN或SKU"
    :metrics="metrics"
  />
</template>

<script setup>
import PagePlaceholder from '@/components/common/PagePlaceholder.vue'

const metrics = [
  { label: '今日订单', value: '--', trend: '待接入Amazon订单接口' },
  { label: '待发货', value: '--', trend: '待接入Amazon履约接口' },
  { label: '退款订单', value: '--', trend: '待接入Amazon售后接口' },
  { label: '异常订单', value: '--', trend: '待接入Amazon风控接口' },
]
</script>

<style scoped lang="scss"></style>
