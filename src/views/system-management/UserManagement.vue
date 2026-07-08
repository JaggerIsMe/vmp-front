<template>
  <PagePlaceholder
    module-name="系统管理"
    title="用户管理"
    search-placeholder="请输入用户名、姓名或邮箱"
    :metrics="metrics"
  />
</template>

<script setup>
import PagePlaceholder from '@/components/common/PagePlaceholder.vue'

const metrics = [
  { label: '用户总数', value: '--', trend: '待接入用户接口' },
  { label: '启用账号', value: '--', trend: '待接入权限接口' },
  { label: '停用账号', value: '--', trend: '待接入权限接口' },
  { label: '待配置权限', value: '--', trend: '待接入角色接口' },
]
</script>

<style scoped lang="scss"></style>
