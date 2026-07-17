<template>
  <PagePlaceholder
    module-name="营销驾驶舱 / Amazon"
    title="Listing列表Amazon"
    search-placeholder="请输入ASIN、SKU或产品名称"
    :metrics="metrics"
  />
</template>

<script setup>
import PagePlaceholder from '@/components/common/PagePlaceholder.vue'

const metrics = [
  { label: 'Listing总数', value: '--', trend: '待接入Amazon Listing接口' },
  { label: '在售Listing', value: '--', trend: '待接入Amazon Listing接口' },
  { label: '受限Listing', value: '--', trend: '待接入Amazon状态接口' },
  { label: '价格异常', value: '--', trend: '待接入Amazon价格接口' },
]
</script>

<style scoped lang="scss"></style>
