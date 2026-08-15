<template>
  <el-drawer
    v-model="drawerVisible"
    :title="`分配权限 - ${role?.name || ''}`"
    size="560px"
    destroy-on-close
    class="role-permission-drawer"
  >
    <div v-loading="loading" class="permission-editor">
      <div class="permission-tree-scroll">
        <el-tree
          ref="treeRef"
          :data="menuTree"
          :props="treeProps"
          node-key="menuId"
          show-checkbox
          default-expand-all
          check-on-click-node
          :expand-on-click-node="false"
          empty-text="暂无菜单页面数据"
          class="permission-tree"
          @check="handleTreeCheck"
        >
          <template #default="{ data }">
            <div class="permission-tree-node">
              <div class="permission-tree-node__info">
                <span>{{ data.title }}</span>
                <small>{{ data.path }}</small>
              </div>
            </div>
          </template>
        </el-tree>
      </div>
    </div>

    <template #footer>
      <div class="permission-editor__footer">
        <el-button @click="drawerVisible = false">取消</el-button>
        <el-button
          type="primary"
          :disabled="!hasPermissionChanged"
          :loading="saving"
          @click="handleSavePermissions"
        >
          保存
        </el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { buildPermissionMenuTree } from '@/utils/MenuPermission'
import Request from '@/utils/Request'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  role: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue', 'saved'])

const treeProps = { children: 'children', label: 'title' }
const treeRef = ref()
const loading = ref(false)
const saving = ref(false)
const allMenus = ref([])
const initialPermissionKey = ref('[]')
const currentPermissionKey = ref('[]')

const drawerVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const menuTree = computed(() => buildPermissionMenuTree(allMenus.value))

const hasPermissionChanged = computed(() => {
  return !loading.value && currentPermissionKey.value !== initialPermissionKey.value
})

const normalizePermissionKey = (ids) => {
  return JSON.stringify([...new Set(ids.map(String))].sort())
}

const collectSelectedIds = () => {
  if (!treeRef.value) {
    return []
  }
  return [...treeRef.value.getCheckedKeys(false), ...treeRef.value.getHalfCheckedKeys()]
}

const syncCurrentPermissionKey = () => {
  currentPermissionKey.value = normalizePermissionKey(collectSelectedIds())
}

const loadPermissionData = async () => {
  if (!props.role?.roleId) {
    return
  }

  loading.value = true
  const roleId = encodeURIComponent(props.role.roleId)
  const [allMenuResponse, permissionResponse] = await Promise.all([
    Request({
      url: '/admin/loadAllMenuList',
      method: 'get',
      showLoading: false,
    }),
    Request({
      url: `/admin/loadRoleMenuPermissionsByRoleId/${roleId}`,
      method: 'get',
      showLoading: false,
    }),
  ])

  if (!allMenuResponse || !permissionResponse) {
    loading.value = false
    return
  }

  allMenus.value = Array.isArray(allMenuResponse.data) ? allMenuResponse.data : []
  const permissions = Array.isArray(permissionResponse.data) ? permissionResponse.data : []
  const parentIdSet = new Set(allMenus.value.map((item) => String(item.pid)))
  const checkedLeafIds = permissions
    .map((item) => String(item.menuId))
    .filter((menuId) => !parentIdSet.has(menuId))
  await nextTick()
  treeRef.value?.setCheckedKeys(checkedLeafIds)
  await nextTick()
  syncCurrentPermissionKey()
  initialPermissionKey.value = currentPermissionKey.value
  loading.value = false
}

const handleTreeCheck = () => {
  syncCurrentPermissionKey()
}

const handleSavePermissions = async () => {
  if (!hasPermissionChanged.value || saving.value || !props.role?.roleId) {
    return
  }

  const selectedIdSet = new Set(collectSelectedIds().map(String))
  const selectedMenus = allMenus.value.filter((menu) => selectedIdSet.has(String(menu.menuId)))
  saving.value = true
  const response = await Request({
    url: `/admin/updateRoleMenuPermissionsByRoleId/${encodeURIComponent(props.role.roleId)}`,
    params: selectedMenus,
    dataType: 'json',
    showLoading: false,
  }).finally(() => {
    saving.value = false
  })

  if (!response) {
    return
  }

  ElMessage.success('角色菜单权限已保存')
  initialPermissionKey.value = normalizePermissionKey(selectedMenus.map((menu) => menu.menuId))
  currentPermissionKey.value = initialPermissionKey.value
  drawerVisible.value = false
  emit('saved')
}

watch(drawerVisible, (visible) => {
  if (visible) {
    loadPermissionData()
    return
  }

  allMenus.value = []
  initialPermissionKey.value = '[]'
  currentPermissionKey.value = '[]'
})
</script>

<style scoped lang="scss"></style>
