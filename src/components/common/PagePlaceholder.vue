<template>
  <section class="page-shell">
    <div class="page-toolbar">
      <div>
        <p class="page-kicker">{{ moduleName }}</p>
        <h2>{{ title }}</h2>
      </div>
      <el-button type="primary" :icon="Refresh">刷新数据</el-button>
    </div>

    <el-row :gutter="16" class="metric-row">
      <el-col v-for="item in metrics" :key="item.label" :xs="24" :sm="12" :lg="6">
        <div class="metric-card">
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
          <small>{{ item.trend }}</small>
        </div>
      </el-col>
    </el-row>

    <div class="work-panel">
      <el-row :gutter="16" class="search-row">
        <el-col :xs="24" :sm="10" :md="8">
          <el-input
            v-model="keyword"
            :prefix-icon="Search"
            :placeholder="searchPlaceholder"
            clearable
            @keyup.enter="handleSearch"
          />
        </el-col>
        <el-col :xs="24" :sm="8" :md="6">
          <el-select v-model="status" placeholder="状态" clearable>
            <el-option label="全部" value="all" />
            <el-option label="进行中" value="active" />
            <el-option label="待处理" value="pending" />
          </el-select>
        </el-col>
        <el-col :xs="24" :sm="6" :md="4">
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
        </el-col>
      </el-row>

      <el-table :data="tableData" class="basic-table" border>
        <el-table-column prop="name" label="名称" min-width="180" />
        <el-table-column prop="owner" label="负责人" width="120" />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.status === '进行中' ? 'success' : 'warning'">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="updatedAt" label="更新时间" width="180" />
      </el-table>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Search } from '@element-plus/icons-vue'

defineProps({
  moduleName: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  searchPlaceholder: {
    type: String,
    default: '请输入关键词',
  },
  metrics: {
    type: Array,
    default: () => [
      { label: '今日新增', value: '--', trend: '待接入接口' },
      { label: '本周累计', value: '--', trend: '待接入接口' },
      { label: '转化表现', value: '--', trend: '待接入接口' },
      { label: '异常提醒', value: '--', trend: '待接入接口' },
    ],
  },
})

const keyword = ref('')
const status = ref('')
const tableData = ref([
  {
    name: '基础数据看板',
    owner: '运营组',
    status: '进行中',
    updatedAt: '2026-07-06 02:40',
  },
  {
    name: '接口与表格字段规划',
    owner: '产品组',
    status: '待处理',
    updatedAt: '2026-07-06 02:40',
  },
])

const handleSearch = () => {
  ElMessage.success('搜索条件已提交')
}
</script>

<style scoped lang="scss"></style>
