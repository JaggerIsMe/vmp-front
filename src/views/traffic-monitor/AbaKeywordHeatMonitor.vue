<template>
  <PagePlaceholder
    module-name="流量监控中心"
    title="ABA关键词热度监控"
    search-placeholder="请输入ABA关键词"
    :metrics="metrics"
  />
</template>

<script setup>
import PagePlaceholder from '@/components/common/PagePlaceholder.vue'

const metrics = [
  { label: '监控关键词', value: '--', trend: '待接入关键词接口' },
  { label: '热度上升', value: '--', trend: '待接入趋势接口' },
  { label: '热度下降', value: '--', trend: '待接入趋势接口' },
  { label: '排名异常', value: '--', trend: '待接入预警接口' },
]
</script>

<style scoped lang="scss"></style>
