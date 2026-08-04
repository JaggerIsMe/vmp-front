<template>
  <el-dialog
    :model-value="modelValue"
    title="商品打标"
    width="520px"
    class="shopify-product-tag-dialog"
    :close-on-click-modal="!submitting"
    :close-on-press-escape="!submitting"
    :show-close="!submitting"
    destroy-on-close
    @update:model-value="handleVisibleChange"
  >
    <div class="shopify-product-tag-dialog__summary">
      已选择 <strong>{{ products.length }}</strong> 个父级商品
    </div>

    <el-form label-position="top" class="shopify-product-tag-form">
      <el-form-item label="品牌">
        <el-select
          v-model="formData.brand"
          placeholder="请选择新品牌"
          clearable
          filterable
          :disabled="submitting"
        >
          <el-option
            v-for="item in brandOptions"
            :key="item.dictId"
            :label="item.dictName"
            :value="getDictionaryOptionValue(item)"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="负责人">
        <el-select
          v-model="formData.personInCharge"
          placeholder="请选择新负责人"
          clearable
          filterable
          :disabled="submitting"
        >
          <el-option
            v-for="item in personOptions"
            :key="item.dictId"
            :label="item.dictName"
            :value="getDictionaryOptionValue(item)"
          />
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="shopify-product-tag-dialog__footer">
        <el-button :disabled="submitting" @click="handleCancel">取消</el-button>
        <el-button
          type="primary"
          :loading="submitting"
          :disabled="!canSubmit || submitting"
          @click="handleConfirm"
        >
          确认
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import Request from '@/utils/Request'
import { buildShopifyTagParams, getDictionaryOptionValue } from '@/utils/ShopifyListing'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  products: {
    type: Array,
    default: () => [],
  },
  brandOptions: {
    type: Array,
    default: () => [],
  },
  personOptions: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:modelValue', 'saved'])

const formData = reactive({
  brand: '',
  personInCharge: '',
})
const submitting = ref(false)
const canSubmit = computed(() => Boolean(formData.brand || formData.personInCharge))

const resetForm = () => {
  formData.brand = ''
  formData.personInCharge = ''
}

const handleVisibleChange = (visible) => {
  if (!submitting.value) {
    emit('update:modelValue', visible)
  }
}

const handleCancel = () => {
  if (!submitting.value) {
    emit('update:modelValue', false)
  }
}

const handleConfirm = async () => {
  if (!canSubmit.value || submitting.value || props.products.length === 0) {
    return
  }

  submitting.value = true
  const response = await Request({
    url: '/shopify/updateBrandOrPerson4ShopifySpecificProduct',
    method: 'post',
    params: buildShopifyTagParams(props.products, formData),
    showLoading: false,
  }).finally(() => {
    submitting.value = false
  })

  if (!response) {
    return
  }

  ElMessage.success('商品打标成功')
  emit('update:modelValue', false)
  emit('saved')
}

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      resetForm()
    }
  },
)
</script>

<style scoped lang="scss"></style>
