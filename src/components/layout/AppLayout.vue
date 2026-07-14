<template>
  <el-container class="app-layout">
    <el-aside class="app-sidebar" width="248px">
      <div class="brand">
        <div class="brand__mark">VMP</div>
        <div class="brand__text">
          <strong>三匠集团市场营销中台</strong>
          <span>Vantrue Marketing Platform</span>
        </div>
      </div>

      <el-menu
        class="side-menu"
        :default-active="activeMenu"
        background-color="#111827"
        text-color="#cbd5e1"
        active-text-color="#ffffff"
        router
        unique-opened
      >
        <el-sub-menu
          v-for="menuGroup in authStore.navigationMenus"
          :key="menuGroup.menuId"
          :index="menuGroup.menuId"
        >
          <template #title>
            <el-icon><component :is="getMenuIcon(menuGroup)" /></el-icon>
            <span>{{ menuGroup.title }}</span>
          </template>
          <el-menu-item
            v-for="menuItem in menuGroup.children"
            :key="menuItem.menuId"
            :index="menuItem.fullPath"
          >
            <el-icon><component :is="getMenuIcon(menuItem)" /></el-icon>
            <span>{{ menuItem.title }}</span>
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>

    <el-container class="app-main">
      <el-header class="app-header" height="64px">
        <div class="app-header__title">
          <h1>{{ pageTitle }}</h1>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item>{{ parentTitle }}</el-breadcrumb-item>
            <el-breadcrumb-item>{{ pageTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <UserInfoMenu />
      </el-header>

      <el-main class="app-content">
        <router-view />
      </el-main>
    </el-container>

    <InitializeUserInfoDialog v-model="initializeUserInfoVisible" />
  </el-container>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  ChatLineRound,
  Connection,
  DataAnalysis,
  DataBoard,
  DataLine,
  DocumentChecked,
  Grid,
  Monitor,
  Search,
  Setting,
  Tickets,
  TrendCharts,
  User,
  UserFilled,
} from '@element-plus/icons-vue'
import UserInfoMenu from '@/components/user-info/UserInfoMenu.vue'
import InitializeUserInfoDialog from '@/components/user-info/InitializeUserInfoDialog.vue'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const authStore = useAuthStore()
const initializeUserInfoVisible = ref(false)

const menuIconMap = {
  '/marketing-dashboard': DataAnalysis,
  '/marketing-dashboard/product-sales-performance': TrendCharts,
  '/marketing-dashboard/order-list': Tickets,
  '/traffic-monitor': Monitor,
  '/traffic-monitor/product-traffic-monitor': DataLine,
  '/traffic-monitor/aba-keyword-heat-monitor': Search,
  '/private-domain': Connection,
  '/private-domain/qr-code-marketing': Grid,
  '/private-domain/customer-management': User,
  '/voc-analysis': ChatLineRound,
  '/voc-analysis/voc-workbench': DocumentChecked,
  '/voc-analysis/voc-analysis': DataBoard,
  '/system-management': Setting,
  '/system-management/user-management': UserFilled,
  '/system-management/role-management': UserFilled,
}

const getMenuIcon = (menu) => menuIconMap[menu.fullPath] || menuIconMap[menu.path] || Grid

const activeMenu = computed(() => route.path)
const pageTitle = computed(() => route.meta.title || '产品销售表现')
const parentTitle = computed(() => route.meta.parentTitle || '营销驾驶舱')

watch(
  () => authStore.userInfo?.newToHere,
  (newToHere) => {
    initializeUserInfoVisible.value = newToHere === true
  },
  { immediate: true },
)
</script>

<style scoped lang="scss"></style>
