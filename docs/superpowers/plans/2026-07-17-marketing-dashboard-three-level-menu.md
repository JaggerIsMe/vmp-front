# Marketing Dashboard Three-Level Menu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a recursive sidebar and a complete “营销驾驶舱 → Amazon/Shopify → six independent placeholder pages” routing and permission skeleton.

**Architecture:** Keep all six leaf routes as direct children of `AppLayout`, while the permission tree controls the visible nesting and complete URL. Move the six route records into a focused route module, render permission nodes through a recursive `SidebarMenuItem`, and keep breadcrumb derivation in a small tested utility.

**Tech Stack:** Vue 3, JavaScript, Vue Router, Pinia, Element Plus, Node test runner, Vite, MySQL seed SQL.

## Global Constraints

- New `.vue` files use PascalCase; new directories use kebab-case.
- Every `.vue` file keeps `template`, `script`, then `style` order.
- The six Amazon and Shopify pages are independent components and contain no business API logic.
- Existing two-level modules remain compatible with `meta.parentTitle`.
- The old marketing-dashboard two-level URLs are removed without redirects.
- Vue Router remains centrally registered from `src/router/index.js`.
- Do not add dependencies or unrelated refactors.

---

## File Structure

- Create `src/router/marketingDashboardRoutes.js`: owns the six marketing-dashboard leaf route records.
- Create `src/utils/MenuPresentation.js`: classifies branch nodes and derives breadcrumb labels.
- Create `src/components/layout/SidebarMenuItem.vue`: recursively renders one permission-menu node.
- Create `src/views/marketing-dashboard/amazon/*.vue`: three independent Amazon placeholders.
- Create `src/views/marketing-dashboard/shopify/*.vue`: three independent Shopify placeholders.
- Modify `src/router/index.js`: consumes the route module and removes old two-level records.
- Modify `src/components/layout/AppLayout.vue`: consumes recursive menu and breadcrumb helpers.
- Create `database/migrations/2026-07-17-marketing-dashboard-three-level-menu.sql`: applies Amazon/Shopify directories, six leaves, and role grants without tracking the ignored local database dump.
- Create `tests/marketing-dashboard.test.js`: verifies routes, permission path construction, menu presentation, and seed SQL.
- Delete `src/views/marketing-dashboard/ProductSalesPerformance.vue` and `src/views/marketing-dashboard/OrderList.vue`: obsolete two-level placeholders.

### Task 1: Six Independent Routes and Placeholder Pages

**Files:**
- Create: `tests/marketing-dashboard.test.js`
- Create: `src/router/marketingDashboardRoutes.js`
- Create: `src/views/marketing-dashboard/amazon/AmazonProductSalesPerformance.vue`
- Create: `src/views/marketing-dashboard/amazon/AmazonListingList.vue`
- Create: `src/views/marketing-dashboard/amazon/AmazonOrderList.vue`
- Create: `src/views/marketing-dashboard/shopify/ShopifyProductSalesPerformance.vue`
- Create: `src/views/marketing-dashboard/shopify/ShopifyListingList.vue`
- Create: `src/views/marketing-dashboard/shopify/ShopifyOrderList.vue`
- Modify: `src/router/index.js`
- Delete: `src/views/marketing-dashboard/ProductSalesPerformance.vue`
- Delete: `src/views/marketing-dashboard/OrderList.vue`

**Interfaces:**
- Produces: `marketingDashboardRoutes: RouteRecordRaw[]`, containing exactly six direct child records.
- Consumes: existing `PagePlaceholder.vue` props `moduleName`, `title`, `searchPlaceholder`, and `metrics`.

- [ ] **Step 1: Write the failing route and permission-tree tests**

Create `tests/marketing-dashboard.test.js` with fixtures for three menu levels and assertions that the not-yet-created route module exports exactly the six expected names, paths, and breadcrumb arrays. Use `buildPermissionMenuTree`, `filterNavigableMenuTree`, and `collectPermittedPaths` to assert the six full leaf paths and both platform branches.

