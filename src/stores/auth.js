import { defineStore } from 'pinia'
import md5 from '@/utils/Md5'
import request from '@/utils/Request'
import {
  buildPermissionMenuTree,
  collectPermittedPaths,
  filterNavigableMenuTree,
  normalizeMenuPath,
} from '@/utils/MenuPermission'

const dingTalkLoginTasks = new Map()

export const useAuthStore = defineStore('auth', {
  state: () => ({
    userInfo: null,
    roleInfo: null,
    permissionMenus: [],
    hasCheckedLogin: false,
    hasCheckedPermissions: false,
    avatarVersion: Date.now(),
  }),
  getters: {
    isLogin: (state) => Boolean(state.userInfo),
    avatarUrl: (state) => {
      const userId = state.userInfo?.userId

      if (!userId) {
        return ''
      }

      return `/api/account/getAvatar/${userId}?t=${state.avatarVersion}`
    },
    nickName: (state) => state.userInfo?.nickName || state.userInfo?.account || '当前用户',
    permissionMenuTree: (state) => buildPermissionMenuTree(state.permissionMenus),
    navigationMenus() {
      return filterNavigableMenuTree(this.permissionMenuTree)
    },
    permittedPaths() {
      return collectPermittedPaths(this.permissionMenuTree)
    },
    firstPermittedPath() {
      return this.permittedPaths[0] || ''
    },
    hasPagePermission() {
      const permittedPathSet = new Set(this.permittedPaths)
      return (path) => permittedPathSet.has(normalizeMenuPath(path))
    },
  },
  actions: {
    setUserInfo(response) {
      this.userInfo = response?.data || response || null
      this.hasCheckedLogin = true
    },
    clearLogin() {
      this.userInfo = null
      this.hasCheckedLogin = true
      this.clearPermissionInfo()
    },
    clearPermissionInfo() {
      this.roleInfo = null
      this.permissionMenus = []
      this.hasCheckedPermissions = false
    },
    setPermissionInfo(response) {
      const roleInfo = response?.data || response || null
      this.roleInfo = roleInfo
      this.permissionMenus = Array.isArray(roleInfo?.roleMenuPermissionsList)
        ? roleInfo.roleMenuPermissionsList
        : []
      this.hasCheckedPermissions = true
    },
    async login(formData) {
      const account = formData.account.trim()
      const password = md5(formData.password)
      const response = await request({
        url: '/account/login',
        params: {
          account,
          password,
        },
      })

      if (!response) {
        this.clearLogin()
        return false
      }

      return this.fetchLoginContext()
    },
    loginByDingTalk(authCode) {
      const normalizedAuthCode = String(authCode || '').trim()
      const existingLoginTask = dingTalkLoginTasks.get(normalizedAuthCode)

      if (existingLoginTask) {
        return existingLoginTask
      }

      const loginTask = (async () => {
        const response = await request({
          url: '/dtLogin/auth/code',
          params: {
            authCode: normalizedAuthCode,
          },
        })

        if (!response) {
          this.clearLogin()
          return false
        }

        return this.fetchLoginContext()
      })()

      dingTalkLoginTasks.set(normalizedAuthCode, loginTask)
      return loginTask
    },
    async fetchLoginContext() {
      const isLogin = await this.fetchUserInfo()

      if (!isLogin) {
        return false
      }

      await this.fetchPermissionInfo()
      return true
    },
    async fetchUserInfo() {
      const response = await request({
        url: '/account/getUserInfo',
        method: 'get',
        showLoading: false,
        showError: false,
      })

      if (!response) {
        this.clearLogin()
        return false
      }

      this.setUserInfo(response)
      return true
    },
    async fetchPermissionInfo(options = {}) {
      const userId = this.userInfo?.userId

      if (!userId) {
        this.clearPermissionInfo()
        return false
      }

      const response = await request({
        url: `/account/getUserRoleMenuPermissionsInfo/${encodeURIComponent(userId)}`,
        method: 'get',
        showLoading: false,
        showError: options.showError !== false,
      })

      if (!response?.data) {
        this.clearPermissionInfo()
        this.hasCheckedPermissions = true
        return false
      }

      this.setPermissionInfo(response)
      return true
    },
    async saveUserInfo(formData) {
      const params = new FormData()
      const account = formData.account?.trim()
      const nickName = formData.nickName?.trim()

      if (account) {
        params.append('account', account)
      }

      if (nickName) {
        params.append('nickName', nickName)
      }

      if (formData.avatarFile) {
        params.append('avatarFile', formData.avatarFile)
      }

      const response = await request({
        url: '/account/saveUserInfo',
        params,
      })

      if (!response) {
        return false
      }

      this.setUserInfo(response)
      this.avatarVersion = Date.now()
      return true
    },
    async initUserInfo(formData) {
      const params = new FormData()
      const account = formData.account?.trim()
      const nickName = formData.nickName?.trim()

      if (nickName) {
        params.append('nickName', nickName)
      }

      if (account) {
        params.append('account', account)
      }

      params.append('password', md5(formData.password))

      const response = await request({
        url: '/account/initUserInfo',
        params,
      })

      if (!response) {
        return false
      }

      return this.fetchUserInfo()
    },
    async resetPassword(password) {
      const response = await request({
        url: '/account/resetPwd',
        params: {
          password,
        },
      })

      return Boolean(response)
    },
    async ensureLogin() {
      if (this.isLogin) {
        return true
      }

      return this.fetchUserInfo()
    },
    async logout() {
      await request({
        url: '/account/logout',
        method: 'get',
        showLoading: false,
        showError: false,
      })
      this.clearLogin()
    },
  },
})
