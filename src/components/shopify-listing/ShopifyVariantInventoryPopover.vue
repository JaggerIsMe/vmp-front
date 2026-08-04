<template>
  <el-popover
    placement="right"
    trigger="click"
    :width="320"
    popper-class="shopify-inventory-popover"
    @show="$emit('show')"
  >
    <template #reference>
      <div class="shopify-inventory-cell">
        <span>{{ formatShopifyCell(quantity) }}</span>
        <el-button
          type="primary"
          link
          class="shopify-inventory-trigger"
          aria-label="查看库存详情"
        >
          <el-icon><ArrowDown /></el-icon>
        </el-button>
      </div>
    </template>

    <div class="shopify-inventory-popover__content">
      <div v-if="viewState === 'loading'" class="shopify-inventory-popover__state">
        库存详情加载中
      </div>
      <div v-else-if="viewState === 'error'" class="shopify-inventory-popover__state">
        <span>库存详情加载失败</span>
        <el-button type="primary" link :disabled="state.loading" @click="$emit('retry')">
          重试
        </el-button>
      </div>
      <div v-else-if="viewState === 'empty'" class="shopify-inventory-popover__state">
        暂无库存详情
      </div>
      <div v-else class="shopify-inventory-details">
        <div class="shopify-inventory-details__header">
          <span>仓库名称</span>
          <span>库存量</span>
        </div>
        <div
          v-for="(item, index) in state.details"
          :key="item.warehouseId || `${item.warehouseName || 'warehouse'}-${index}`"
          class="shopify-inventory-details__row"
        >
          <span>{{ formatShopifyCell(item.warehouseName) }}</span>
          <span>{{ formatShopifyCell(item.availableQuantity) }}</span>
        </div>
      </div>
    </div>
  </el-popover>
</template>

<script setup>
import { computed } from 'vue'
import { ArrowDown } from '@element-plus/icons-vue'
import { formatShopifyCell } from '@/utils/ShopifyListing'

const props = defineProps({
  quantity: {
    type: [String, Number],
    default: null,
  },
  state: {
    type: Object,
    required: true,
  },
})

defineEmits(['show', 'retry'])

const viewState = computed(() => {
  if (props.state.loading) return 'loading'
  if (props.state.error) return 'error'
  if (props.state.initialized && props.state.details.length === 0) return 'empty'
  if (props.state.details.length > 0) return 'details'
  return 'loading'
})
</script>

<style scoped lang="scss"></style>
