<template>
  <div class="booking-request">
    <component class="booking-request-pages"
      :is="currentComponent"
      :formData="formData"
      :segmentData="currentSegment ? formData.segments[segment_index] : undefined"
      :isLastSegment="currentSegment && (segment_index === formData.segments.length - 1)"
      :segmentCount="formData.segments.length"
      @next="handleNext"
      @back="handleBack"
      @updateFormData="updateFormData"
      @returnAfterFinish="toPastData"
      @addSegment="addSegment"
      @deleteSegment="deleteSegment"
    />
  </div>
</template>

<script>
import InformationField from '@/components/InformationField.vue'
import RequesteePastData from '@/components/RequesteePastData.vue'
import ConfirmData from './ConfirmData.vue';
import BookingComplete from './BookingComplete.vue';
import InformationFieldSegment from './InformationFieldSegment.vue';
import InformationFieldLast from './InformationFieldLast.vue';

export default {
  components: {
    RequesteePastData,
    InformationField,
    InformationFieldSegment,
    InformationFieldLast,
    ConfirmData,
    BookingComplete,
  },
  data() {
    return {
      step: 0,
      steps: ['RequesteePastData', 'InformationField', 'InformationFieldSegment', 'InformationFieldLast', 'ConfirmData','BookingComplete'],
      segment_index: 0,
      formData: {
        title: '',
        passenger: null,
        luggage: false,
        return_pickup_time: '',
        return_pickup_location_id: '',
        return_pickup_location_name: '',
        return_destination_id: '',
        return_destination_name: '',
        segments: [
          {
            segment_order: 1,
            pickup_dept_time: '',
            pickup_dept_location_id: '',
            pickup_dept_location_name: '',
            destination_id: '',
            destination_name: '',
          }
        ]
      }
    }
  },
  computed: {
    currentComponent() {
      return this.steps[this.step]
    },
    currentSegment() {
      return ['InformationFieldSegment'].includes(this.steps[this.step])
    }
  },
  methods: {
    handleNext() {
      if (this.currentSegment) {
        if (this.segment_index < this.formData.segments.length - 1) {
          this.segment_index++;
        } else {
          this.step++;
        }
      } else if (this.step < this.steps.length - 1) {
        this.step++;
      }
    },
    handleBack() {
      if (this.currentSegment) {
        if (this.segment_index > 0) {
          this.segment_index--;
        } else {
          this.step--;
        }
      } else if (this.step > 0) {
        this.step--;
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
    },
    addSegment() {
      const newSegment = {
        segment_order: this.formData.segments.length + 1,
        pickup_dept_time: '',
        pickup_dept_location_id: '',
        pickup_dept_location_name: '',
        destination_id: '',
        destination_name: '',
      };
      this.formData.segments.push(newSegment);
      this.segment_index = this.formData.segments.length - 1;
    },
    deleteSegment(segmentOrderToDelete) {
      const indexToDelete = this.formData.segments.findIndex(
        s => s.segment_order === segmentOrderToDelete);
      if (indexToDelete === -1) return;
      this.formData.segments.splice(indexToDelete, 1);
      this.formData.segments.forEach((segment, index) => {
        segment.segment_order = index + 1;
      });
      if (this.segment_index === this.formData.segments.length) {
      this.segment_index = this.formData.segments.length - 1;
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
  height: 100%;
}

.booking-request-pages {
  height: 100%;
}
</style>