```javascript
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
    { menuId: 'amazon-sales', pid: 'amazon', title: '产品销售表现Amazon', path: '/product-sales-performance' },
    { menuId: 'amazon-listing', pid: 'amazon', title: 'Listing列表Amazon', path: '/listing-list' },
    { menuId: 'amazon-order', pid: 'amazon', title: '订单列表Amazon', path: '/order-list' },
    { menuId: 'shopify', pid: 'dashboard', title: 'Shopify', path: '/shopify' },
    { menuId: 'shopify-sales', pid: 'shopify', title: '产品销售表现Shopify', path: '/product-sales-performance' },
    { menuId: 'shopify-listing', pid: 'shopify', title: 'Listing列表Shopify', path: '/listing-list' },
    { menuId: 'shopify-order', pid: 'shopify', title: '订单列表Shopify', path: '/order-list' },
  ]
  const tree = buildPermissionMenuTree(menus)
  const navigation = filterNavigableMenuTree(tree)
  const paths = collectPermittedPaths(tree)

  assert.deepEqual(navigation[0].children.map(({ title }) => title), ['Amazon', 'Shopify'])
  assert.deepEqual(paths, expectedRoutes.map(([, path]) => `/${path}`))
})
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/marketing-dashboard.test.js`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/router/marketingDashboardRoutes.js`.

- [ ] **Step 3: Create the six route records**

Create `src/router/marketingDashboardRoutes.js` with six lazy components. Each record uses the exact name and path from `expectedRoutes`; its metadata contains the exact user-facing title and `breadcrumbTitles: ['营销驾驶舱', platform, title]`.

Modify `src/router/index.js` to import `marketingDashboardRoutes`, remove the two old route records, and spread `...marketingDashboardRoutes` into the `AppLayout` children after `NoPermission`.

- [ ] **Step 4: Create all six independent placeholder components**

Create each file independently with the following exact content contracts; no page imports or branches to another platform page.

```vue
<template>
  <PagePlaceholder
    module-name="营销驾驶舱 / Amazon"
    title="产品销售表现Amazon"
    search-placeholder="请输入Amazon产品名称或SKU"
    :metrics="metrics"
  />
</template>

<script setup>
import PagePlaceholder from '@/components/common/PagePlaceholder.vue'

const metrics = [
  { label: '今日销售额', value: '--', trend: '待接入Amazon销售接口' },
  { label: '订单量', value: '--', trend: '待接入Amazon订单接口' },
  { label: '客单价', value: '--', trend: '待接入Amazon财务接口' },
  { label: '转化率', value: '--', trend: '待接入Amazon流量接口' },
]
</script>

<style scoped lang="scss"></style>
```

`AmazonListingList.vue`:

```vue
<template>
  <PagePlaceholder module-name="营销驾驶舱 / Amazon" title="Listing列表Amazon" search-placeholder="请输入ASIN、SKU或产品名称" :metrics="metrics" />
</template>
<script setup>
import PagePlaceholder from '@/components/common/PagePlaceholder.vue'
const metrics = [
  { label: 'Listing总数', value: '--', trend: '待接入Amazon Listing接口' },
  { label: '在售Listing', value: '--', trend: '待接入Amazon Listing接口' },
  { label: '受限Listing', value: '--', trend: '待接入Amazon状态接口' },
  { label: '价格异常', value: '--', trend: '待接入Amazon价格接口' },
]
</script>
<style scoped lang="scss"></style>
```

`AmazonOrderList.vue`:

```vue
<template>
  <PagePlaceholder module-name="营销驾驶舱 / Amazon" title="订单列表Amazon" search-placeholder="请输入Amazon订单号、ASIN或SKU" :metrics="metrics" />
</template>
<script setup>
import PagePlaceholder from '@/components/common/PagePlaceholder.vue'
const metrics = [
  { label: '今日订单', value: '--', trend: '待接入Amazon订单接口' },
  { label: '待发货', value: '--', trend: '待接入Amazon履约接口' },
  { label: '退款订单', value: '--', trend: '待接入Amazon售后接口' },
  { label: '异常订单', value: '--', trend: '待接入Amazon风控接口' },
]
</script>
<style scoped lang="scss"></style>
```

`ShopifyProductSalesPerformance.vue`:

```vue
<template>
  <PagePlaceholder module-name="营销驾驶舱 / Shopify" title="产品销售表现Shopify" search-placeholder="请输入Shopify产品名称或SKU" :metrics="metrics" />
</template>
<script setup>
import PagePlaceholder from '@/components/common/PagePlaceholder.vue'
const metrics = [
  { label: '今日销售额', value: '--', trend: '待接入Shopify销售接口' },
  { label: '订单量', value: '--', trend: '待接入Shopify订单接口' },
  { label: '客单价', value: '--', trend: '待接入Shopify财务接口' },
  { label: '转化率', value: '--', trend: '待接入Shopify分析接口' },
]
</script>
<style scoped lang="scss"></style>
```

`ShopifyListingList.vue`:

```vue
<template>
  <PagePlaceholder module-name="营销驾驶舱 / Shopify" title="Listing列表Shopify" search-placeholder="请输入Shopify产品名称、Handle或SKU" :metrics="metrics" />
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
```

`ShopifyOrderList.vue`:

```vue
<template>
  <PagePlaceholder module-name="营销驾驶舱 / Shopify" title="订单列表Shopify" search-placeholder="请输入Shopify订单号、客户或SKU" :metrics="metrics" />
