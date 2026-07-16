# 字典管理前端设计

## 1. 背景与范围

在三匠集团市场营销中台的“系统管理”模块下开发“字典管理”页面，直接管理现有 `sys_dict_data` 单表。数据库菜单及超级管理员权限已经配置完成。

本次仅修改 `vmp-front` 前端代码，使用现有 Java 接口完成联调，不修改、新增任何后端 Java 文件，也不修改数据库脚本和 Postman 接口文档。

页面支持：

- 展示、新增、修改一级字典。
- 按一级字典展示、筛选、分页、新增和修改二级字典。
- 修改二级字典状态。
- 不提供删除功能。

## 2. 数据模型和接口

`sys_dict_data` 通过 `pid` 表示层级：

- `pid = VMP`：一级字典。
- 二级字典的 `pid`：所属一级字典的 `dictId`。
- `status = 1`：启用。
- `status = 0`：禁用。

使用以下现有接口：

| 用途 | 方法和路径 | 参数或返回值 |
| --- | --- | --- |
| 获取全部一级字典 | `GET /admin/loadAllFatherDictDataList` | 返回 `SysDictDataVO` 数组 |
| 获取二级字典 | `POST /admin/loadChildDictDataListByPid/{pid}` | `pageNo`、`pageSize`，以及可选的 `dictCodeFuzzy`、`dictNameFuzzy`、`status`；返回分页数据 |
| 新增一级字典 | `POST /admin/newDictData/VMP` | `dictCode`、`dictName`、可选的 `remark` |
| 新增二级字典 | `POST /admin/newDictData/{fatherDictId}` | `dictCode`、`dictName`、可选的 `remark` |
| 修改一级字典 | `POST /admin/updateDictData/{dictId}` | `dictName`、`remark` |
| 修改二级字典 | `POST /admin/updateDictData/{dictId}` | `dictName`、`status`、`remark` |

后端新增接口自动生成 `dictId`、创建时间，并将新增数据状态设置为启用。修改接口不允许修改 `pid` 和 `dictCode`，因此修改弹窗不提供字典代码编辑能力。

## 3. 路由和导航

- 新增前端路由 `/system-management/dictionary-management`。
- 路由 `name` 使用 `DictionaryManagement`。
- `meta.title` 为“字典管理”。
- `meta.parentTitle` 为“系统管理”。
- 不配置 `public` 或 `permissionFree`，继续使用现有数据库菜单权限和路由守卫。
- 在 `AppLayout.vue` 的 `menuIconMap` 中为完整路径配置字典类图标。

## 4. 页面和组件结构

采用“单页面容器 + 一个复用弹窗组件”的结构：

- `src/views/system-management/DictionaryManagement.vue`：负责页面布局、一级字典选择、二级字典查询与分页、弹窗调度和列表刷新。
- `src/components/dictionary-management/DictDataDialog.vue`：负责一级/二级字典的新增和修改表单、校验与提交。
- `src/assets/styles/dictionary.management.scss`：负责字典页面布局和交互样式，由 `src/main.js` 统一引入。

列表和筛选逻辑保留在页面中，编辑弹窗独立为组件，遵循现有用户管理、角色管理的组织方式。

## 5. 页面布局

页面主体使用 `el-row` 和 `el-col` 构建左右两栏：

- 左侧约占 25%，展示一级字典。
- 右侧约占 75%，展示当前一级字典的二级字典。
- 小屏幕下改为上下排列，一级字典区域在上、二级字典区域在下。
- 页面区域自适应剩余高度，一级列表和二级表格分别在自身区域滚动。
- 二级表格宽度为 `100%`。

### 5.1 左侧一级字典区域

顶部展示区域标题和“新增一级数据”按钮，不提供条件查询。

列表调用 `loadAllFatherDictDataList` 获取全部数据，每项只展示 `dictName`：

- 首次加载成功后默认选中第一项并加载其二级字典。
- 点击其他项时更新选中样式，清空二级查询条件，将页码恢复为第一页，再请求对应的二级列表。
- 鼠标悬停具体项时显示“修改”按钮。
- 修改按钮点击事件阻止冒泡，避免意外切换当前选中项。
- 一级字典为空时清空右侧数据并展示空状态。

新增或修改一级字典成功后重新加载一级列表：

- 修改后保留原选中 `dictId`。
- 新增后根据提交的唯一 `dictCode` 定位并选中新建项。
- 无法定位目标项时选中第一项。

### 5.2 右侧二级字典区域

顶部筛选栏必须使用 `el-row` 和 `el-col`，包含：

