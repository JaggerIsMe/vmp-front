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
      >
        <el-sub-menu index="marketing-dashboard">
          <template #title>
            <el-icon><DataAnalysis /></el-icon>
            <span>营销驾驶舱</span>
          </template>
          <el-menu-item index="/marketing-dashboard/product-sales-performance">
            <el-icon><TrendCharts /></el-icon>
            <span>产品销售表现</span>
          </el-menu-item>
          <el-menu-item index="/marketing-dashboard/order-list">
            <el-icon><Tickets /></el-icon>
            <span>订单列表</span>
          </el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="traffic-monitor">
          <template #title>
            <el-icon><Monitor /></el-icon>
            <span>流量监控中心</span>
          </template>
          <el-menu-item index="/traffic-monitor/product-traffic-monitor">
            <el-icon><DataLine /></el-icon>
            <span>产品流量监控</span>
          </el-menu-item>
          <el-menu-item index="/traffic-monitor/aba-keyword-heat-monitor">
            <el-icon><Search /></el-icon>
            <span>ABA关键词热度监控</span>
          </el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="private-domain">
          <template #title>
            <el-icon><Connection /></el-icon>
            <span>私域运营中心</span>
          </template>
          <el-menu-item index="/private-domain/qr-code-marketing">
            <el-icon><Grid /></el-icon>
            <span>二维码营销</span>
          </el-menu-item>
          <el-menu-item index="/private-domain/customer-management">
            <el-icon><User /></el-icon>
            <span>客户管理</span>
          </el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="voc-analysis">
          <template #title>
            <el-icon><ChatLineRound /></el-icon>
            <span>VOC分析中心</span>
          </template>
          <el-menu-item index="/voc-analysis/voc-workbench">
            <el-icon><DocumentChecked /></el-icon>
            <span>VOC获取工作台</span>
          </el-menu-item>
          <el-menu-item index="/voc-analysis/voc-analysis">
            <el-icon><DataBoard /></el-icon>
            <span>VOC分析</span>
          </el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="system-management">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>系统管理</span>
          </template>
          <el-menu-item index="/system-management/user-management">
            <el-icon><UserFilled /></el-icon>
            <span>用户管理</span>
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
