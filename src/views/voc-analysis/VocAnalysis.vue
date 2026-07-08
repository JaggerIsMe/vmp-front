<template>
  <PagePlaceholder
    module-name="VOC分析中心"
    title="VOC分析"
    search-placeholder="请输入产品、主题或评论关键词"
    :metrics="metrics"
  />
</template>

<script setup>
import PagePlaceholder from '@/components/common/PagePlaceholder.vue'

const metrics = [
  { label: '评论总量', value: '--', trend: '待接入VOC接口' },
  { label: '正向反馈', value: '--', trend: '待接入情感分析' },
  { label: '负向反馈', value: '--', trend: '待接入情感分析' },
  { label: '高频问题', value: '--', trend: '待接入主题聚类' },
]
</script>

<style scoped lang="scss"></style>
