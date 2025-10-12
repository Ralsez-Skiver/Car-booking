<template>
  <div class="booking-request">
    <component
      :is="currentComponent"
      :formData="formData"
      @next="handleNext"
      @back="handleBack"
      @updateFormData="updateFormData"
    />
  </div>
</template>

<script>
import InformationField from '@/components/InformationField.vue'
import MapDisplay from '@/components/MapDisplay.vue'
import RequesteePastData from '@/components/RequesteePastData.vue'
import ConfirmData from './ConfirmData.vue';
import BookingComplete from './BookingComplete.vue';

export default {
  components: {
    RequesteePastData,
    InformationField,
    MapDisplay,
    ConfirmData,
    BookingComplete,
  },
  data() {
    return {
      step: 0,
      steps: ['RequesteePastData', 'InformationField', 'MapDisplay','ConfirmData','BookingComplete'],
      formData: {
        pick_up_time_dept: '',
        pick_up_time_return: '',
        passenger: null,
        luggage: null,
        markerLocations: [],
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

<style>
.booking-request {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: #faf9f6;
}
</style>