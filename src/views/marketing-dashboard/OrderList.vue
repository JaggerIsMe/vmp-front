<template>
  <PagePlaceholder
    module-name="营销驾驶舱"
    title="订单列表"
    search-placeholder="请输入订单号、产品名称或SKU"
    :metrics="metrics"
  />
</template>

<script setup>
import PagePlaceholder from '@/components/common/PagePlaceholder.vue'

const metrics = [
  { label: '今日订单', value: '--', trend: '待接入订单接口' },
  { label: '待发货', value: '--', trend: '待接入履约接口' },
  { label: '退款订单', value: '--', trend: '待接入售后接口' },
  { label: '异常订单', value: '--', trend: '待接入风控接口' },
]
</script>

<style scoped lang="scss"></style>
