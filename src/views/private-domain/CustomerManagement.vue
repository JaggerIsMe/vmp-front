<template>
  <PagePlaceholder
    module-name="私域运营中心"
    title="客户管理"
    search-placeholder="请输入客户姓名、邮箱或手机号"
    :metrics="metrics"
  />
</template>

<script setup>
import PagePlaceholder from '@/components/common/PagePlaceholder.vue'

const metrics = [
  { label: '客户总数', value: '--', trend: '待接入客户接口' },
  { label: '今日新增', value: '--', trend: '待接入客户接口' },
  { label: '活跃客户', value: '--', trend: '待接入行为接口' },
  { label: '待跟进', value: '--', trend: '待接入CRM接口' },
]
</script>

<style scoped lang="scss"></style>