</template>
<script setup>
import PagePlaceholder from '@/components/common/PagePlaceholder.vue'
const metrics = [
  { label: '今日订单', value: '--', trend: '待接入Shopify订单接口' },
  { label: '未发货', value: '--', trend: '待接入Shopify履约接口' },
  { label: '退款订单', value: '--', trend: '待接入Shopify退款接口' },
  { label: '高风险订单', value: '--', trend: '待接入Shopify风控接口' },
]
</script>
<style scoped lang="scss"></style>
```

- [ ] **Step 5: Remove obsolete page files and verify GREEN**

Delete the two old two-level components after `router/index.js` no longer imports them.

Run: `node --test tests/marketing-dashboard.test.js`

Expected: 3 tests PASS.

- [ ] **Step 6: Commit Task 1**

```bash
git add tests/marketing-dashboard.test.js src/router/index.js src/router/marketingDashboardRoutes.js src/views/marketing-dashboard
git commit -m "feat: add platform marketing dashboard routes"
```

### Task 2: Recursive Sidebar and Three-Level Breadcrumbs

**Files:**
- Modify: `tests/marketing-dashboard.test.js`
- Create: `src/utils/MenuPresentation.js`
- Create: `src/components/layout/SidebarMenuItem.vue`
- Modify: `src/components/layout/AppLayout.vue`

**Interfaces:**
- Produces: `isMenuBranch(menu): boolean`.
- Produces: `getRouteBreadcrumbTitles(meta): string[]`.
- Produces: `SidebarMenuItem` props `{ menu: object, getMenuIcon: function }`.
- Consumes: permission nodes shaped as `{ menuId, title, fullPath, children }`.

- [ ] **Step 1: Add failing presentation-helper tests**

Append tests that import `isMenuBranch` and `getRouteBreadcrumbTitles` from the missing module and assert branch/leaf classification, three-level metadata, and fallback two-level metadata.

```javascript
test('classifies menu branches and leaves', () => {
  assert.equal(isMenuBranch({ children: [{}] }), true)
  assert.equal(isMenuBranch({ children: [] }), false)
  assert.equal(isMenuBranch({}), false)
})

test('derives three-level and fallback breadcrumbs', () => {
  assert.deepEqual(
    getRouteBreadcrumbTitles({ breadcrumbTitles: ['营销驾驶舱', 'Amazon', '订单列表Amazon'] }),
    ['营销驾驶舱', 'Amazon', '订单列表Amazon'],
  )
  assert.deepEqual(
    getRouteBreadcrumbTitles({ parentTitle: '系统管理', title: '用户管理' }),
    ['系统管理', '用户管理'],
  )
})
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/marketing-dashboard.test.js`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/utils/MenuPresentation.js`.

- [ ] **Step 3: Implement the presentation helpers**

```javascript
export const isMenuBranch = (menu) => Array.isArray(menu?.children) && menu.children.length > 0

export const getRouteBreadcrumbTitles = (meta = {}) => {
  if (Array.isArray(meta.breadcrumbTitles) && meta.breadcrumbTitles.length) {
    return meta.breadcrumbTitles.filter(Boolean)
  }
  return [meta.parentTitle, meta.title].filter(Boolean)
}
```

- [ ] **Step 4: Implement the recursive menu node**

Create `SidebarMenuItem.vue`. The branch renders `el-sub-menu` with `menu.menuId` as its index and recursively renders `SidebarMenuItem` for every child. The leaf renders `el-menu-item` with `menu.fullPath` as its index. Both node types render the icon resolved by `getMenuIcon(menu)` and `menu.title`.

- [ ] **Step 5: Integrate recursion and breadcrumb list into AppLayout**

Replace the fixed second-level `el-menu-item` loop with:

```vue
<SidebarMenuItem
  v-for="menu in authStore.navigationMenus"
  :key="menu.menuId"
  :menu="menu"
  :get-menu-icon="getMenuIcon"
/>
```

Replace the two hard-coded breadcrumb items with a loop over `breadcrumbTitles`. Import `SidebarMenuItem` and `getRouteBreadcrumbTitles`, remove the old `parentTitle` computed, and add:

```javascript
const breadcrumbTitles = computed(() => getRouteBreadcrumbTitles(route.meta))
```

