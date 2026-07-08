import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

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
      redirect: '/marketing-dashboard/product-sales-performance',
      meta: { requiresAuth: true },
      children: [
        {
          path: 'marketing-dashboard/product-sales-performance',
          name: 'ProductSalesPerformance',
          component: () => import('@/views/marketing-dashboard/ProductSalesPerformance.vue'),
          meta: { title: '产品销售表现', parentTitle: '营销驾驶舱' },
        },
        {
          path: 'marketing-dashboard/order-list',
          name: 'OrderList',
          component: () => import('@/views/marketing-dashboard/OrderList.vue'),
          meta: { title: '订单列表', parentTitle: '营销驾驶舱' },
        },
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
      ],
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

  return true
})

export default router
