import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { marketingDashboardRoutes } from '../src/router/marketingDashboardRoutes.js'
import {
  buildPermissionMenuTree,
  collectPermittedPaths,
  filterNavigableMenuTree,
} from '../src/utils/MenuPermission.js'
import {
  getRouteBreadcrumbTitles,
  isMenuBranch,
} from '../src/utils/MenuPresentation.js'

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

test('classifies menu branches and leaves', () => {
  assert.equal(isMenuBranch({ children: [{}] }), true)
  assert.equal(isMenuBranch({ children: [] }), false)
  assert.equal(isMenuBranch({}), false)
})

test('derives three-level and fallback breadcrumbs', () => {
  assert.deepEqual(
    getRouteBreadcrumbTitles({
      breadcrumbTitles: ['营销驾驶舱', 'Amazon', '订单列表Amazon'],
    }),
    ['营销驾驶舱', 'Amazon', '订单列表Amazon'],
  )
  assert.deepEqual(
    getRouteBreadcrumbTitles({ parentTitle: '系统管理', title: '用户管理' }),
    ['系统管理', '用户管理'],
  )
})

test('seeds Amazon and Shopify three-level permission nodes', () => {
  const sql = readFileSync(
    new URL(
      '../database/migrations/2026-07-17-marketing-dashboard-three-level-menu.sql',
      import.meta.url,
    ),
    'utf8',
  )
  const expectedMenuRows = [
    "('71601606361697236041','71601606361697236040','Amazon','/amazon'",
    "('71601606361697236042','71601606361697236040','Shopify','/shopify'",
    "('30706583407525319196','71601606361697236041','产品销售表现Amazon','/product-sales-performance'",
    "('30706583407525319197','71601606361697236041','Listing列表Amazon','/listing-list'",
    "('97681727879252529955','71601606361697236041','订单列表Amazon','/order-list'",
    "('30706583407525319198','71601606361697236042','产品销售表现Shopify','/product-sales-performance'",
    "('30706583407525319199','71601606361697236042','Listing列表Shopify','/listing-list'",
    "('97681727879252529956','71601606361697236042','订单列表Shopify','/order-list'",
  ]

  for (const row of expectedMenuRows) {
    assert.ok(sql.includes(row), `missing menu seed row: ${row}`)
  }
})

test('grants platform directories and leaves to seeded roles', () => {
  const sql = readFileSync(
    new URL(
      '../database/migrations/2026-07-17-marketing-dashboard-three-level-menu.sql',
      import.meta.url,
    ),
    'utf8',
  )
  const amazonMenuIds = [
    '71601606361697236040',
    '71601606361697236041',
    '30706583407525319196',
    '30706583407525319197',
    '97681727879252529955',
  ]
  const allPlatformMenuIds = [
    ...amazonMenuIds,
    '71601606361697236042',
    '30706583407525319198',
    '30706583407525319199',
    '97681727879252529956',
  ]

  for (const menuId of amazonMenuIds) {
    assert.ok(
      sql.includes(`('inituserrole','${menuId}')`),
      `initial role is missing menu ${menuId}`,
    )
  }
  for (const menuId of allPlatformMenuIds) {
    assert.ok(
      sql.includes(`('JvB2REMpxToXuku29ZA6','${menuId}')`),
      `administrator role is missing menu ${menuId}`,
    )
  }
})
