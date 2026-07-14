<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? '修改菜单页面' : '新增菜单页面'"
    width="520px"
    append-to-body
    destroy-on-close
    @closed="resetForm"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-position="top"
      @submit.prevent
    >
      <el-form-item label="父页面" prop="pid">
        <el-select v-model="formData.pid" placeholder="请选择父页面" filterable>
          <el-option
            v-for="item in parentOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="菜单页面标题" prop="title">
        <el-input
          v-model.trim="formData.title"
          maxlength="20"
          show-word-limit
          clearable
          :placeholder="titlePlaceholder"
          @keyup.enter="handleSubmit"
        />
      </el-form-item>

      <el-form-item label="菜单页面路径" prop="path">
        <el-input
          v-model.trim="formData.path"
          maxlength="100"
          clearable
          placeholder="例如：/role-management"
          @keyup.enter="handleSubmit"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button
        type="primary"
        :disabled="!canSubmit"
        :loading="submitting"
        @click="handleSubmit"
      >
        {{ isEdit ? '保存' : '新增' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import Request from '@/utils/Request'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  menu: {
    type: Object,
    default: null,
  },
  menus: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:modelValue', 'saved'])

const menuPathPattern = /^\/[a-z]+(?:-[a-z]+)*$/
const formRef = ref()
const submitting = ref(false)
const initialForm = ref(null)
const formData = reactive({
  pid: '',
  title: '',
  path: '',
})

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})
const isEdit = computed(() => Boolean(props.menu?.menuId))
const titlePlaceholder = computed(() => {
  return isEdit.value ? String(props.menu?.title || '请输入菜单页面标题') : '请输入菜单页面标题'
})
const effectiveTitle = computed(() => {
  return formData.title.trim() || (isEdit.value ? String(props.menu?.title || '').trim() : '')
})

const descendantIds = computed(() => {
  if (!isEdit.value) {
    return new Set()
  }

  const ids = new Set([props.menu.menuId])
  let changed = true
  while (changed) {
    changed = false
    props.menus.forEach((item) => {
      if (ids.has(item.pid) && !ids.has(item.menuId)) {
        ids.add(item.menuId)
        changed = true
      }
    })
  }
  return ids
})

const parentOptions = computed(() => {
  const options = [{ label: 'VMP（一级菜单目录）', value: 'VMP' }]
  props.menus.forEach((item) => {
    if (descendantIds.value.has(item.menuId)) {
      return
    }

    options.push({
      label: `${'　'.repeat(item.depth || 0)}${item.title}`,
      value: item.menuId,
    })
  })
  return options
})

const isComplete = computed(() => {
  return Boolean(formData.pid && effectiveTitle.value && formData.path.trim())
})
const hasChanged = computed(() => {
  if (!isEdit.value || !initialForm.value) {
    return true
  }

  return (
    formData.pid !== initialForm.value.pid ||
    effectiveTitle.value !== initialForm.value.title ||
    formData.path.trim() !== initialForm.value.path
  )
})
const canSubmit = computed(() => isComplete.value && hasChanged.value && !submitting.value)

const validateTitle = (rule, value, callback) => {
  if (!effectiveTitle.value) {
    callback(new Error('请输入菜单页面标题'))
    return
  }
  callback()
}

const validatePath = (rule, value, callback) => {
  const path = String(value || '').trim()
  if (!path) {
    callback(new Error('请输入菜单页面路径'))
    return
  }
  if (!menuPathPattern.test(path)) {
    callback(new Error('路径必须以 / 开头，且只能包含小写英文字母和连字符'))
    return
  }
  callback()
}

const formRules = {
  pid: [{ required: true, message: '请选择父页面', trigger: 'change' }],
  title: [{ validator: validateTitle, trigger: 'blur' }],
  path: [{ validator: validatePath, trigger: 'blur' }],
}

const fillForm = () => {
  const menu = props.menu || {}
  formData.pid = isEdit.value ? String(menu.pid || '') : ''
  formData.title = ''
  formData.path = isEdit.value ? String(menu.path || '') : ''
  initialForm.value = isEdit.value
    ? {
        pid: formData.pid,
        title: String(menu.title || '').trim(),
        path: formData.path.trim(),
      }
    : null
}

const resetForm = () => {
  formRef.value?.clearValidate()
  formData.pid = ''
  formData.title = ''
  formData.path = ''
  initialForm.value = null
  submitting.value = false
}

const handleSubmit = async () => {
  if (!canSubmit.value) {
    return
  }

  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) {
    return
  }

  submitting.value = true
  const url = isEdit.value
    ? `/admin/updateMenu/${encodeURIComponent(props.menu.menuId)}`
    : '/admin/newMenu'
  const response = await Request({
    url,
    params: {
      pid: formData.pid,
      title: effectiveTitle.value,
      path: formData.path.trim(),
    },
    showLoading: false,
  }).finally(() => {
    submitting.value = false
  })

  if (!response) {
    return
  }

  ElMessage.success(isEdit.value ? '菜单页面已保存' : '菜单页面新增成功')
  dialogVisible.value = false
  emit('saved')
}

watch(dialogVisible, async (visible) => {
  if (!visible) {
    return
  }

  fillForm()
  await nextTick()
  formRef.value?.clearValidate()
})
</script>

<style scoped lang="scss"></style>
