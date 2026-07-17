<template>
  <el-sub-menu v-if="isMenuBranch(menu)" :index="menu.menuId">
    <template #title>
      <el-icon><component :is="getMenuIcon(menu)" /></el-icon>
      <span>{{ menu.title }}</span>
    </template>

    <SidebarMenuItem
      v-for="child in menu.children"
      :key="child.menuId"
      :menu="child"
      :get-menu-icon="getMenuIcon"
    />
  </el-sub-menu>

  <el-menu-item v-else :index="menu.fullPath">
    <el-icon><component :is="getMenuIcon(menu)" /></el-icon>
    <span>{{ menu.title }}</span>
  </el-menu-item>
</template>

<script setup>
import { isMenuBranch } from '@/utils/MenuPresentation'

defineProps({
  menu: {
    type: Object,
    required: true,
  },
  getMenuIcon: {
    type: Function,
    required: true,
  },
})
</script>

<style scoped lang="scss"></style>
