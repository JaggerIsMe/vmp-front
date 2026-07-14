<template>
  <section class="page-shell user-management-page">
    <el-row :gutter="16" class="metric-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="metric-card">
          <span>用户总数</span>
          <strong>{{ statistics.total }}</strong>
          <small>当前系统用户数量</small>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="metric-card">
          <span>在线用户数</span>
          <strong>{{ statistics.online }}</strong>
          <small>当前在线账号数量</small>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="metric-card">
          <span>启用账号</span>
          <strong>{{ statistics.enabled }}</strong>
          <small>状态为启用的账号</small>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="metric-card">
          <span>停用账号</span>
          <strong>{{ statistics.disabled }}</strong>
          <small>状态为停用的账号</small>
        </div>
      </el-col>
    </el-row>

    <div class="work-panel user-management-panel">
      <el-row :gutter="12" class="search-row user-search-row">
        <el-col :xs="24" :sm="12" :md="8" :lg="6">
          <el-input
            v-model.trim="queryForm.nickNameFuzzy"
            :prefix-icon="Search"
            placeholder="请输入用户昵称"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :md="6" :lg="4">
          <el-select v-model="queryForm.admin" placeholder="管理员状态" clearable>
            <el-option label="管理员" :value="1" />
            <el-option label="普通用户" :value="0" />
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6" :lg="4">
          <el-select v-model="queryForm.status" placeholder="用户状态" clearable>
            <el-option label="启用" :value="1" />
            <el-option label="停用" :value="0" />
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="12" :md="10" :lg="7" class="user-search-actions">
          <div class="user-search-button-group">
            <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
            <el-button type="success" plain :icon="View" @click="handleViewOnlineUsers">
              查看在线用户
            </el-button>
            <el-button :icon="RefreshLeft" @click="handleReset">重置</el-button>
          </div>
        </el-col>
      </el-row>

      <div class="user-table-scroll">
        <el-table
          v-loading="tableLoading"
          :data="userList"
          class="basic-table user-table"
          height="100%"
          border
          stripe
          empty-text="暂无用户数据"
        >
          <el-table-column label="用户头像" width="100" align="center">
            <template #default="{ row }">
              <el-popover
                placement="right"
                trigger="hover"
                :width="156"
                popper-class="user-avatar-preview-popper"
              >
                <template #reference>
                  <el-avatar :size="40" :src="row.avatarUrl" class="user-table-avatar">
                    {{ getAvatarText(row) }}
                  </el-avatar>
                </template>
                <el-avatar :size="128" :src="row.avatarUrl" class="user-avatar-preview">
                  {{ getAvatarText(row) }}
                </el-avatar>
              </el-popover>
            </template>
          </el-table-column>
          <el-table-column prop="account" label="用户账号" min-width="150" show-overflow-tooltip />
          <el-table-column prop="nickName" label="用户昵称" min-width="150" show-overflow-tooltip />
          <el-table-column prop="admin" label="管理员状态" width="120" align="center">
            <template #default="{ row }">
              <el-tag :type="row.admin === 1 ? 'success' : 'info'">
                {{ formatAdmin(row.admin) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="joinTime" label="注册时间" min-width="180" />
          <el-table-column prop="lastLoginTime" label="最后登录时间" min-width="180">
            <template #default="{ row }">
              {{ row.lastLoginTime || '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="status" label="用户状态" width="120" align="center">
            <template #default="{ row }">
              <el-switch
                v-model="row.status"
                :active-value="1"
                :inactive-value="0"
                active-color="#16a34a"
                inactive-color="#dc2626"
                :loading="row.statusUpdating"
                :before-change="() => handleBeforeStatusChange(row)"
              />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="220" fixed="right" align="center">
            <template #default="{ row }">
              <div class="user-table-actions">
                <el-button type="primary" plain :icon="Key" @click="handleAssignPermission(row)">
                  分配权限
                </el-button>
                <el-button
                  type="danger"
                  plain
                  :icon="SwitchButton"
                  :loading="row.logoutLoading"
                  @click="handleForceLogout(row)"
                >
                  强制下线
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div
        class="user-pagination"
        @click.capture="stopPaginationMoreEvent"
        @keyup.enter.capture="stopPaginationMoreEvent"
      >
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

    <UserRolePermissionDrawer
      v-model="permissionDrawerVisible"
      :user="permissionUser"
    />
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Key, RefreshLeft, Search, SwitchButton, View } from '@element-plus/icons-vue'
import UserRolePermissionDrawer from '@/components/user-management/UserRolePermissionDrawer.vue'
import Request from '@/utils/Request'

const queryForm = reactive({
  nickNameFuzzy: '',
  admin: '',
  status: '',
})

const pagination = reactive({
  pageNo: 1,
  pageSize: 15,
  totalCount: 0,
})

const statistics = reactive({
  total: '--',
  online: '--',
  enabled: '--',
  disabled: '--',
})

const tableLoading = ref(false)
const userList = ref([])
const permissionDrawerVisible = ref(false)
const permissionUser = ref(null)
const onlineUserMode = ref(false)
const userListUrl = '/admin/loadUserList'
const onlineUserListUrl = '/admin/loadOnlineUserList'

const buildListParams = () => {
  const params = {
    pageNo: pagination.pageNo,
    pageSize: pagination.pageSize,
  }

  if (queryForm.nickNameFuzzy) {
    params.nickNameFuzzy = queryForm.nickNameFuzzy
  }

  if (hasSelectValue(queryForm.admin)) {
    params.admin = queryForm.admin
  }

  if (hasSelectValue(queryForm.status)) {
    params.status = queryForm.status
  }

  return params
}

const hasSelectValue = (value) => value !== '' && value !== null && value !== undefined

const buildAvatarUrl = (userId) => {
  if (!userId) {
    return ''
  }

  return `/api/account/getAvatar/${encodeURIComponent(userId)}?t=${Date.now()}`
}

const normalizeUserRow = (row) => ({
  ...row,
  avatarUrl: buildAvatarUrl(row.userId),
  status: Number(row.status),
  admin: Number(row.admin),
  statusUpdating: false,
  logoutLoading: false,
})

const getAvatarText = (row) => {
  const text = row.nickName || row.account || row.userId || 'U'
  return text.slice(0, 1).toUpperCase()
}

const getTotalCount = (response) => {
  const count = response?.data?.totalCount
  return Number.isFinite(Number(count)) ? Number(count) : 0
}

const applyPageData = (pageData = {}) => {
  userList.value = Array.isArray(pageData.list) ? pageData.list.map(normalizeUserRow) : []
  pagination.totalCount = Number(pageData.totalCount || 0)
}

const loadListByUrl = async (url) => {
  tableLoading.value = true
  const response = await Request({
    url,
    params: buildListParams(),
    showLoading: false,
  }).finally(() => {
    tableLoading.value = false
  })

  const pageData = response?.data || {}
  applyPageData(pageData)
  return pageData
}

const loadUserList = () => {
  return loadListByUrl(userListUrl)
}

const loadOnlineUserList = async () => {
  const pageData = await loadListByUrl(onlineUserListUrl)
  statistics.online = Number(pageData.totalCount || 0)
  return pageData
}

const loadCurrentUserList = () => {
  return onlineUserMode.value ? loadOnlineUserList() : loadUserList()
}

const loadStatistics = async () => {
  const [totalResponse, onlineResponse, enabledResponse, disabledResponse] = await Promise.all([
    Request({
      url: userListUrl,
      params: { pageNo: 1, pageSize: 1 },
      showLoading: false,
      showError: false,
    }),
    Request({
      url: onlineUserListUrl,
      params: { pageNo: 1, pageSize: 1 },
      showLoading: false,
      showError: false,
    }),
    Request({
      url: userListUrl,
      params: { pageNo: 1, pageSize: 1, status: 1 },
      showLoading: false,
      showError: false,
    }),
    Request({
      url: userListUrl,
      params: { pageNo: 1, pageSize: 1, status: 0 },
      showLoading: false,
      showError: false,
    }),
  ])

  statistics.total = getTotalCount(totalResponse)
  statistics.online = getTotalCount(onlineResponse)
  statistics.enabled = getTotalCount(enabledResponse)
  statistics.disabled = getTotalCount(disabledResponse)
}

const loadStatusStatistics = async () => {
  const [enabledResponse, disabledResponse] = await Promise.all([
    Request({
      url: userListUrl,
      params: { pageNo: 1, pageSize: 1, status: 1 },
      showLoading: false,
      showError: false,
    }),
    Request({
      url: userListUrl,
      params: { pageNo: 1, pageSize: 1, status: 0 },
      showLoading: false,
      showError: false,
    }),
  ])

  statistics.enabled = getTotalCount(enabledResponse)
  statistics.disabled = getTotalCount(disabledResponse)
}

const loadOnlineUserStatistics = async () => {
  const response = await Request({
    url: onlineUserListUrl,
    params: { pageNo: 1, pageSize: 1 },
    showLoading: false,
    showError: false,
  })

  statistics.online = getTotalCount(response)
}

const loadPageData = async () => {
  await Promise.all([loadUserList(), loadStatistics()])
}

const formatAdmin = (admin) => {
  return admin === 1 ? '管理员' : '普通用户'
}

const handleSearch = () => {
  onlineUserMode.value = false
  pagination.pageNo = 1
  loadUserList()
}

const handleReset = () => {
  queryForm.nickNameFuzzy = ''
  queryForm.admin = ''
  queryForm.status = ''
  onlineUserMode.value = false
  pagination.pageNo = 1
  loadUserList()
}

const handleViewOnlineUsers = () => {
  queryForm.nickNameFuzzy = ''
  queryForm.admin = ''
  queryForm.status = ''
  onlineUserMode.value = true
  pagination.pageNo = 1
  loadOnlineUserList()
}

const handlePageSizeChange = (pageSize) => {
  pagination.pageSize = pageSize
  pagination.pageNo = 1
  loadCurrentUserList()
}

const handlePageNoChange = (pageNo) => {
  pagination.pageNo = pageNo
  loadCurrentUserList()
}

const isPaginationMoreTarget = (target) => {
  return Boolean(target?.closest?.('.btn-quickprev, .btn-quicknext'))
}

const stopPaginationMoreEvent = (event) => {
  if (!isPaginationMoreTarget(event.target)) {
    return
  }

  event.preventDefault()
  event.stopPropagation()
}

const handleBeforeStatusChange = async (row) => {
  if (!row.userId) {
    ElMessage.error('缺少用户ID，无法修改状态')
    return false
  }

  const nextStatus = row.status === 1 ? 0 : 1
  row.statusUpdating = true
  const response = await Request({
    url: '/admin/updateUserStatus',
    params: {
      userId: row.userId,
      status: nextStatus,
    },
    showLoading: false,
  }).finally(() => {
    row.statusUpdating = false
  })

  if (!response) {
    return false
  }

  ElMessage.success(nextStatus === 1 ? '账号已启用' : '账号已停用')
  loadStatusStatistics()
  return true
}

const handleForceLogout = async (row) => {
  if (!row.userId) {
    ElMessage.error('缺少用户ID，无法强制下线')
    return
  }

  const userName = row.nickName || row.account || row.userId
  const confirmed = await ElMessageBox.confirm(
    `确认强制下线用户「${userName}」吗？`,
    '强制下线',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    },
  ).catch(() => false)

  if (!confirmed) {
    return
  }

  row.logoutLoading = true
  const response = await Request({
    url: `/admin/forceLogout/${encodeURIComponent(row.userId)}`,
    showLoading: false,
  }).finally(() => {
    row.logoutLoading = false
  })

  if (response) {
    ElMessage.success('已强制下线')
    if (onlineUserMode.value) {
      loadOnlineUserList()
    } else {
      loadOnlineUserStatistics()
    }
  }
}

const handleAssignPermission = (user) => {
  permissionUser.value = { ...user }
  permissionDrawerVisible.value = true
}

onMounted(() => {
  loadPageData()
})
</script>

<style scoped lang="scss"></style>
