-- 将营销驾驶舱调整为“平台目录 + 页面”的三级权限菜单。
-- 重复执行时更新菜单关系并忽略已存在的角色授权。

START TRANSACTION;

INSERT INTO `sys_menu_info`
  (`menu_id`, `pid`, `title`, `path`, `create_user`, `update_user`, `create_time`, `update_time`)
VALUES
  ('71601606361697236041','71601606361697236040','Amazon','/amazon','vmp666','vmp666','2026-07-17 10:00:00','2026-07-17 10:00:00'),
  ('30706583407525319196','71601606361697236041','产品销售表现Amazon','/product-sales-performance','vmp666','vmp666','2026-07-17 10:00:01','2026-07-17 10:00:01'),
  ('30706583407525319197','71601606361697236041','Listing列表Amazon','/listing-list','vmp666','vmp666','2026-07-17 10:00:02','2026-07-17 10:00:02'),
  ('97681727879252529955','71601606361697236041','订单列表Amazon','/order-list','vmp666','vmp666','2026-07-17 10:00:03','2026-07-17 10:00:03'),
  ('71601606361697236042','71601606361697236040','Shopify','/shopify','vmp666','vmp666','2026-07-17 10:01:00','2026-07-17 10:01:00'),
  ('30706583407525319198','71601606361697236042','产品销售表现Shopify','/product-sales-performance','vmp666','vmp666','2026-07-17 10:01:01','2026-07-17 10:01:01'),
  ('30706583407525319199','71601606361697236042','Listing列表Shopify','/listing-list','vmp666','vmp666','2026-07-17 10:01:02','2026-07-17 10:01:02'),
  ('97681727879252529956','71601606361697236042','订单列表Shopify','/order-list','vmp666','vmp666','2026-07-17 10:01:03','2026-07-17 10:01:03')
ON DUPLICATE KEY UPDATE
  `pid` = VALUES(`pid`),
  `title` = VALUES(`title`),
  `path` = VALUES(`path`),
  `update_user` = VALUES(`update_user`),
  `create_time` = VALUES(`create_time`),
  `update_time` = VALUES(`update_time`);

INSERT IGNORE INTO `sys_roles_menus` (`role_id`, `menu_id`)
VALUES
  ('inituserrole','71601606361697236040'),
  ('inituserrole','71601606361697236041'),
  ('inituserrole','30706583407525319196'),
  ('inituserrole','30706583407525319197'),
  ('inituserrole','97681727879252529955'),
  ('JvB2REMpxToXuku29ZA6','71601606361697236040'),
  ('JvB2REMpxToXuku29ZA6','71601606361697236041'),
  ('JvB2REMpxToXuku29ZA6','30706583407525319196'),
  ('JvB2REMpxToXuku29ZA6','30706583407525319197'),
  ('JvB2REMpxToXuku29ZA6','97681727879252529955'),
  ('JvB2REMpxToXuku29ZA6','71601606361697236042'),
  ('JvB2REMpxToXuku29ZA6','30706583407525319198'),
  ('JvB2REMpxToXuku29ZA6','30706583407525319199'),
  ('JvB2REMpxToXuku29ZA6','97681727879252529956');

COMMIT;