- 字典代码输入框，对应 `dictCodeFuzzy`。
- 字典名称输入框，对应 `dictNameFuzzy`。
- 状态下拉框，对应 `status`，可选“启用”和“禁用”。
- 查询、重置和“新增二级数据”按钮。

两个输入框按 Enter 均可触发查询。查询和重置均把页码恢复为第一页；重置还会清空全部筛选条件。未选中一级字典时禁用“新增二级数据”按钮。

表格展示：

- 字典名称 `dictName`。
- 字典代码 `dictCode`。
- 状态 `status`，使用“启用/禁用”标签展示。
- 备注 `remark`，空值展示 `-`。
- 操作列，提供“修改”按钮。

表格下方提供分页组件，默认每页 15 条，页容量选项与现有用户、角色管理保持一致。页容量或页码变化后重新请求当前一级字典的二级数据。

## 6. 弹窗交互

`DictDataDialog.vue` 通过新增/修改模式、一级/二级类型、目标字典和父级 ID 支持四种场景。

| 场景 | 表单字段 |
| --- | --- |
| 新增一级 | 字典代码、字典名称、备注 |
| 修改一级 | 字典名称、备注 |
| 新增二级 | 字典代码、字典名称、备注 |
| 修改二级 | 字典名称、状态单选、备注 |

新增时：

- 字典代码和字典名称必填。
- 备注选填。
- 新增一级固定使用 `pid = VMP`。
- 新增二级使用当前选中一级字典的 `dictId`。

修改时：

- 不显示可编辑的字典代码字段。
- 字典名称和备注输入框保持空值，原始内容放入 `placeholder`。
- 未输入字典名称或备注时，提交值回退为原始值。
- 二级字典显示“启用/禁用”状态单选，并默认选中原状态。
- 一级字典不显示状态字段。
- 最终值与原数据完全相同时禁用保存按钮。

弹窗提交期间显示 loading 并阻止重复提交。请求失败时保留弹窗和输入内容；成功后关闭弹窗、提示成功并通知页面刷新相应列表。

## 7. 校验规则

在 `src/utils/Verify.js` 中增加公共校验器：

- `dictCode`：`^[A-Za-z0-9-]{1,20}$`，仅允许数字、英文字母和连字符 `-`，长度不超过 20。
- `dictName`：`^[\u4e00-\u9fa5A-Za-z0-9-]{1,20}$`，仅允许中文、数字、英文字母和连字符 `-`，长度不超过 20。

表单规则：

- 新增时 `dictCode`、`dictName` 必填。
- 修改时 `dictName` 未输入表示沿用原值；输入后必须通过 `Verify.dictName`。
- `remark` 始终选填，输入框按数据库字段长度设置 `maxlength = 64`。
- 字典代码和字典名称输入框设置 `maxlength = 20` 并显示字数限制。

后端唯一索引冲突等业务错误继续由现有 `Request.js` 统一提示。

## 8. 状态和请求处理

- 一级列表、二级列表和弹窗提交分别维护独立 loading 状态。
- 二级列表请求携带请求序号；只有当前最新请求且父级 `dictId` 仍一致时才应用响应，避免快速切换一级字典造成旧响应覆盖新数据。
- 可选筛选参数仅在有值时发送，`status = 0` 必须作为有效筛选值处理。
- 接口返回的 `status`、分页数量统一转为数字。
- 二级请求失败时不覆盖已有成功数据；首次请求失败且没有数据时展示空状态。
- 新增、修改接口失败时不关闭弹窗。

## 9. 文件变更范围

计划新增：

- `src/views/system-management/DictionaryManagement.vue`
- `src/components/dictionary-management/DictDataDialog.vue`
- `src/assets/styles/dictionary.management.scss`

计划修改：

- `src/utils/Verify.js`
- `src/router/index.js`
- `src/main.js`
- `src/components/layout/AppLayout.vue`

禁止修改：

- `vmp-java` 下的任何 Java 或资源文件。
- `vmp_database.sql`。
- `vmp-api.postman_collection.json`。

## 10. 验证和完成标准

自动验证：

- 对新增校验规则覆盖合法值、非法特殊字符、20 位边界和超长输入。
- 执行 `npm.cmd run build`，确认 Vue、路由、SCSS 和导入均可构建。

联调验证：

- 有权限的超级管理员可从“系统管理 / 字典管理”进入页面。
- 一级列表默认选择、切换和悬停修改正常。
- 二级列表筛选、Enter 查询、重置、分页正常。
- 一级和二级新增均使用正确的 `pid`。
- 一级修改仅提交名称和备注。
- 二级修改可以修改名称、状态和备注。
- 修改弹窗 placeholder、无修改禁用保存、请求失败保留表单均符合设计。
- 页面无删除入口，后端工作区不产生任何变更。

