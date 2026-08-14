<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="1080px"
    class="skill-version-dialog"
    modal-class="skill-version-dialog-overlay"
    align-center
    append-to-body
    destroy-on-close
    @closed="handleClosed"
  >
    <div class="skill-version-content">
      <div class="skill-version-toolbar">
        <el-button type="primary" :icon="Upload" @click="releaseDialogVisible = true">
          发布新版本
        </el-button>
      </div>

      <div class="skill-version-table-scroll">
        <el-table
          v-loading="tableLoading"
          :data="versionList"
          class="basic-table skill-version-table"
          height="100%"
          border
          stripe
          empty-text="暂无Skill版本数据"
        >
          <el-table-column prop="versionName" label="版本号" min-width="140" fixed="left">
            <template #default="{ row }">{{ formatCell(row.versionName) }}</template>
          </el-table-column>
          <el-table-column prop="remark" label="备注" min-width="240" show-overflow-tooltip>
            <template #default="{ row }">{{ formatCell(row.remark) }}</template>
          </el-table-column>
          <el-table-column prop="versionStatus" label="状态" width="110" align="center">
            <template #default="{ row }">
              <el-tag :type="getStatusTagType(row.versionStatus)">
                {{ getStatusLabel(row.versionStatus) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="创建人" min-width="140" align="center">
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
          <el-table-column prop="createTime" label="创建时间" width="180">
            <template #default="{ row }">{{ formatCell(row.createTime) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right" align="center">
            <template #default="{ row }">
              <div class="skill-version-actions">
                <el-button
                  type="primary"
                  plain
                  :icon="Switch"
                  :disabled="Number(row.versionStatus) !== VERSION_STATUS.DISABLED"
                  :loading="switchingVersionId === row.versionId"
                  @click="handleSwitchVersion(row)"
                >
                  切换至当前版本
                </el-button>
                <el-button
                  type="success"
                  plain
                  :icon="Download"
                  :loading="downloadingVersionId === row.versionId"
                  :disabled="Boolean(downloadingVersionId) && downloadingVersionId !== row.versionId"
                  @click="handleDownloadVersion(row)"
                >
                  下载当前版本
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="skill-version-pagination">
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

    <template #footer>
      <el-button @click="visible = false">退出</el-button>
    </template>

    <ReleaseSkillVersionDialog
      v-model="releaseDialogVisible"
      :skill="skill"
      @saved="handleVersionReleased"
    />
  </el-dialog>
</template>

<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, Switch, Upload } from '@element-plus/icons-vue'
import ReleaseSkillVersionDialog from '@/components/skill-management/ReleaseSkillVersionDialog.vue'
import Request from '@/utils/Request'
import { downloadSkillFile } from '@/utils/SkillDownload'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  skill: { type: Object, default: null },
})
const emit = defineEmits(['update:modelValue', 'switched', 'released'])
const VERSION_STATUS = { ACTIVE: 0, DISABLED: 1, CREATING: 2, CREATE_FAILED: 3 }
const statusOptions = [
  { label: '可用', value: VERSION_STATUS.ACTIVE, type: 'success' },
  { label: '禁用', value: VERSION_STATUS.DISABLED, type: 'info' },
  { label: '创建中', value: VERSION_STATUS.CREATING, type: 'warning' },
  { label: '创建失败', value: VERSION_STATUS.CREATE_FAILED, type: 'danger' },
]
const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})
const dialogTitle = computed(() => {
  const name = String(props.skill?.name || '').trim()
  return name ? `版本管理 - ${name}` : '版本管理'
})
const pagination = reactive({ pageNo: 1, pageSize: 15, totalCount: 0 })
const tableLoading = ref(false)
const versionList = ref([])
const switchingVersionId = ref('')
const downloadingVersionId = ref('')
const releaseDialogVisible = ref(false)
let requestId = 0
let destroyed = false

const formatCell = (value) => value === null || value === undefined || value === '' ? '-' : value
const getStatusOption = (status) => statusOptions.find((item) => item.value === Number(status))
const getStatusLabel = (status) => getStatusOption(status)?.label || '-'
const getStatusTagType = (status) => getStatusOption(status)?.type || 'info'
const buildAvatarUrl = (userId) => userId ? `/api/account/getAvatar/${encodeURIComponent(userId)}` : ''
const getAvatarText = (user) => String(user?.nickName || user?.account || 'U').slice(0, 1).toUpperCase()

const loadVersionList = async () => {
  const skillId = props.skill?.skillId
  if (!skillId) {
    versionList.value = []
    pagination.totalCount = 0
    return
  }

  const currentRequestId = ++requestId
  tableLoading.value = true
  const response = await Request({
    url: `/skill/loadSkillVersionList/${encodeURIComponent(skillId)}`,
    params: { pageNo: pagination.pageNo, pageSize: pagination.pageSize },
    showLoading: false,
  })

  if (!destroyed && currentRequestId === requestId) {
    const pageData = response?.data || {}
    versionList.value = Array.isArray(pageData.list) ? pageData.list : []
    pagination.totalCount = Number(pageData.totalCount || 0)
    tableLoading.value = false
  }
}

const handlePageSizeChange = (pageSize) => {
  pagination.pageSize = pageSize
  pagination.pageNo = 1
  loadVersionList()
}
const handlePageNoChange = (pageNo) => {
  pagination.pageNo = pageNo
  loadVersionList()
}

const handleSwitchVersion = async (row) => {
  if (Number(row.versionStatus) !== VERSION_STATUS.DISABLED || !row.versionId || !props.skill?.skillId) return

  switchingVersionId.value = row.versionId
  const response = await Request({
    url: `/skill/switchSkillVersion/${encodeURIComponent(props.skill.skillId)}/${encodeURIComponent(row.versionId)}`,
    method: 'get',
    showLoading: false,
  }).finally(() => {
    switchingVersionId.value = ''
  })

  if (!response) return
  ElMessage.success('Skill版本切换成功')
  await loadVersionList()
  emit('switched')
}

const handleVersionReleased = () => {
  pagination.pageNo = 1
  loadVersionList()
  emit('released')
}

const handleDownloadVersion = async (row) => {
  if (!row?.versionId || downloadingVersionId.value) return

  downloadingVersionId.value = row.versionId
  try {
    await downloadSkillFile(row.versionId, { request: Request })
  } catch (error) {
    ElMessage.error(error?.message || 'Skill版本下载失败，请重试')
  } finally {
    downloadingVersionId.value = ''
  }
}

const handleClosed = () => {
  requestId += 1
  tableLoading.value = false
  switchingVersionId.value = ''
  downloadingVersionId.value = ''
  releaseDialogVisible.value = false
  versionList.value = []
  pagination.pageNo = 1
  pagination.pageSize = 15
  pagination.totalCount = 0
}

watch(visible, (isVisible) => {
  if (!isVisible) return
  pagination.pageNo = 1
  loadVersionList()
})

onBeforeUnmount(() => {
  destroyed = true
  requestId += 1
})
</script>

<style scoped lang="scss">
@use '@/assets/styles/skill.version.dialog.scss';
</style>
