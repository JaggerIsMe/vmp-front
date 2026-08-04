<template>
  <aside class="shopify-sales-summary-cards" aria-label="销售统计">
    <article
      v-for="item in summaryCards"
      :key="item.key"
      class="shopify-sales-summary-card"
      :data-kind="item.kind"
    >
      <span>{{ item.label }}</span>
      <strong>{{ item.value }}</strong>
    </article>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { buildShopifySalesSummaryCards } from '@/utils/ShopifySalesPerformance'

const props = defineProps({
  rows: { type: Array, default: () => [] },
  dimension: { type: String, default: 'day' },
})

const summaryCards = computed(() =>
  buildShopifySalesSummaryCards(props.rows, props.dimension),
)
</script>

<style scoped lang="scss"></style>
