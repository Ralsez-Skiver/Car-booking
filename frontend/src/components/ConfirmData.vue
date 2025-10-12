<template>
  <div class="informationfield-container">
    <div class="form-card">
      <h2 class="form-title">Confirm Booking Details</h2>

      <div class="summary-group">
        <p>
          <strong>Pick-up Time (Departure):</strong>
          {{ formatDate(formData.pick_up_time_dept) }}
        </p>
        <p v-if="formData.pick_up_time_return">
          <strong>Pick-up Time (Return):</strong>
          {{ formatDate(formData.pick_up_time_return) }}
        </p>
        <p><strong>Passenger Count:</strong> {{ formData.passenger }}</p>
        <p><strong>Luggage Count:</strong> {{ formData.luggage }}</p>

        <div v-if="formData.markerLocations.length">
          <strong>Locations Selected:</strong>
          <ul class="location-list">
            <li
              v-for="(location, index) in formData.markerLocations"
              :key="index"
            >
              {{ markerLabels[index] || `Location ${index + 1}` }}:
              {{ formatLocation(location) }}
            </li>
          </ul>
        </div>
      </div>

      <div class="button-group">
        <button class="btn secondary" @click="$emit('back')">Back</button>
        <button class="btn" @click="makeBooking">Confirm</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: ['formData'],
  data() {
    return {
      markerLabels: ['Pick-up', 'Drop-off', 'Return']
    };
  },
  methods: {
    formatDate(datetimeStr) {
      if (!datetimeStr) return '';
      const date = new Date(datetimeStr);
      return date.toLocaleString('en-GB', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    },
    formatLocation(location) {
      if (typeof location === 'string') return location;
      if (location.address) return location.address;
      if (location.lat && location.lng) {
        return `(${location.lat.toFixed(5)}, ${location.lng.toFixed(5)})`;
      }
      return 'Unknown location';
    },
    async makeBooking() {
        try {
            const response = await fetch('http://localhost:3001/makebooking', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type' : 'application/json',
                },
                body: JSON.stringify(this.formData),
            })
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.$emit('next')
        } catch(error) {
            alert('Failed to book: ' + error.message);
        }
  },    
}}
</script>

<style scoped>
.informationfield-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 92vh;
  background: #f5f8fa;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.form-card {
  background: white;
  padding: 2.5rem;
  border-radius: 15px;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
  width: 350px;
}

.form-title {
  text-align: center;
  margin-bottom: 1.5rem;
  color: #333;
  font-size: 1.5rem;
}

.summary-group {
  font-size: 1rem;
  color: #444;
  line-height: 1.8;
  padding: 0.5rem;
  border-radius: 8px;
  background: #f9fbfd;
  margin-bottom: 1.5rem;
}

.location-list {
  margin-top: 0.5rem;
  padding-left: 1.2rem;
}

.location-list li {
  margin-bottom: 0.3rem;
  list-style-type: disc;
}

.button-group {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1.5rem;
}

.btn {
  width: 100%;
  padding: 12px;
  background: #007aff;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.3s ease;
}

.btn.secondary {
  background: #ccc;
  color: #333;
}
</style>
