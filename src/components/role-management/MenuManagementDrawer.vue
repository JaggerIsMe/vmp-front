<template>
  <el-drawer
    v-model="drawerVisible"
    title="菜单页面管理"
    size="560px"
    destroy-on-close
    class="menu-management-drawer"
  >
    <div v-loading="loading || sorting" class="menu-management-editor">
      <div class="menu-management-editor__toolbar">
        <el-button type="primary" :icon="Plus" @click="handleAddMenu">新增菜单页面</el-button>
        <span>仅支持同级菜单拖拽排序</span>
      </div>

      <div class="menu-management-tree-scroll">
        <el-tree
          :data="menuTree"
          :props="treeProps"
          node-key="menuId"
          default-expand-all
          draggable
          :expand-on-click-node="false"
          :allow-drag="allowDrag"
          :allow-drop="allowDrop"
          empty-text="暂无菜单页面数据"
          class="menu-management-tree"
          @node-drop="handleNodeDrop"
        >
          <template #default="{ data }">
            <div class="menu-management-tree-node">
              <div class="menu-management-tree-node__info">
                <span>{{ data.title }}</span>
                <small>{{ data.path }}</small>
              </div>
              <el-button
                class="menu-management-tree-node__edit"
                text
                circle
                :icon="Edit"
                title="修改菜单页面"
                @click.stop="handleEditMenu(data)"
              />
            </div>
          </template>
        </el-tree>
      </div>
    </div>
  </el-drawer>

  <MenuInfoDialog
    v-model="menuDialogVisible"
    :menu="editingMenu"
    :menus="menuOptions"
    @saved="handleMenuSaved"
  />
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { Edit, Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import MenuInfoDialog from '@/components/role-management/MenuInfoDialog.vue'
import {
  buildMenuSortParams,
  buildPermissionMenuTree,
  canDropMenu,
} from '@/utils/MenuPermission'
import Request from '@/utils/Request'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])

const treeProps = { children: 'children', label: 'title' }
const loading = ref(false)
const sorting = ref(false)
const allMenus = ref([])
const menuDialogVisible = ref(false)
const editingMenu = ref(null)

const drawerVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

const menuTree = computed(() => buildPermissionMenuTree(allMenus.value))

const menuOptions = computed(() => {
  const result = []
  const walk = (nodes, depth = 0) => {
    nodes.forEach((node) => {
      result.push({ ...node, depth, children: undefined })
      walk(node.children || [], depth + 1)
    })
  }
  walk(menuTree.value)
  return result
})

const loadMenus = async () => {
  loading.value = true
  const response = await Request({
    url: '/admin/loadAllMenuList',
    method: 'get',
    showLoading: false,
  }).finally(() => {
    loading.value = false
  })

  if (!response) {
    return
  }

  allMenus.value = Array.isArray(response.data) ? response.data : []
}

const handleAddMenu = () => {
  editingMenu.value = null
  menuDialogVisible.value = true
}

const handleEditMenu = (menu) => {
  editingMenu.value = { ...menu, children: undefined }
  menuDialogVisible.value = true
}

const allowDrag = () => !sorting.value

const allowDrop = (draggingNode, dropNode, position) => {
  return !sorting.value && canDropMenu(draggingNode.data, dropNode.data, position)
}

const handleNodeDrop = async (draggingNode, dropNode, position) => {
  const params = buildMenuSortParams(draggingNode.data, dropNode.data, position)
  if (!params || sorting.value) {
    await loadMenus()
    return
  }

  sorting.value = true
  const response = await Request({
    url: '/admin/dragSortMenu',
    params,
    showLoading: false,
  })
  await loadMenus()
  sorting.value = false

  if (response) {
    ElMessage.success('菜单顺序已更新')
  }
}

const handleMenuSaved = () => {
  loadMenus()
}

watch(drawerVisible, (visible) => {
  if (visible) {
    loadMenus()
    return
  }

  allMenus.value = []
  editingMenu.value = null
  menuDialogVisible.value = false
  sorting.value = false
})
</script>

<style scoped lang="scss"></style>
