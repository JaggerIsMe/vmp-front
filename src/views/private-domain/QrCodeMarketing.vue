<template>
  <PagePlaceholder
    module-name="私域运营中心"
    title="二维码营销"
    search-placeholder="请输入活动名称或二维码编号"
    :metrics="metrics"
  />
</template>

<script setup>
import PagePlaceholder from '@/components/common/PagePlaceholder.vue'

const metrics = [
  { label: '活动二维码', value: '--', trend: '待接入活动接口' },
  { label: '扫码次数', value: '--', trend: '待接入埋点接口' },
  { label: '新增客户', value: '--', trend: '待接入客户接口' },
  { label: '转化率', value: '--', trend: '待接入转化接口' },
]
</script>

<style scoped lang="scss"></style>
