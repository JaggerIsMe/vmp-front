<template>
  <div class="user-info-menu">
    <el-dropdown trigger="click" @command="handleCommand">
      <button class="user-info-trigger" type="button">
        <el-avatar :size="36" :src="avatarUrl">
          {{ avatarText }}
        </el-avatar>
        <span>{{ nickName }}</span>
        <el-icon><ArrowDown /></el-icon>
      </button>

      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="profile" :icon="User">修改用户信息</el-dropdown-item>
          <el-dropdown-item command="password" :icon="Lock">修改密码</el-dropdown-item>
          <el-dropdown-item divided command="logout" :icon="SwitchButton">退出登录</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <UserProfileDialog v-model="profileDialogVisible" />
    <ResetPasswordDialog v-model="passwordDialogVisible" />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowDown,
  Lock,
  SwitchButton,
  User,
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import ResetPasswordDialog from '@/components/user-info/ResetPasswordDialog.vue'
import UserProfileDialog from '@/components/user-info/UserProfileDialog.vue'

const router = useRouter()
const authStore = useAuthStore()
const profileDialogVisible = ref(false)
const passwordDialogVisible = ref(false)

const avatarUrl = computed(() => authStore.avatarUrl)
const nickName = computed(() => authStore.nickName)
const avatarText = computed(() => (nickName.value || 'U').slice(0, 1).toUpperCase())

const handleCommand = async (command) => {
  if (command === 'profile') {
    profileDialogVisible.value = true
    return
  }

  if (command === 'password') {
    passwordDialogVisible.value = true
    return
  }

  if (command === 'logout') {
    await authStore.logout()
    router.replace('/login')
  }
}
</script>

<style scoped lang="scss"></style>
