<template>
  <section class="page-shell">
    <el-result
      icon="warning"
      title="暂无访问权限"
      sub-title="当前角色未分配此页面权限，请联系管理员调整角色权限。"
    >
      <template v-if="authStore.firstPermittedPath" #extra>
        <el-button type="primary" @click="returnToAuthorizedPage">返回可访问页面</el-button>
      </template>
    </el-result>
  </section>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const returnToAuthorizedPage = () => {
  router.replace(authStore.firstPermittedPath)
}
</script>
