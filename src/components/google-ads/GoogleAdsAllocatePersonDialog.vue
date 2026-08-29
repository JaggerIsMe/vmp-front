<template>
  <el-dialog
    :model-value="modelValue"
    title="分配投手"
    width="480px"
    class="google-ads-allocate-person-dialog"
    :close-on-click-modal="!submitting"
    :close-on-press-escape="!submitting"
    :show-close="!submitting"
    destroy-on-close
    @update:model-value="handleVisibleChange"
  >
    <div class="google-ads-allocate-person-dialog__summary">
      已选择 <strong>{{ campaigns.length }}</strong> 个广告系列
    </div>

    <el-form label-position="top" class="google-ads-allocate-person-form">
      <el-form-item label="负责人">
        <el-select
          v-model="personInCharge"
          placeholder="请选择负责人"
          filterable
          :disabled="submitting"
        >
          <el-option
            v-for="option in selectOptions"
            :key="option.dictId"
            :label="option.dictName"
            :value="option.dictId"
          />
        </el-select>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="google-ads-allocate-person-dialog__footer">
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
import { computed, ref, watch } from 'vue'
import Message from '@/utils/Message'
import Request from '@/utils/Request'

const CANCEL_PERSON_OPTION = {
  dictId: 'cancel_mark',
  dictCode: 'cancel_mark',
  dictName: '取消分配',
}

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  campaigns: {
    type: Array,
    default: () => [],
  },
  personOptions: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:modelValue', 'saved'])

const personInCharge = ref('')
const initialPersonInCharge = ref(null)
const submitting = ref(false)
const selectOptions = computed(() => [CANCEL_PERSON_OPTION, ...props.personOptions])
const campaignIdList = computed(() =>
  props.campaigns
    .map((campaign) => String(campaign?.campaignId ?? '').trim())
    .filter(Boolean),
)
const canSubmit = computed(
  () =>
    campaignIdList.value.length > 0 &&
    Boolean(personInCharge.value) &&
    personInCharge.value !== initialPersonInCharge.value,
)

const getInitialPersonInCharge = () => {
  const values = new Set(
    props.campaigns.map((campaign) => String(campaign?.personInCharge ?? '').trim()),
  )
  return values.size === 1 ? [...values][0] : null
}

const resetForm = () => {
  initialPersonInCharge.value = getInitialPersonInCharge()
  personInCharge.value = initialPersonInCharge.value ?? ''
}

const handleVisibleChange = (visible) => {
  if (!submitting.value) emit('update:modelValue', visible)
}

const handleCancel = () => {
  if (!submitting.value) emit('update:modelValue', false)
}

const handleConfirm = async () => {
  if (!canSubmit.value || submitting.value) return null

  submitting.value = true
  const response = await Request({
    url: '/googleAds/allocatePerson',
    method: 'post',
    params: {
      campaignIdList: campaignIdList.value,
      newPersonInCharge: personInCharge.value,
    },
    showLoading: false,
  }).finally(() => {
    submitting.value = false
  })

  if (!response) return response
  Message.success(personInCharge.value === 'cancel_mark' ? '已取消分配投手' : '投手分配成功')
  emit('update:modelValue', false)
  emit('saved')
  return response
}

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) resetForm()
  },
)
</script>

<style scoped lang="scss"></style>
