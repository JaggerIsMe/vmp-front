<template>
  <section class="page-shell skill-management-page">
    <div class="work-panel skill-management-panel">
      <el-row :gutter="12" class="search-row skill-search-row">
        <el-col :xs="24" :sm="12" :md="8" :lg="4">
          <el-input
            v-model.trim="queryForm.nameFuzzy"
            :prefix-icon="Search"
            placeholder="请输入Skill名称"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-col>
        <el-col :xs="24" :sm="12" :md="8" :lg="3">
          <el-select v-model="queryForm.platform" placeholder="请选择平台" clearable filterable>
            <el-option
              v-for="item in platformOptions"
              :key="item.dictId"
              :label="item.dictName"
              :value="getDictionaryOptionValue(item)"
            />
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="12" :md="8" :lg="3">
          <el-select v-model="queryForm.dept" placeholder="请选择部门" clearable filterable>
            <el-option
              v-for="item in departmentOptions"
              :key="item.dictId"
              :label="item.dictName"
              :value="getDictionaryOptionValue(item)"
            />
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="12" :md="8" :lg="3">
          <el-select v-model="queryForm.status" placeholder="请选择状态" clearable>
            <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="24" :md="24" :lg="11" class="skill-search-actions">
          <div class="skill-search-button-group">
            <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
            <el-button :icon="RefreshLeft" @click="handleReset">重置</el-button>
            <el-button type="success" :icon="Upload" @click="releaseDialogVisible = true">
              发布Skill
            </el-button>
            <el-button
              type="warning"
              plain
              :icon="Download"
              :loading="templateDownloading"
              @click="handleDownloadTemplate"
            >
              下载Skill模板
            </el-button>
          </div>
        </el-col>
      </el-row>

      <div class="skill-table-scroll">
        <el-table
          v-loading="tableLoading"
          :data="skillList"
          class="basic-table skill-table"
          height="100%"
          border
          stripe
          empty-text="暂无Skill数据"
        >
          <el-table-column prop="name" label="Skill名称" min-width="170" fixed="left" show-overflow-tooltip />
          <el-table-column prop="activeVersionName" label="使用版本号" width="130">
            <template #default="{ row }">{{ formatCell(row.activeVersionName) }}</template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="110" align="center">
            <template #default="{ row }">
              <el-tag :type="getStatusTagType(row.status)">{{ getStatusLabel(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="描述" min-width="240" show-overflow-tooltip>
            <template #default="{ row }">{{ formatCell(row.description) }}</template>
          </el-table-column>
          <el-table-column prop="remark" label="备注" min-width="200" show-overflow-tooltip>
            <template #default="{ row }">{{ formatCell(row.remark) }}</template>
          </el-table-column>
          <el-table-column prop="platform" label="平台" min-width="130">
            <template #default="{ row }">{{ findDictionaryName(platformOptions, row.platform) }}</template>
          </el-table-column>
          <el-table-column prop="dept" label="部门" min-width="130">
            <template #default="{ row }">{{ findDictionaryName(departmentOptions, row.dept) }}</template>
          </el-table-column>
          <el-table-column label="创建人昵称" min-width="140">
            <template #default="{ row }">
              <el-popover
                v-if="row.createBy"
                placement="top"
                trigger="hover"
                :width="300"
                popper-class="operator-detail-popper"
              >
                <template #reference>
                  <span class="operator-name">{{ row.createBy.nickName || '-' }}</span>
                </template>
                <div class="operator-detail">
                  <el-avatar :size="52" :src="buildAvatarUrl(row.createBy.userId)">
                    {{ getAvatarText(row.createBy) }}
                  </el-avatar>
                  <div class="operator-detail__content">
                    <strong>{{ row.createBy.nickName || '-' }}</strong>
                    <span>身份：{{ Number(row.createBy.admin) === 1 ? '管理员' : '普通用户' }}</span>
                    <span>状态：{{ Number(row.createBy.status) === 1 ? '启用' : '停用' }}</span>
                    <span>最后登录：{{ row.createBy.lastLoginTime || '-' }}</span>
                  </div>
                </div>
              </el-popover>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column prop="updateTime" label="修改时间" width="180">
            <template #default="{ row }">{{ formatCell(row.updateTime) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="140" fixed="right" align="center">
            <template #default="{ row }">
              <div class="skill-table-actions">
                <el-button type="primary" plain :icon="Edit" @click="handleEdit(row)">修改信息</el-button>
                <el-button type="success" plain :icon="Files" @click="handleVersionManagement(row)">
                  版本管理
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="skill-pagination">
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

    <SkillInfoDialog
      v-model="dialogVisible"
      :skill="editingSkill"
      :platform-options="platformOptions"
      :department-options="departmentOptions"
      :status-options="statusOptions"
      @saved="handleSaved"
    />

    <ReleaseSkillDialog
      v-model="releaseDialogVisible"
      :platform-options="platformOptions"
      :department-options="departmentOptions"
      @saved="handleReleaseSaved"
    />

    <SkillVersionDialog
      v-model="versionDialogVisible"
      :skill="versionSkill"
      @switched="handleVersionSwitched"
      @released="handleVersionReleased"
    />
  </section>
</template>

<script setup>
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, Edit, Files, RefreshLeft, Search, Upload } from '@element-plus/icons-vue'
import ReleaseSkillDialog from '@/components/skill-management/ReleaseSkillDialog.vue'
import SkillInfoDialog from '@/components/skill-management/SkillInfoDialog.vue'
import SkillVersionDialog from '@/components/skill-management/SkillVersionDialog.vue'
import Request from '@/utils/Request'
import { SKILL_TEMPLATE_VERSION_ID, downloadSkillFile } from '@/utils/SkillDownload'

const DICTIONARY_PARENT_IDS = { platform: '6Nn7xAHsn7hc48uZRWH7', department: 'MfXvzteDiS3oAcNH8Dio' }
const statusOptions = [
  { label: '可用', value: 0, type: 'success' },
  { label: '下架', value: 1, type: 'info' },
  { label: '创建中', value: 2, type: 'warning' },
  { label: '创建失败', value: 3, type: 'danger' },
]
const queryForm = reactive({ nameFuzzy: '', platform: '', dept: '', status: '' })
const pagination = reactive({ pageNo: 1, pageSize: 15, totalCount: 0 })
const tableLoading = ref(false)
const templateDownloading = ref(false)
const skillList = ref([])
const platformOptions = ref([])
const departmentOptions = ref([])
const dialogVisible = ref(false)
const releaseDialogVisible = ref(false)
const versionDialogVisible = ref(false)
const editingSkill = ref(null)
const versionSkill = ref(null)
let listRequestId = 0
let destroyed = false

const hasValue = (value) => value !== '' && value !== null && value !== undefined
const getDictionaryOptionValue = (item) => String(item?.dictCode ?? '')
const findDictionaryName = (options, value) => options.find((item) => String(item.dictCode) === String(value))?.dictName || formatCell(value)
const formatCell = (value) => value === null || value === undefined || value === '' ? '-' : value
const getStatusOption = (status) => statusOptions.find((item) => item.value === Number(status))
const getStatusLabel = (status) => getStatusOption(status)?.label || '-'
const getStatusTagType = (status) => getStatusOption(status)?.type || 'info'
const buildAvatarUrl = (userId) => {
  return userId ? `/api/account/getAvatar/${encodeURIComponent(userId)}` : ''
}
const getAvatarText = (user) => String(user?.nickName || user?.account || 'U').slice(0, 1).toUpperCase()

const buildListParams = () => {
  const params = { pageNo: pagination.pageNo, pageSize: pagination.pageSize }
  if (queryForm.nameFuzzy) params.nameFuzzy = queryForm.nameFuzzy
  if (queryForm.platform) params.platform = queryForm.platform
  if (queryForm.dept) params.dept = queryForm.dept
  if (hasValue(queryForm.status)) params.status = queryForm.status
  return params
}

const loadSkillList = async () => {
  const requestId = ++listRequestId
  tableLoading.value = true
  const response = await Request({ url: '/skill/loadSkillList', params: buildListParams(), showLoading: false })
  if (!destroyed && requestId === listRequestId) {
    const pageData = response?.data || {}
    skillList.value = Array.isArray(pageData.list) ? pageData.list : []
    pagination.totalCount = Number(pageData.totalCount || 0)
    tableLoading.value = false
  }
}

const loadDictionaryOptions = async (pid, target) => {
  const response = await Request({ url: `/account/getAllEnableChildDictDataByPid/${encodeURIComponent(pid)}`, showLoading: false })
  if (!destroyed && response) target.value = Array.isArray(response.data) ? response.data : []
}

const handleSearch = () => { pagination.pageNo = 1; loadSkillList() }
const handleReset = () => {
  Object.assign(queryForm, { nameFuzzy: '', platform: '', dept: '', status: '' })
  pagination.pageNo = 1
  loadSkillList()
}
const handlePageSizeChange = (pageSize) => { pagination.pageSize = pageSize; pagination.pageNo = 1; loadSkillList() }
const handlePageNoChange = (pageNo) => { pagination.pageNo = pageNo; loadSkillList() }
const handleEdit = (row) => { editingSkill.value = { ...row }; dialogVisible.value = true }
const handleVersionManagement = (row) => {
  versionSkill.value = { ...row }
  versionDialogVisible.value = true
}
const handleSaved = () => loadSkillList()
const handleReleaseSaved = () => {
  pagination.pageNo = 1
  loadSkillList()
}
const handleVersionSwitched = () => loadSkillList()
const handleVersionReleased = () => loadSkillList()
const handleDownloadTemplate = async () => {
  if (templateDownloading.value) return

  templateDownloading.value = true
  try {
    await downloadSkillFile(SKILL_TEMPLATE_VERSION_ID, { request: Request })
  } catch (error) {
    ElMessage.error(error?.message || 'Skill模板下载失败，请重试')
  } finally {
    templateDownloading.value = false
  }
}

onMounted(() => Promise.all([
  loadSkillList(),
  loadDictionaryOptions(DICTIONARY_PARENT_IDS.platform, platformOptions),
  loadDictionaryOptions(DICTIONARY_PARENT_IDS.department, departmentOptions),
]))
onBeforeUnmount(() => { destroyed = true; listRequestId += 1 })
</script>

<style scoped lang="scss">
@use '@/assets/styles/skill.management.scss';
</style>
