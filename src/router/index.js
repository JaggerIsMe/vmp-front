import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import Message from '@/utils/Message'
import { marketingDashboardRoutes } from '@/router/marketingDashboardRoutes'

const AppLayout = () => import('@/components/layout/AppLayout.vue')
const LoginPage = () => import('@/views/login/LoginPage.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: LoginPage,
      meta: { title: '登录', public: true },
    },
    {
      path: '/',
      component: AppLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: 'no-permission',
          name: 'NoPermission',
          component: () => import('@/views/error/NoPermissionPage.vue'),
          meta: {
            title: '暂无访问权限',
            parentTitle: '权限校验',
            permissionFree: true,
          },
        },
        ...marketingDashboardRoutes,
        {
          path: 'traffic-monitor/product-traffic-monitor',
          name: 'ProductTrafficMonitor',
          component: () => import('@/views/traffic-monitor/ProductTrafficMonitor.vue'),
          meta: { title: '产品流量监控', parentTitle: '流量监控中心' },
        },
        {
          path: 'traffic-monitor/aba-keyword-heat-monitor',
          name: 'AbaKeywordHeatMonitor',
          component: () => import('@/views/traffic-monitor/AbaKeywordHeatMonitor.vue'),
          meta: { title: 'ABA关键词热度监控', parentTitle: '流量监控中心' },
        },
        {
          path: 'private-domain/qr-code-marketing',
          name: 'QrCodeMarketing',
          component: () => import('@/views/private-domain/QrCodeMarketing.vue'),
          meta: { title: '二维码营销', parentTitle: '私域运营中心' },
        },
        {
          path: 'private-domain/customer-management',
          name: 'CustomerManagement',
          component: () => import('@/views/private-domain/CustomerManagement.vue'),
          meta: { title: '客户管理', parentTitle: '私域运营中心' },
        },
        {
          path: 'voc-analysis/voc-workbench',
          name: 'VocWorkbench',
          component: () => import('@/views/voc-analysis/VocWorkbench.vue'),
          meta: { title: 'VOC获取工作台', parentTitle: 'VOC分析中心' },
        },
        {
          path: 'voc-analysis/voc-analysis',
          name: 'VocAnalysis',
          component: () => import('@/views/voc-analysis/VocAnalysis.vue'),
          meta: { title: 'VOC分析', parentTitle: 'VOC分析中心' },
        },
        {
          path: 'system-management/user-management',
          name: 'UserManagement',
          component: () => import('@/views/system-management/UserManagement.vue'),
          meta: { title: '用户管理', parentTitle: '系统管理' },
        },
        {
          path: 'system-management/role-management',
          name: 'RoleManagement',
          component: () => import('@/views/system-management/RoleManagement.vue'),
          meta: { title: '角色管理', parentTitle: '系统管理' },
        },
        {
          path: 'system-management/dictionary-management',
          name: 'DictionaryManagement',
          component: () => import('@/views/system-management/DictionaryManagement.vue'),
          meta: { title: '字典管理', parentTitle: '系统管理' },
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/no-permission',
    },
  ],
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  if (to.meta.public) {
    if (!authStore.isLogin && !authStore.hasCheckedLogin) {
      await authStore.fetchUserInfo()
    }

    if (authStore.isLogin) {
      const redirectUrl = to.query.redirectUrl
      const targetUrl = Array.isArray(redirectUrl) ? redirectUrl[0] : redirectUrl

      return targetUrl && targetUrl.startsWith('/') && !targetUrl.startsWith('//')
        ? targetUrl
        : '/'
    }

    return true
  }

  const isLogin = await authStore.ensureLogin()

  if (!isLogin) {
    return {
      path: '/login',
      query: {
        redirectUrl: to.fullPath,
      },
      replace: true,
    }
  }

  if (to.meta.permissionFree) {
    return true
  }

  const hasLoadedPermissions = await authStore.fetchPermissionInfo({ showError: false })

  if (!hasLoadedPermissions) {
    const sessionStillValid = await authStore.fetchUserInfo()

    if (!sessionStillValid) {
      return {
        path: '/login',
        query: { redirectUrl: to.fullPath },
        replace: true,
      }
    }

    Message.error('权限信息获取失败，已拒绝访问')
    return {
      name: 'NoPermission',
      query: { from: to.fullPath },
      replace: true,
    }
  }

  if (to.path === '/') {
    return authStore.firstPermittedPath
      ? { path: authStore.firstPermittedPath, replace: true }
      : { name: 'NoPermission', replace: true }
  }

  if (!authStore.hasPagePermission(to.path)) {
    Message.warning('当前角色无权访问该页面')
    return {
      name: 'NoPermission',
      query: { from: to.fullPath },
      replace: true,
    }
  }

  return true
})

export default router
