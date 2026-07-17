import test from 'node:test'
import assert from 'node:assert/strict'

import { marketingDashboardRoutes } from '../src/router/marketingDashboardRoutes.js'
import {
  buildPermissionMenuTree,
  collectPermittedPaths,
  filterNavigableMenuTree,
} from '../src/utils/MenuPermission.js'

const expectedRoutes = [
  ['AmazonProductSalesPerformance', 'marketing-dashboard/amazon/product-sales-performance'],
  ['AmazonListingList', 'marketing-dashboard/amazon/listing-list'],
  ['AmazonOrderList', 'marketing-dashboard/amazon/order-list'],
  ['ShopifyProductSalesPerformance', 'marketing-dashboard/shopify/product-sales-performance'],
  ['ShopifyListingList', 'marketing-dashboard/shopify/listing-list'],
  ['ShopifyOrderList', 'marketing-dashboard/shopify/order-list'],
]

test('registers exactly six marketing dashboard leaf routes', () => {
  assert.deepEqual(
    marketingDashboardRoutes.map(({ name, path }) => [name, path]),
    expectedRoutes,
  )
})

test('each marketing dashboard route exposes a three-part breadcrumb', () => {
  for (const route of marketingDashboardRoutes) {
    assert.equal(route.meta.breadcrumbTitles.length, 3)
    assert.equal(route.meta.breadcrumbTitles[0], '营销驾驶舱')
    assert.equal(route.meta.breadcrumbTitles[2], route.meta.title)
  }
})

test('builds and collects three-level marketing dashboard permissions', () => {
  const menus = [
    { menuId: 'dashboard', pid: 'VMP', title: '营销驾驶舱', path: '/marketing-dashboard' },
    { menuId: 'amazon', pid: 'dashboard', title: 'Amazon', path: '/amazon' },
    {
      menuId: 'amazon-sales',
      pid: 'amazon',
      title: '产品销售表现Amazon',
      path: '/product-sales-performance',
    },
    {
      menuId: 'amazon-listing',
      pid: 'amazon',
      title: 'Listing列表Amazon',
      path: '/listing-list',
    },
    { menuId: 'amazon-order', pid: 'amazon', title: '订单列表Amazon', path: '/order-list' },
    { menuId: 'shopify', pid: 'dashboard', title: 'Shopify', path: '/shopify' },
    {
      menuId: 'shopify-sales',
      pid: 'shopify',
      title: '产品销售表现Shopify',
      path: '/product-sales-performance',
    },
    {
      menuId: 'shopify-listing',
      pid: 'shopify',
      title: 'Listing列表Shopify',
      path: '/listing-list',
    },
    { menuId: 'shopify-order', pid: 'shopify', title: '订单列表Shopify', path: '/order-list' },
  ]
  const tree = buildPermissionMenuTree(menus)
  const navigation = filterNavigableMenuTree(tree)
  const paths = collectPermittedPaths(tree)

  assert.deepEqual(
    navigation[0].children.map(({ title }) => title),
    ['Amazon', 'Shopify'],
  )
  assert.deepEqual(
    paths,
    expectedRoutes.map(([, path]) => `/${path}`),
  )
})
