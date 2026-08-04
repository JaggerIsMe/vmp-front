<template>
  <span v-if="normalizedItems.length === 0" class="shopify-order-item-list__empty">-</span>
  <div v-else class="shopify-order-item-list">
    <article
      v-for="(item, index) in visibleItems"
      :key="getItemKey(item, index)"
      class="shopify-order-item"
    >
      <div class="shopify-order-item__image-frame">
        <img
          v-if="getImageUrl(item) && !hasImageLoadError(item, index)"
          :src="getImageUrl(item)"
          :alt="formatCell(item?.productTitle)"
          class="shopify-order-item__image"
          @error="handleImageError(item, index)"
        />
        <div v-else class="shopify-order-item__image-fallback">
          <el-icon><Picture /></el-icon>
        </div>
      </div>

      <div class="shopify-order-item__product-fields">
        <p><span>产品标题：</span><span>{{ formatCell(item?.productTitle) }}</span></p>
        <p><span>变体属性：</span><span>{{ formatCell(item?.attribute) }}</span></p>
        <p><span>SKU：</span><span>{{ formatCell(item?.sku) }}</span></p>
      </div>

      <div class="shopify-order-item__price-fields">
        <p><span>数量：</span><span>{{ formatCell(item?.quantity) }}</span></p>
        <p><span>商品单价：</span><span>{{ formatAmount(item?.originalUnitPrice) }}</span></p>
        <p><span>折扣单价：</span><span>{{ formatAmount(item?.discountedUnitPrice) }}</span></p>
      </div>
    </article>

    <el-button
      v-if="showToggle"
      class="shopify-order-item-list__toggle"
      type="primary"
      link
      @click="toggleExpanded"
    >
      {{ toggleText }}
      <el-icon class="shopify-order-item-list__toggle-icon" :class="{ 'is-expanded': expanded }">
        <ArrowDown />
      </el-icon>
    </el-button>
  </div>
</template>

<script setup>
import { ArrowDown, Picture } from '@element-plus/icons-vue'
import { computed, ref, watch } from 'vue'
import { buildShopifyProductImageUrl } from '@/utils/ShopifyListing'
import { formatShopifyOrderAmount, formatShopifyOrderCell } from '@/utils/ShopifyOrder'

const DEFAULT_VISIBLE_COUNT = 2

const props = defineProps({
  items: { type: Array, default: () => [] },
  storeId: { type: [String, Number], default: '' },
  currencyCode: { type: String, default: '' },
})

const expanded = ref(false)
const imageLoadErrorKeys = ref(new Set())
const normalizedItems = computed(() => (Array.isArray(props.items) ? props.items : []))
const remainingCount = computed(() =>
  Math.max(normalizedItems.value.length - DEFAULT_VISIBLE_COUNT, 0),
)
const visibleItems = computed(() =>
  expanded.value ? normalizedItems.value : normalizedItems.value.slice(0, DEFAULT_VISIBLE_COUNT),
)
const showToggle = computed(() => remainingCount.value > 0)
const toggleText = computed(() =>
  expanded.value ? '收起' : `展开剩余 ${remainingCount.value} 项`,
)

const hasValue = (value) => value !== '' && value !== null && value !== undefined
const resolveStoreId = (item) => (hasValue(item?.storeId) ? item.storeId : props.storeId)

const getItemKey = (item, index) => {
  if (hasValue(item?.itemId)) return String(item.itemId)
  return [resolveStoreId(item), item?.productId, item?.variantId, index]
    .map((value) => String(value ?? ''))
    .join('::')
}

const getImageUrl = (item) =>
  buildShopifyProductImageUrl({ storeId: resolveStoreId(item), productId: item?.productId })
const hasImageLoadError = (item, index) => imageLoadErrorKeys.value.has(getItemKey(item, index))
const handleImageError = (item, index) => {
  const nextKeys = new Set(imageLoadErrorKeys.value)
  nextKeys.add(getItemKey(item, index))
  imageLoadErrorKeys.value = nextKeys
}
const formatCell = (value) => formatShopifyOrderCell(value)
const formatAmount = (value) => formatShopifyOrderAmount(value, props.currencyCode)
const toggleExpanded = () => {
  if (remainingCount.value <= 0) return
  expanded.value = !expanded.value
}

watch(
  () => props.items,
  () => {
    expanded.value = false
    imageLoadErrorKeys.value = new Set()
  },
)
</script>

<style scoped lang="scss"></style>
