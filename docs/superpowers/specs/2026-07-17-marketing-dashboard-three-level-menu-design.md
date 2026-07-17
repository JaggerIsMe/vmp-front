# 营销驾驶舱三级菜单设计

## 目标

将现有“营销驾驶舱”从一级目录加二级页面调整为三级菜单：在营销驾驶舱下增加 Amazon、Shopify 两个平台目录，每个平台下分别提供产品销售表现、Listing 列表、订单列表三个独立页面。

本次只建立页面、路由、侧边栏和权限菜单骨架，不实现筛选、表格、接口请求等业务功能。Amazon 与 Shopify 的数据模型不同，因此六个页面使用彼此独立的 Vue 组件，后续可以分别开发。

## 菜单与路径

```text
营销驾驶舱 /marketing-dashboard
├─ Amazon /amazon
│  ├─ 产品销售表现Amazon /product-sales-performance
│  ├─ Listing列表Amazon /listing-list
│  └─ 订单列表Amazon /order-list
└─ Shopify /shopify
   ├─ 产品销售表现Shopify /product-sales-performance
   ├─ Listing列表Shopify /listing-list
   └─ 订单列表Shopify /order-list
```

最终可导航路径为：

```text
/marketing-dashboard/amazon/product-sales-performance
/marketing-dashboard/amazon/listing-list
/marketing-dashboard/amazon/order-list
/marketing-dashboard/shopify/product-sales-performance
/marketing-dashboard/shopify/listing-list
/marketing-dashboard/shopify/order-list
```

现有的以下二级路径直接移除，不配置兼容重定向：

```text
/marketing-dashboard/product-sales-performance
/marketing-dashboard/order-list
```

## 前端结构

新增平台子目录和六个 PascalCase 页面组件：

```text
src/views/marketing-dashboard/
├─ amazon/
│  ├─ AmazonProductSalesPerformance.vue
│  ├─ AmazonListingList.vue
│  └─ AmazonOrderList.vue
└─ shopify/
   ├─ ShopifyProductSalesPerformance.vue
   ├─ ShopifyListingList.vue
   └─ ShopifyOrderList.vue
```

六个页面使用现有 `PagePlaceholder` 组件展示模块名、页面标题和占位说明。页面之间不复用业务页面组件，确保后续加入不同字段、筛选项和接口时不会产生平台条件分支。

## 路由设计

六个页面继续作为根级 `AppLayout` 路由的直接子路由注册，不为 Amazon、Shopify 创建额外的嵌套路由记录或 `router-view`。菜单层级由权限菜单数据表达，页面组件只需匹配最终完整路径。

路由名称分别为：

```text
AmazonProductSalesPerformance
AmazonListingList
AmazonOrderList
ShopifyProductSalesPerformance
ShopifyListingList
ShopifyOrderList
```

每条路由的元数据包含当前页标题及完整面包屑标题，例如：

```javascript
meta: {
  title: '产品销售表现Amazon',
  breadcrumbTitles: ['营销驾驶舱', 'Amazon', '产品销售表现Amazon'],
}
```

`AppLayout` 优先读取 `breadcrumbTitles`。未配置该字段的现有两级页面仍使用 `parentTitle` 和 `title`，保持其他模块不受影响。

## 侧边栏递归渲染

新增 `src/components/layout/SidebarMenuItem.vue`，职责仅为渲染单个菜单节点：

- 节点存在非空 `children` 时渲染 `el-sub-menu`，并递归渲染子节点。
- 叶子节点渲染 `el-menu-item`，使用节点的 `fullPath` 作为导航地址。
- 图标解析函数由 `AppLayout` 传入，沿递归调用继续传递。

`AppLayout.vue` 只遍历 `authStore.navigationMenus` 的顶层节点，并将每个节点交给递归组件。该方案不限于三级菜单，后续新增更深层级不需要修改布局模板。

## 权限菜单数据

现有 `MenuPermission.js` 已根据 `menuId`、`pid` 递归构建权限树，并递归拼接 `fullPath`、收集叶子路径，因此不修改核心算法。

权限数据通过 `database/migrations/2026-07-17-marketing-dashboard-three-level-menu.sql` 增量交付。仓库明确忽略本地 `vmp_database.sql` 转储，因此测试和版本提交不依赖整份环境数据库文件。

数据库菜单关系调整为：

- “营销驾驶舱”仍是 `pid = VMP` 的一级目录。
- 新增 Amazon、Shopify 两个平台目录，`pid` 指向“营销驾驶舱”。
- 六个页面节点的 `pid` 分别指向对应平台目录。
- 原“产品销售表现”和“订单列表”节点改为 Amazon 页面节点，保留其页面语义但更新父级和标题。
- 新增 Amazon Listing 页面以及三个 Shopify 页面。
- 初始化角色和管理员角色的菜单授权同步包含其需要访问的目录及叶子节点。

数据库中每个节点只保存自己的相对路径片段，三级最终路径由前端权限树依次拼接。

## 图标与导航状态

`AppLayout.vue` 的图标映射补充 Amazon、Shopify 目录及六个完整页面路径。未命中映射时继续使用 `Grid` 默认图标。

`el-menu` 的激活项仍使用当前 `route.path`。叶子菜单索引等于完整三级路径，因此进入或刷新页面后可以正确高亮当前项，并展开对应父级目录。

## 测试与验证

测试先覆盖三级权限树行为，再修改生产代码：

1. 构建“营销驾驶舱 → Amazon/Shopify → 页面”的菜单数据，验证三级 `fullPath` 拼接结果。
2. 验证 `collectPermittedPaths` 只收集六个叶子页面，不把平台目录作为页面权限。
3. 验证导航树保留两个平台目录及各自页面。
4. 验证六条路由名称唯一、最终路径与权限菜单一致。
5. 执行现有全部 Node 测试。
6. 执行 `npm.cmd run build`，验证 Vue 模板、动态导入及生产构建。

人工验收时分别检查有权限与无权限角色：有权限用户可看到完整三级菜单并进入页面；无权限用户不显示对应叶子，直接输入三级 URL 时被路由守卫拒绝。

## 非目标

本次不包含：

- Amazon 或 Shopify 的业务接口。
- 页面筛选条件、表格字段、分页和编辑弹窗。
- 后端业务实体、Service 或 Controller。
- 菜单拖拽排序或新的排序字段。
- 旧二级 URL 的重定向兼容。
