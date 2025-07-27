<template>
  <div>
    <AccountBar />

    <component
      :is="currentComponent"
      :formData="formData"
      @next="handleNext"
      @back="handleBack"
      @update-data="updateFormData"
    />
  </div>
</template>

<script>
import AccountBar from '@/components/AccountBar.vue'
import InformationField from '@/components/InformationField.vue'
import RequesteePastData from '@/components/RequesteePastData.vue'

export default {
  components: {
    AccountBar,
    RequesteePastData,
    InformationField
  },
  data() {
    return {
      step: 0,
      steps: ['RequesteePastData', 'InformationField', 'StepSummary'],
      formData: {
        tbd1: '',
        tbd2: '',
        tbd3: '',
      }
    }
  },
  computed: {
    currentComponent() {
      return this.steps[this.step]
    }
  },
  methods: {
    handleNext() {
      if (this.step < this.steps.length - 1) {
        this.step++
      }
    },
    handleBack() {
      if (this.step > 0) {
        this.step--
      }
    },
    updateFormData(updatedFields) {
      this.formData = {
        ...this.formData,
        ...updatedFields
      }
    }
  }
}
</script>
