<template>
  <div class="booking-request">
    <component class="booking-request-pages"
      :is="currentComponent"
      :formData="formData"
      @next="handleNext"
      @back="handleBack"
      @updateFormData="updateFormData"
      @returnAfterFinish="toPastData"
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
      steps: ['RequesteePastData', 'InformationField','ConfirmData','BookingComplete'],
      formData: {
        title: '',
        pick_up_time_dept: '',
        pick_up_time_return: '',
        pick_up_location_dept_id: '',
        pick_up_location_dept_name: '',
        pick_up_location_return_id: '',
        pick_up_location_return_name: '',
        passenger: null,
        luggage: "No",
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
    },
    toPastData() {
      this.step = 0;
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
  height: 100%;
}

.booking-request-pages {
  height: 100%;
}
</style>