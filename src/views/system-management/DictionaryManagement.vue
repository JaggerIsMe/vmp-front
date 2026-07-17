<template>
  <section class="page-shell dictionary-management-page">
    <el-row :gutter="16" class="dictionary-layout">
      <el-col :xs="24" :md="7" :lg="6" class="dictionary-father-column">
        <div class="work-panel dictionary-father-panel">
          <div class="dictionary-panel-header dictionary-father-header">
            <div>
              <h3>一级字典</h3>
              <p>选择后查看对应的二级数据</p>
            </div>
            <el-button type="primary" :icon="Plus" @click="handleAddFather">
              新增一级数据
            </el-button>
          </div>

          <div v-loading="fatherLoading" class="dictionary-father-list">
            <div
              v-for="item in fatherList"
              :key="item.dictId"
              class="dictionary-father-item"
              :class="{ 'is-active': String(item.dictId) === selectedFatherId }"
            >
              <button
                type="button"
                class="dictionary-father-select"
                :aria-pressed="String(item.dictId) === selectedFatherId"
                @click="handleSelectFather(item)"
              >
                <span class="dictionary-father-name" :title="item.dictName">
                  {{ item.dictName }}
                </span>
              </button>
              <el-button
                class="dictionary-father-edit"
                text
                :icon="Edit"
                @click="handleEditFather(item)"
              >
                修改
              </el-button>
            </div>

            <el-empty
              v-if="!fatherLoading && fatherList.length === 0"
              description="暂无一级字典"
              :image-size="88"
            />
          </div>
        </div>
      </el-col>

      <el-col :xs="24" :md="17" :lg="18" class="dictionary-child-column">
        <div class="work-panel dictionary-child-panel">
          <div class="dictionary-panel-header dictionary-child-header">
            <h3>{{ selectedFather?.dictName || '二级字典' }}</h3>
          </div>

          <el-row :gutter="12" class="search-row dictionary-search-row">
            <el-col :xs="24" :sm="12" :lg="5">
              <el-input
                v-model.trim="queryForm.dictCodeFuzzy"
                :prefix-icon="Search"
                placeholder="请输入字典代码"
                clearable
                @keyup.enter="handleSearch"
              />
            </el-col>
            <el-col :xs="24" :sm="12" :lg="5">
              <el-input
                v-model.trim="queryForm.dictNameFuzzy"
                :prefix-icon="Search"
                placeholder="请输入字典名称"
                clearable
                @keyup.enter="handleSearch"
              />
            </el-col>
            <el-col :xs="24" :sm="8" :lg="4">
              <el-select v-model="queryForm.status" placeholder="状态" clearable>
                <el-option label="启用" :value="1" />
                <el-option label="禁用" :value="0" />
              </el-select>
            </el-col>
            <el-col :xs="24" :sm="16" :lg="10" class="dictionary-search-actions">
              <div class="dictionary-search-button-group">
                <el-button type="primary" :icon="Search" @click="handleSearch">
                  查询
                </el-button>
                <el-button :icon="RefreshLeft" @click="handleReset">重置</el-button>
                <el-button
                  type="success"
                  :icon="Plus"
                  :disabled="!selectedFather"
                  @click="handleAddChild"
                >
                  新增二级数据
                </el-button>
              </div>
            </el-col>
          </el-row>

          <div class="dictionary-table-scroll">
            <el-table
              v-loading="childLoading"
              :data="childList"
              class="basic-table dictionary-child-table"
              height="100%"
              border
              stripe
              :empty-text="childEmptyText"
            >
              <el-table-column
                prop="dictName"
                label="字典名称"
                min-width="180"
                show-overflow-tooltip
              />
              <el-table-column
                prop="dictCode"
                label="字典代码"
                min-width="160"
                show-overflow-tooltip
              />
              <el-table-column prop="status" label="状态" width="110" align="center">
                <template #default="{ row }">
                  <el-tag :type="row.status === 1 ? 'success' : 'danger'">
                    {{ row.status === 1 ? '启用' : '禁用' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="remark" label="备注" min-width="200" show-overflow-tooltip>
                <template #default="{ row }">{{ row.remark || '-' }}</template>
              </el-table-column>
              <el-table-column label="操作" width="110" fixed="right" align="center">
                <template #default="{ row }">
                  <el-button type="primary" plain :icon="Edit" @click="handleEditChild(row)">
                    修改
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <div class="dictionary-pagination">
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
      </el-col>
    </el-row>

    <DictDataDialog
      v-model="dialogVisible"
      :mode="dialogMode"
      :level="dialogLevel"
      :pid="dialogPid"
      :dict-data="editingDict"
      @saved="handleDictSaved"
    />
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { Edit, Plus, RefreshLeft, Search } from '@element-plus/icons-vue'
import DictDataDialog from '@/components/dictionary-management/DictDataDialog.vue'
import Request from '@/utils/Request'

const queryForm = reactive({ dictCodeFuzzy: '', dictNameFuzzy: '', status: '' })
const pagination = reactive({ pageNo: 1, pageSize: 15, totalCount: 0 })
const fatherList = ref([])
const selectedFatherId = ref('')
const childList = ref([])
const fatherLoading = ref(false)
const childLoading = ref(false)
let fatherRequestId = 0
let childRequestId = 0

const dialogVisible = ref(false)
const dialogMode = ref('create')
const dialogLevel = ref('father')
const dialogPid = ref('VMP')
const editingDict = ref(null)

const selectedFather = computed(() => {
  return fatherList.value.find((item) => String(item.dictId) === selectedFatherId.value) || null
})
const childEmptyText = computed(() => {
  return selectedFather.value ? '暂无二级字典数据' : '请先选择一级字典'
})

const hasSelectValue = (value) => value !== '' && value !== null && value !== undefined

const resetChildQuery = () => {
  queryForm.dictCodeFuzzy = ''
  queryForm.dictNameFuzzy = ''
  queryForm.status = ''
  pagination.pageNo = 1
}

const clearChildState = () => {
  childList.value = []
  pagination.totalCount = 0
}

const buildChildParams = () => {
  const params = {
    pageNo: pagination.pageNo,
    pageSize: pagination.pageSize,
  }
  const dictCodeFuzzy = String(queryForm.dictCodeFuzzy || '').trim()
  const dictNameFuzzy = String(queryForm.dictNameFuzzy || '').trim()

  if (dictCodeFuzzy) {
    params.dictCodeFuzzy = dictCodeFuzzy
  }
  if (dictNameFuzzy) {
    params.dictNameFuzzy = dictNameFuzzy
  }
  if (hasSelectValue(queryForm.status)) {
    params.status = queryForm.status
  }

  return params
}

const loadChildList = async () => {
  const fatherId = selectedFatherId.value
  if (!fatherId) {
    childRequestId += 1
    clearChildState()
    childLoading.value = false
    return
  }

  const requestId = ++childRequestId
  childLoading.value = true
  const response = await Request({
    url: `/admin/loadChildDictDataListByPid/${encodeURIComponent(fatherId)}`,
    method: 'post',
    params: buildChildParams(),
    showLoading: false,
  }).finally(() => {
    if (requestId === childRequestId) {
      childLoading.value = false
    }
  })

  if (
    !response ||
    requestId !== childRequestId ||
    fatherId !== selectedFatherId.value
  ) {
    return
  }

  const pageData = response.data || {}
  childList.value = Array.isArray(pageData.list)
    ? pageData.list.map((item) => ({ ...item, status: Number(item.status) }))
    : []
  pagination.totalCount = Number(pageData.totalCount || 0)
}

const applyFatherSelection = (father, { force = false } = {}) => {
  const nextFatherId = String(father?.dictId ?? '')
  if (!nextFatherId) {
    return
  }

  const fatherChanged = nextFatherId !== selectedFatherId.value
  if (!fatherChanged && !force) {
    return
  }

  if (fatherChanged) {
    childRequestId += 1
    selectedFatherId.value = nextFatherId
    clearChildState()
    resetChildQuery()
  }

  loadChildList()
}

const loadFatherList = async ({ preferredId = '', preferredCode = '' } = {}) => {
  const requestId = ++fatherRequestId
  fatherLoading.value = true
  const response = await Request({
    url: '/admin/loadAllFatherDictDataList',
    method: 'get',
    showLoading: false,
  }).finally(() => {
    if (requestId === fatherRequestId) {
      fatherLoading.value = false
    }
  })

  if (!response || requestId !== fatherRequestId) {
    return
  }

  const nextFatherList = Array.isArray(response.data)
    ? response.data.map((item) => ({ ...item, status: Number(item.status) }))
    : []
  fatherList.value = nextFatherList

  if (nextFatherList.length === 0) {
    childRequestId += 1
    selectedFatherId.value = ''
    clearChildState()
    resetChildQuery()
    childLoading.value = false
    return
  }

  const targetFather =
    (hasSelectValue(preferredId)
      ? nextFatherList.find((item) => String(item.dictId) === String(preferredId))
      : null) ||
    (hasSelectValue(preferredCode)
      ? nextFatherList.find((item) => String(item.dictCode) === String(preferredCode))
      : null) ||
    nextFatherList.find((item) => String(item.dictId) === selectedFatherId.value) ||
    nextFatherList[0]

  applyFatherSelection(targetFather, { force: true })
}

const handleSelectFather = (father) => {
  applyFatherSelection(father)
}

const handleSearch = () => {
  pagination.pageNo = 1
  loadChildList()
}

const handleReset = () => {
  resetChildQuery()
  loadChildList()
}

const handlePageSizeChange = (pageSize) => {
  pagination.pageSize = pageSize
  pagination.pageNo = 1
  loadChildList()
}

const handlePageNoChange = (pageNo) => {
  pagination.pageNo = pageNo
  loadChildList()
}

const openDialog = ({ mode, level, pid, dictData = null }) => {
  dialogMode.value = mode
  dialogLevel.value = level
  dialogPid.value = pid
  editingDict.value = dictData
  dialogVisible.value = true
}

const handleAddFather = () => {
  openDialog({ mode: 'create', level: 'father', pid: 'VMP' })
}

const handleEditFather = (father) => {
  openDialog({ mode: 'edit', level: 'father', pid: 'VMP', dictData: { ...father } })
}

const handleAddChild = () => {
  if (!selectedFatherId.value) {
    return
  }
  openDialog({ mode: 'create', level: 'child', pid: selectedFatherId.value })
}

const handleEditChild = (child) => {
  openDialog({
    mode: 'edit',
    level: 'child',
    pid: selectedFatherId.value,
    dictData: { ...child },
  })
}

const handleDictSaved = (payload) => {
  if (payload.level === 'father') {
    if (payload.mode === 'create') {
      loadFatherList({ preferredCode: payload.dictCode })
      return
    }
    loadFatherList({ preferredId: selectedFatherId.value })
    return
  }

  loadChildList()
}

onMounted(() => {
  loadFatherList()
})
</script>

<style scoped lang="scss"></style>
