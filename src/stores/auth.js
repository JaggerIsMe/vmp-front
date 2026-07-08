import { defineStore } from 'pinia'
import md5 from '@/utils/Md5'
import request from '@/utils/Request'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    userInfo: null,
    hasCheckedLogin: false,
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
  },
  actions: {
    setUserInfo(response) {
      this.userInfo = response?.data || response || null
      this.hasCheckedLogin = true
    },
    clearLogin() {
      this.userInfo = null
      this.hasCheckedLogin = true
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

      return this.fetchUserInfo()
    },
    async loginByDingTalk(authCode) {
      const response = await request({
        url: '/dtLogin/auth/code',
        params: {
          authCode,
        },
      })

      if (!response) {
        this.clearLogin()
        return false
      }

      return this.fetchUserInfo()
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
