<template>
  <main class="login-page">
    <section class="login-brand">
      <div class="login-brand__mark">VMP</div>
      <div>
        <p>三匠集团市场营销中台</p>
        <h1>Vantrue Marketing Platform</h1>
      </div>
    </section>

    <section class="login-panel">
      <div class="login-panel__header">
        <h2>{{ loginPanelTitle }}</h2>
        <span>{{ loginPanelSubtitle }}</span>
      </div>

      <el-radio-group
        v-model="activeLoginType"
        class="login-mode-switch"
        size="large"
        @change="handleLoginTypeChange"
      >
        <el-radio-button label="account">账号密码登录</el-radio-button>
        <el-radio-button label="dingTalk">钉钉扫码登录</el-radio-button>
      </el-radio-group>

      <el-form
        v-if="activeLoginType === 'account'"
        ref="loginFormRef"
        class="login-form"
        :model="loginForm"
        :rules="loginRules"
        label-position="top"
        @submit.prevent
      >
        <el-form-item label="账号" prop="account">
          <el-input
            v-model.trim="loginForm.account"
            clearable
            placeholder="请输入账号"
            size="large"
            @keyup.enter="handleLogin"
          >
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="loginForm.password"
            clearable
            placeholder="请输入密码"
            show-password
            size="large"
            type="password"
            @keyup.enter="handleLogin"
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-button
          class="login-form__button"
          :loading="submitting"
          size="large"
          type="primary"
          @click="handleLogin"
        >
          登录
        </el-button>
      </el-form>

      <div v-else class="ding-talk-login">
        <div class="ding-talk-login__qr">
          <div id="ding-talk-login-frame" ref="dingTalkFrameRef" class="ding-talk-login__frame"></div>

          <div v-if="dingTalkLoading" class="ding-talk-login__status">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span>正在加载扫码组件</span>
          </div>

          <div v-else-if="dingTalkError" class="ding-talk-login__status ding-talk-login__status--error">
            <span>{{ dingTalkError }}</span>
            <el-button text type="primary" @click="reloadDingTalkLogin">
              <el-icon><Refresh /></el-icon>
              <span>重新加载</span>
            </el-button>
          </div>
        </div>

        <p class="ding-talk-login__tip">请使用钉钉 App 扫码完成登录</p>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Loading, Lock, Refresh, User } from '@element-plus/icons-vue'
import Message from '@/utils/Message'
import { claimDingTalkAuthCode } from '@/utils/DingTalkLoginGuard'
import { useAuthStore } from '@/stores/auth'
import dingTalkConfig from '@/config/ding-talk.config'

const DING_TALK_SCRIPT_ID = 'ding-talk-login-script'
const DING_TALK_SCRIPT_URL = 'https://g.alicdn.com/dingding/h5-dingtalk-login/0.21.0/ddlogin.js'
const DING_TALK_FRAME_ID = 'ding-talk-login-frame'

let dingTalkScriptPromise = null

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const loginFormRef = ref()
const dingTalkFrameRef = ref()
const activeLoginType = ref('account')
const submitting = ref(false)
const dingTalkLoading = ref(false)
const dingTalkLoggingIn = ref(false)
const dingTalkError = ref('')
const loginForm = reactive({
  account: '',
  password: '',
})

