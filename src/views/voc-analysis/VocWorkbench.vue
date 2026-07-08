<template>
  <PagePlaceholder
    module-name="VOC分析中心"
    title="VOC获取工作台"
    search-placeholder="请输入任务名称、平台或产品"
    :metrics="metrics"
  />
</template>

<script setup>
import PagePlaceholder from '@/components/common/PagePlaceholder.vue'

const metrics = [
  { label: '采集任务', value: '--', trend: '待接入任务接口' },
  { label: '今日采集', value: '--', trend: '待接入评论接口' },
  { label: '失败任务', value: '--', trend: '待接入任务接口' },
  { label: '待分析', value: '--', trend: '待接入分析接口' },
]
</script>

<style scoped lang="scss"></style>
