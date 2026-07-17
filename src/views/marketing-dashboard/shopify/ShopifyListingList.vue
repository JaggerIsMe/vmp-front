<template>
  <PagePlaceholder
    module-name="营销驾驶舱 / Shopify"
    title="Listing列表Shopify"
    search-placeholder="请输入Shopify产品名称、Handle或SKU"
    :metrics="metrics"
  />
</template>

<script setup>
import PagePlaceholder from '@/components/common/PagePlaceholder.vue'

const metrics = [
  { label: '商品总数', value: '--', trend: '待接入Shopify商品接口' },
  { label: '已发布商品', value: '--', trend: '待接入Shopify发布状态' },
  { label: '草稿商品', value: '--', trend: '待接入Shopify发布状态' },
  { label: '库存异常', value: '--', trend: '待接入Shopify库存接口' },
]
</script>

<style scoped lang="scss"></style>