const loginRules = {
  account: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

const loginPanelTitle = computed(() => {
  return activeLoginType.value === 'account' ? '账号登录' : '钉钉扫码登录'
})

const loginPanelSubtitle = computed(() => {
  return activeLoginType.value === 'account'
    ? '进入营销中台'
    : '使用钉钉 App 扫码进入营销中台'
})

const redirectUrl = computed(() => {
  const queryUrl = route.query.redirectUrl
  const targetUrl = Array.isArray(queryUrl) ? queryUrl[0] : queryUrl

  if (!targetUrl || !targetUrl.startsWith('/') || targetUrl.startsWith('//')) {
    return '/'
  }

  return targetUrl
})

const dingTalkAuthCode = computed(() => {
  const queryCode = route.query.authCode || route.query.code
  return Array.isArray(queryCode) ? queryCode[0] : queryCode
})

const buildDingTalkRedirectUri = () => {
  const query = {}
  const queryRedirectUrl = route.query.redirectUrl

  if (queryRedirectUrl) {
    query.redirectUrl = Array.isArray(queryRedirectUrl) ? queryRedirectUrl[0] : queryRedirectUrl
  }

  const loginUrl = router.resolve({
    path: '/login',
    query,
  }).href

  return `${window.location.origin}${loginUrl}`
}

const loadDingTalkScript = () => {
  if (window.DTFrameLogin) {
    return Promise.resolve()
  }

  if (dingTalkScriptPromise) {
    return dingTalkScriptPromise
  }

  dingTalkScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(DING_TALK_SCRIPT_ID)

    if (existingScript?.dataset.loaded === 'true') {
      reject(new Error('钉钉扫码组件加载失败'))
      return
    }

    if (existingScript) {
      existingScript.addEventListener('load', resolve, { once: true })
      existingScript.addEventListener('error', (error) => {
        dingTalkScriptPromise = null
        reject(error)
      }, { once: true })
      return
    }

    const script = document.createElement('script')
    script.id = DING_TALK_SCRIPT_ID
    script.src = DING_TALK_SCRIPT_URL
    script.async = true
    script.onload = () => {
      script.dataset.loaded = 'true'
      resolve()
    }
    script.onerror = (error) => {
      dingTalkScriptPromise = null
      script.remove()
      reject(error)
    }
    document.head.appendChild(script)
  })

  return dingTalkScriptPromise
}

const clearDingTalkFrame = () => {
  if (dingTalkFrameRef.value) {
    dingTalkFrameRef.value.innerHTML = ''
  }
}

const handleDingTalkLoginSuccess = async (authCode) => {
  if (dingTalkLoggingIn.value) {
    return
  }

  const normalizedAuthCode = claimDingTalkAuthCode(authCode)
  if (!normalizedAuthCode) {
    return
  }

  dingTalkLoggingIn.value = true
  dingTalkError.value = ''
  const isLogin = await authStore.loginByDingTalk(normalizedAuthCode).finally(() => {
    dingTalkLoggingIn.value = false
  })

  if (!isLogin) {
    initDingTalkLogin()
    return
  }

  Message.success('登录成功')
  router.replace(redirectUrl.value)
}

const initDingTalkLogin = async () => {
  dingTalkLoading.value = true
  dingTalkError.value = ''

  try {
    await loadDingTalkScript()
    await nextTick()

    clearDingTalkFrame()

    if (!window.DTFrameLogin) {
      throw new Error('钉钉扫码组件加载失败')
    }

    window.DTFrameLogin(
      {
        id: DING_TALK_FRAME_ID,
        width: 300,
        height: 300,
      },
      {
        redirect_uri: encodeURIComponent(buildDingTalkRedirectUri()),
        client_id: dingTalkConfig.clientId,
        scope: 'openid corpid',
        response_type: 'code',
        state: 'vmp-ding-talk-login',
        prompt: 'consent',
        corpId: dingTalkConfig.corpId,
      },
      (loginResult) => {
        const authCode = loginResult?.authCode || loginResult?.code

        if (authCode) {
          handleDingTalkLoginSuccess(authCode)
          return
        }

        if (loginResult?.redirectUrl) {
          window.location.href = loginResult.redirectUrl
        }
      },
      (errorMsg) => {
        dingTalkError.value = errorMsg || '钉钉扫码登录初始化失败'
      },
    )
  } catch (error) {
    dingTalkError.value = '钉钉扫码组件加载失败，请稍后重试'
  } finally {
    dingTalkLoading.value = false
  }
}

const reloadDingTalkLogin = () => {
  clearDingTalkFrame()
  initDingTalkLogin()
}

const handleLoginTypeChange = (loginType) => {
  if (loginType === 'dingTalk') {
    initDingTalkLogin()
    return
  }

  dingTalkError.value = ''
  clearDingTalkFrame()
}

const handleLogin = async () => {
  if (submitting.value) {
    return
  }

  const valid = await loginFormRef.value?.validate().catch(() => false)
  if (!valid) {
    return
  }

  submitting.value = true
  const isLogin = await authStore.login(loginForm).finally(() => {
    submitting.value = false
  })

  if (!isLogin) {
    return
  }

  Message.success('登录成功')
  router.replace(redirectUrl.value)
}

onMounted(() => {
  if (dingTalkAuthCode.value) {
    activeLoginType.value = 'dingTalk'
    handleDingTalkLoginSuccess(dingTalkAuthCode.value)
  }
})

onBeforeUnmount(() => {
  clearDingTalkFrame()
})
</script>

<style scoped lang="scss"></style>
