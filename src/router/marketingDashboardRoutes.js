export const marketingDashboardRoutes = [
  {
    path: 'marketing-dashboard/amazon/product-sales-performance',
    name: 'AmazonProductSalesPerformance',
    component: () =>
      import('@/views/marketing-dashboard/amazon/AmazonProductSalesPerformance.vue'),
    meta: {
      title: '产品销售表现Amazon',
      breadcrumbTitles: ['营销驾驶舱', 'Amazon', '产品销售表现Amazon'],
    },
  },
  {
    path: 'marketing-dashboard/amazon/listing-list',
    name: 'AmazonListingList',
    component: () => import('@/views/marketing-dashboard/amazon/AmazonListingList.vue'),
    meta: {
      title: 'Listing列表Amazon',
      breadcrumbTitles: ['营销驾驶舱', 'Amazon', 'Listing列表Amazon'],
    },
  },
  {
    path: 'marketing-dashboard/amazon/order-list',
    name: 'AmazonOrderList',
    component: () => import('@/views/marketing-dashboard/amazon/AmazonOrderList.vue'),
    meta: {
      title: '订单列表Amazon',
      breadcrumbTitles: ['营销驾驶舱', 'Amazon', '订单列表Amazon'],
    },
  },
  {
    path: 'marketing-dashboard/shopify/product-sales-performance',
    name: 'ShopifyProductSalesPerformance',
    component: () =>
      import('@/views/marketing-dashboard/shopify/ShopifyProductSalesPerformance.vue'),
    meta: {
      title: '产品销售表现Shopify',
      breadcrumbTitles: ['营销驾驶舱', 'Shopify', '产品销售表现Shopify'],
    },
  },
  {
    path: 'marketing-dashboard/shopify/listing-list',
    name: 'ShopifyListingList',
    component: () => import('@/views/marketing-dashboard/shopify/ShopifyListingList.vue'),
    meta: {
      title: 'Listing列表Shopify',
      breadcrumbTitles: ['营销驾驶舱', 'Shopify', 'Listing列表Shopify'],
    },
  },
  {
    path: 'marketing-dashboard/shopify/order-list',
    name: 'ShopifyOrderList',
    component: () => import('@/views/marketing-dashboard/shopify/ShopifyOrderList.vue'),
    meta: {
      title: '订单列表Shopify',
      breadcrumbTitles: ['营销驾驶舱', 'Shopify', '订单列表Shopify'],
    },
  },
]
