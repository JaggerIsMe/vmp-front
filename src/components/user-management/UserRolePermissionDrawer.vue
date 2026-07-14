<template>
  <el-drawer
    v-model="drawerVisible"
    :title="`分配权限 - ${user?.nickName || user?.account || ''}`"
    size="560px"
    destroy-on-close
    class="user-role-drawer"
  >
    <div v-loading="loading" class="user-role-editor">
      <div class="user-role-editor__selector">
        <span>用户角色</span>
        <el-select
          v-model="selectedRoleId"
          placeholder="请选择角色"
          filterable
          @change="handleRoleChange"
        >
          <el-option
            v-for="role in roleOptions"
            :key="role.roleId"
            :label="role.name"
            :value="role.roleId"
            :disabled="role.disabled"
          >
            <div class="user-role-option">
              <span>{{ role.name }}</span>
              <small>{{ formatRoleLevel(role.level) }}</small>
            </div>
          </el-option>
        </el-select>
      </div>

      <div v-loading="menuLoading" class="user-role-tree-scroll">
        <div class="user-role-tree-title">菜单页面权限</div>
        <el-tree
          :data="menuTree"
          :props="treeProps"
          node-key="menuId"
          default-expand-all
          :expand-on-click-node="false"
          empty-text="当前角色暂无菜单页面权限"
          class="user-role-permission-tree"
        >
          <template #default="{ data }">
            <div class="user-role-tree-node">
              <span>{{ data.title }}</span>
              <small>{{ data.path }}</small>
            </div>
          </template>
        </el-tree>
      </div>
    </div>

    <template #footer>
      <div class="user-role-editor__footer">
        <el-button @click="drawerVisible = false">取消</el-button>
        <el-button
          type="primary"
          :disabled="!hasRoleChanged"
          :loading="saving"
          @click="handleSave"
        >
          保存
        </el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import Request from '@/utils/Request'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  user: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue'])

const roleLevelOptions = [
  { label: '开发者', value: 0 },
  { label: '老板', value: 1 },
  { label: '主管', value: 2 },
  { label: '组长', value: 3 },
  { label: '组员', value: 4 },
]
const treeProps = { children: 'children', label: 'title' }
const loading = ref(false)
const menuLoading = ref(false)
const saving = ref(false)
const availableRoles = ref([])
const currentRole = ref(null)
const selectedRoleId = ref('')
const initialRoleId = ref('')
const permissionMenus = ref([])
let permissionRequestId = 0

const drawerVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const roleOptions = computed(() => {
  const roles = [...availableRoles.value]
  if (currentRole.value?.roleId && !roles.some((role) => role.roleId === currentRole.value.roleId)) {
    roles.unshift({ ...currentRole.value, disabled: true })
  }
  return roles
})

const hasRoleChanged = computed(() => {
  return Boolean(selectedRoleId.value) && selectedRoleId.value !== initialRoleId.value && !loading.value
})

const getCreateTimeValue = (createTime) => {
  if (!createTime) {
    return Number.MAX_SAFE_INTEGER
  }

  const time = new Date(String(createTime).replace(' ', 'T')).getTime()
  return Number.isNaN(time) ? Number.MAX_SAFE_INTEGER : time
}

const menuTree = computed(() => {
  const nodeMap = new Map(
    permissionMenus.value.map((menu, sourceIndex) => [
      menu.menuId,
      { ...menu, sourceIndex, children: [] },
    ]),
  )
  const roots = []

  nodeMap.forEach((node) => {
    const parent = nodeMap.get(node.pid)
    if (node.pid === 'VMP' || !parent) {
      roots.push(node)
    } else {
      parent.children.push(node)
    }
  })

  const sortTree = (nodes) => {
    const sorted = [...nodes].sort((a, b) => {
      return getCreateTimeValue(a.createTime) - getCreateTimeValue(b.createTime) ||
        a.sourceIndex - b.sourceIndex
    })
    sorted.forEach((node) => {
      node.children = sortTree(node.children)
    })
    return sorted
  }

  return sortTree(roots)
})

const formatRoleLevel = (level) => {
  return roleLevelOptions.find((item) => item.value === Number(level))?.label || '-'
}

const loadInitialData = async () => {
  if (!props.user?.userId) {
    return
  }

  const requestId = ++permissionRequestId
  loading.value = true
  const userId = encodeURIComponent(props.user.userId)
  const [userRoleResponse, availableRoleResponse] = await Promise.all([
    Request({
      url: `/account/getUserRoleMenuPermissionsInfo/${userId}`,
      method: 'get',
      showLoading: false,
    }),
    Request({
      url: '/admin/loadAllEnableRoleList',
      method: 'get',
      showLoading: false,
    }),
  ])

  if (requestId !== permissionRequestId) {
    return
  }

  if (!userRoleResponse || !availableRoleResponse) {
    loading.value = false
    return
  }

  currentRole.value = userRoleResponse.data || null
  availableRoles.value = Array.isArray(availableRoleResponse.data) ? availableRoleResponse.data : []
  selectedRoleId.value = String(currentRole.value?.roleId || '')
  initialRoleId.value = selectedRoleId.value
  permissionMenus.value = Array.isArray(currentRole.value?.roleMenuPermissionsList)
    ? currentRole.value.roleMenuPermissionsList
    : []
  loading.value = false
}

const handleRoleChange = async (roleId) => {
  if (!roleId) {
    permissionMenus.value = []
    return
  }

  const requestId = ++permissionRequestId
  menuLoading.value = true
  const response = await Request({
    url: `/admin/loadRoleMenuPermissionsByRoleId/${encodeURIComponent(roleId)}`,
    method: 'get',
    showLoading: false,
  })

  if (requestId !== permissionRequestId) {
    return
  }

  permissionMenus.value = response && Array.isArray(response.data) ? response.data : []
  menuLoading.value = false
}

const handleSave = async () => {
  if (!hasRoleChanged.value || saving.value || !props.user?.userId) {
    return
  }

  saving.value = true
  const response = await Request({
    url: `/admin/updateUserRoleByUserId/${encodeURIComponent(props.user.userId)}/${encodeURIComponent(selectedRoleId.value)}`,
    method: 'get',
    showLoading: false,
  }).finally(() => {
    saving.value = false
  })

  if (!response) {
    return
  }

  ElMessage.success('用户角色权限已保存')
  initialRoleId.value = selectedRoleId.value
  drawerVisible.value = false
}

const resetDrawer = () => {
  permissionRequestId += 1
  availableRoles.value = []
  currentRole.value = null
  selectedRoleId.value = ''
  initialRoleId.value = ''
  permissionMenus.value = []
  loading.value = false
  menuLoading.value = false
  saving.value = false
}

watch(drawerVisible, (visible) => {
  if (visible) {
    loadInitialData()
    return
  }
  resetDrawer()
})
</script>

<style scoped lang="scss"></style>