Extend `menuIconMap` for `/marketing-dashboard/amazon`, `/marketing-dashboard/shopify`, and all six complete leaf paths.

- [ ] **Step 6: Verify GREEN**

Run: `node --test tests/marketing-dashboard.test.js`

Expected: 5 tests PASS.

Run: `npm.cmd run build`

Expected: exit code 0 and six marketing-dashboard chunks in Vite output.

- [ ] **Step 7: Commit Task 2**

```bash
git add tests/marketing-dashboard.test.js src/utils/MenuPresentation.js src/components/layout/SidebarMenuItem.vue src/components/layout/AppLayout.vue
git commit -m "feat: render recursive permission menus"
```

### Task 3: Database Permission Seed

**Files:**
- Modify: `tests/marketing-dashboard.test.js`
- Create: `database/migrations/2026-07-17-marketing-dashboard-three-level-menu.sql`

**Interfaces:**
- Consumes: `sys_menu_info(menu_id, pid, title, path, ...)` and `sys_roles_menus(role_id, menu_id)`.
- Produces: one marketing root, two platform branches, six leaf nodes, and role grants.

- [ ] **Step 1: Add a failing SQL structure test**

Read `database/migrations/2026-07-17-marketing-dashboard-three-level-menu.sql` using `readFileSync`. The local `vmp_database.sql` is explicitly ignored and must not become a tracked test dependency. Assert exact row prefixes for these parent relationships:

```text
71601606361697236041 → 71601606361697236040 → Amazon → /amazon
71601606361697236042 → 71601606361697236040 → Shopify → /shopify
30706583407525319196 → 71601606361697236041 → 产品销售表现Amazon
30706583407525319197 → 71601606361697236041 → Listing列表Amazon
97681727879252529955 → 71601606361697236041 → 订单列表Amazon
30706583407525319198 → 71601606361697236042 → 产品销售表现Shopify
30706583407525319199 → 71601606361697236042 → Listing列表Shopify
97681727879252529956 → 71601606361697236042 → 订单列表Shopify
```

Also assert that all eight platform/leaf menu IDs occur in the administrator role mapping.

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/marketing-dashboard.test.js`

Expected: FAIL with `ENOENT` because the migration file does not exist.

- [ ] **Step 3: Update sys_menu_info seed rows**

Keep marketing-dashboard ID `71601606361697236040`. Re-parent the existing sales and order IDs under Amazon, add the six missing platform/leaf rows listed in Step 1, and use relative path fragments only.

- [ ] **Step 4: Update sys_roles_menus seed rows**

Grant the initial role the marketing root, Amazon branch, and its three leaves. Grant the administrator role both platform branches and all six leaves, while preserving all unrelated role mappings.

- [ ] **Step 5: Verify GREEN and commit Task 3**

Run: `node --test tests/marketing-dashboard.test.js`

Expected: all marketing-dashboard tests PASS.

```bash
git add tests/marketing-dashboard.test.js database/migrations/2026-07-17-marketing-dashboard-three-level-menu.sql
git commit -m "feat: seed platform marketing permissions"
```

### Task 4: Full Verification and Documentation Consistency

**Files:**
- Modify: `../FRONTEND_PAGE_REGISTRATION_GUIDE.md`

**Interfaces:**
- Produces: current project guidance that documents recursive menus and three-level path composition.

- [ ] **Step 1: Update the menu-level documentation**

Replace the “current sidebar only renders two levels” limitation with the implemented recursive behavior. Add the three-level formula:

```text
一级目录 path + 二级目录 path + 三级页面 path = 前端完整路由
```

Use Amazon as the concrete example and retain the rule that only leaf nodes are navigable permissions.

- [ ] **Step 2: Run all tests**

Run: `npm.cmd test`

Expected: exit code 0, existing validation tests and all marketing-dashboard tests PASS.

- [ ] **Step 3: Run the production build**

Run: `npm.cmd run build`

Expected: exit code 0 with no Vue template or module resolution errors.

- [ ] **Step 4: Inspect final scope**

Run: `git status --short` and `git diff --check HEAD~3`.

Expected: no unexpected files, no whitespace errors, and no generated `dist` directory retained as a tracked change.

- [ ] **Step 5: Record the workspace documentation update**

`FRONTEND_PAGE_REGISTRATION_GUIDE.md` is outside the nested `vmp-front` Git repository. Confirm its updated text with `rg -n "递归|三级" ../FRONTEND_PAGE_REGISTRATION_GUIDE.md` and list it explicitly in the final handoff instead of attempting to stage it from the frontend repository.
