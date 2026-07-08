<template>
  <PagePlaceholder
    module-name="营销驾驶舱"
    title="产品销售表现"
    search-placeholder="请输入产品名称或SKU"
    :metrics="metrics"
  />
</template>

<script setup>
import PagePlaceholder from '@/components/common/PagePlaceholder.vue'

const metrics = [
  { label: '今日销售额', value: '--', trend: '待接入销售接口' },
  { label: '订单量', value: '--', trend: '待接入订单接口' },
  { label: '客单价', value: '--', trend: '待接入财务接口' },
  { label: '转化率', value: '--', trend: '待接入流量接口' },
]
</script>

<style scoped lang="scss"></style>
