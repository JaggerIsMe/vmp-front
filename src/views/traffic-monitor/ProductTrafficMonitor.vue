<template>
  <PagePlaceholder
    module-name="流量监控中心"
    title="产品流量监控"
    search-placeholder="请输入产品名称、ASIN或SKU"
    :metrics="metrics"
  />
</template>

<script setup>
import PagePlaceholder from '@/components/common/PagePlaceholder.vue'

const metrics = [
  { label: '访问量', value: '--', trend: '待接入流量接口' },
  { label: '点击率', value: '--', trend: '待接入广告接口' },
  { label: '加购数', value: '--', trend: '待接入行为接口' },
  { label: '流量异常', value: '--', trend: '待接入预警接口' },
]
</script>

<style scoped lang="scss"></style>
