<template>
  <section class="page-shell role-management-page">
    <el-row :gutter="16" class="metric-row">
      <el-col :xs="24" :sm="8">
        <div class="metric-card">
          <span>角色总数</span>
          <strong>{{ statistics.total }}</strong>
          <small>当前系统角色数量</small>
        </div>
      </el-col>
      <el-col :xs="24" :sm="8">
        <div class="metric-card">
          <span>启用角色</span>
          <strong>{{ statistics.enabled }}</strong>
          <small>状态为启用的角色</small>
        </div>
      </el-col>
      <el-col :xs="24" :sm="8">
        <div class="metric-card">
          <span>停用角色</span>
          <strong>{{ statistics.disabled }}</strong>
          <small>状态为停用的角色</small>
        </div>
      </el-col>
    </el-row>

    <div class="work-panel role-management-panel">
      <el-row :gutter="12" class="search-row role-search-row">
        <el-col :xs="24" :sm="12" :md="7" :lg="5">
          <el-input
            v-model.trim="queryForm.nameFuzzy"
            :prefix-icon="Search"
            placeholder="请输入角色名"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :md="5" :lg="4">
          <el-select v-model="queryForm.level" placeholder="角色等级" clearable>
            <el-option
              v-for="item in roleLevelOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="12" :md="5" :lg="4">
          <el-select v-model="queryForm.status" placeholder="角色状态" clearable>
            <el-option label="启用" :value="1" />
            <el-option label="停用" :value="0" />
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="12" :md="12" :lg="8" class="role-search-actions">
          <div class="role-search-button-group">
            <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
            <el-button :icon="RefreshLeft" @click="handleReset">重置</el-button>
            <el-button type="success" :icon="Plus" @click="handleAddRole">新增角色</el-button>
          </div>
        </el-col>
      </el-row>

      <div class="role-table-scroll">
        <el-table
          v-loading="tableLoading"
          :data="roleList"
          class="basic-table role-table"
          height="100%"
          border
          stripe
          empty-text="暂无角色数据"
        >
          <el-table-column prop="name" label="角色名称" min-width="180" show-overflow-tooltip />
          <el-table-column prop="level" label="角色级别" width="130" align="center">
            <template #default="{ row }">
              <el-tag type="primary" effect="plain">{{ formatRoleLevel(row.level) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="角色状态" width="120" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'danger'">
                {{ row.status === 1 ? '启用' : '停用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="修改人昵称" min-width="160" align="center">
            <template #default="{ row }">
              <el-popover
                v-if="row.updateBy"
                placement="top"
                trigger="hover"
                :width="300"
                popper-class="operator-detail-popper"
              >
                <template #reference>
                  <span class="operator-name">{{ row.updateBy.nickName || '-' }}</span>
                </template>
                <div class="operator-detail">
                  <el-avatar :size="52" :src="buildAvatarUrl(row.updateBy.userId)">
                    {{ getOperatorAvatarText(row.updateBy) }}
                  </el-avatar>
                  <div class="operator-detail__content">
                    <strong>{{ row.updateBy.nickName || '-' }}</strong>
                    <span>身份：{{ row.updateBy.admin === 1 ? '管理员' : '普通用户' }}</span>
                    <span>状态：{{ row.updateBy.status === 1 ? '启用' : '停用' }}</span>
                    <span>最后登录：{{ row.updateBy.lastLoginTime || '-' }}</span>
                  </div>
                </div>
              </el-popover>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="updateTime" label="修改时间" min-width="180">
            <template #default="{ row }">{{ row.updateTime || '-' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right" align="center">
            <template #default="{ row }">
              <div class="role-table-actions">
                <el-button type="primary" plain :icon="Edit" @click="handleEditRole(row)">
                  修改信息
                </el-button>
                <el-button type="warning" plain :icon="Key" @click="handleAssignPermission(row)">
                  分配权限
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="role-pagination">
        <el-pagination
          v-model:current-page="pagination.pageNo"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 15, 20, 50]"
          :total="pagination.totalCount"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handlePageSizeChange"
          @current-change="handlePageNoChange"
        />
      </div>
    </div>

    <RoleInfoDialog v-model="dialogVisible" :role="editingRole" @saved="handleRoleSaved" />
    <RolePermissionDrawer
      v-model="permissionDrawerVisible"
      :role="permissionRole"
      @saved="handlePermissionSaved"
    />
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { Edit, Key, Plus, RefreshLeft, Search } from '@element-plus/icons-vue'
import RoleInfoDialog from '@/components/role-management/RoleInfoDialog.vue'
import RolePermissionDrawer from '@/components/role-management/RolePermissionDrawer.vue'
import Request from '@/utils/Request'

const roleLevelOptions = [
  { label: '开发者', value: 0 },
  { label: '老板', value: 1 },
  { label: '主管', value: 2 },
  { label: '组长', value: 3 },
  { label: '组员', value: 4 },
]

const queryForm = reactive({
  nameFuzzy: '',
  level: '',
  status: '',
})
const pagination = reactive({
  pageNo: 1,
  pageSize: 15,
  totalCount: 0,
})
const statistics = reactive({
  total: '--',
  enabled: '--',
  disabled: '--',
})

const roleList = ref([])
const tableLoading = ref(false)
const dialogVisible = ref(false)
const editingRole = ref(null)
const permissionDrawerVisible = ref(false)
const permissionRole = ref(null)
const roleListUrl = '/admin/loadRoleList'

const hasSelectValue = (value) => value !== '' && value !== null && value !== undefined

const buildListParams = () => {
  const params = {
    pageNo: pagination.pageNo,
    pageSize: pagination.pageSize,
  }

  if (queryForm.nameFuzzy) {
    params.nameFuzzy = queryForm.nameFuzzy
  }
  if (hasSelectValue(queryForm.level)) {
    params.level = queryForm.level
  }
  if (hasSelectValue(queryForm.status)) {
    params.status = queryForm.status
  }

  return params
}

const getTotalCount = (response) => {
  const count = response?.data?.totalCount
  return Number.isFinite(Number(count)) ? Number(count) : 0
}

const loadRoleList = async () => {
  tableLoading.value = true
  const response = await Request({
    url: roleListUrl,
    params: buildListParams(),
    showLoading: false,
  }).finally(() => {
    tableLoading.value = false
  })

  if (!response) {
    return
  }

  const pageData = response.data || {}
  roleList.value = Array.isArray(pageData.list)
    ? pageData.list.map((item) => ({
        ...item,
        level: Number(item.level),
        status: Number(item.status),
        updateBy: item.updateBy
          ? {
              ...item.updateBy,
              admin: Number(item.updateBy.admin),
              status: Number(item.updateBy.status),
            }
          : null,
      }))
    : []
  pagination.totalCount = Number(pageData.totalCount || 0)
}

const loadStatistics = async () => {
  const [totalResponse, enabledResponse, disabledResponse] = await Promise.all([
    Request({
      url: roleListUrl,
      params: { pageNo: 1, pageSize: 1 },
      showLoading: false,
      showError: false,
    }),
    Request({
      url: roleListUrl,
      params: { pageNo: 1, pageSize: 1, status: 1 },
      showLoading: false,
      showError: false,
    }),
    Request({
      url: roleListUrl,
      params: { pageNo: 1, pageSize: 1, status: 0 },
      showLoading: false,
      showError: false,
    }),
  ])

  statistics.total = getTotalCount(totalResponse)
  statistics.enabled = getTotalCount(enabledResponse)
  statistics.disabled = getTotalCount(disabledResponse)
}

const loadPageData = () => Promise.all([loadRoleList(), loadStatistics()])

const formatRoleLevel = (level) => {
  return roleLevelOptions.find((item) => item.value === level)?.label || '-'
}

const buildAvatarUrl = (userId) => {
  return userId ? `/api/account/getAvatar/${encodeURIComponent(userId)}` : ''
}

const getOperatorAvatarText = (operator) => {
  return String(operator?.nickName || operator?.account || 'U').slice(0, 1).toUpperCase()
}

const handleSearch = () => {
  pagination.pageNo = 1
  loadRoleList()
}

const handleReset = () => {
  queryForm.nameFuzzy = ''
  queryForm.level = ''
  queryForm.status = ''
  pagination.pageNo = 1
  loadRoleList()
}

const handlePageSizeChange = (pageSize) => {
  pagination.pageSize = pageSize
  pagination.pageNo = 1
  loadRoleList()
}

const handlePageNoChange = (pageNo) => {
  pagination.pageNo = pageNo
  loadRoleList()
}

const handleAddRole = () => {
  editingRole.value = null
  dialogVisible.value = true
}

const handleEditRole = (role) => {
  editingRole.value = { ...role }
  dialogVisible.value = true
}

const handleRoleSaved = () => {
  loadPageData()
}

const handleAssignPermission = (role) => {
  permissionRole.value = { ...role }
  permissionDrawerVisible.value = true
}

const handlePermissionSaved = () => {
  loadRoleList()
}

onMounted(() => {
  loadPageData()
})
</script>

<style scoped lang="scss"></style>
