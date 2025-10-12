<template>
  <div class="informationfield-container">
    <form class="form-card" @submit.prevent="submitForm">
      <h2 class="form-title">Booking information</h2>

      <div class="form-group">
        <input
          type="datetime-local"
          v-model="formData.pick_up_time_dept"
          required
          class="form-input"
        />
        <label class="form-label">Pick-up Time (Departure)</label>
      </div>

      <div class="form-group">
        <input
          type="datetime-local"
          v-model="formData.pick_up_time_return"
          class="form-input"
        />
        <label class="form-label">Pick-up Time (Return)</label>
      </div>

      <div class="form-group">
        <input
          type="number"
          v-model.number="formData.passenger"
          min="1"
          required
          class="form-input"
        />
        <label class="form-label">Passenger Count</label>
      </div>

      <div class="form-group">
        <input
          type="number"
          v-model.number="formData.luggage"
          min="0"
          class="form-input"
        />
        <label class="form-label">Luggage Count</label>
      </div>
      <div class="button-group">
        <button type="button" class="btn secondary" @click="$emit('back')">Back</button>
        <button type="submit" class="btn">Next</button>
      </div>
    </form>
  </div>
</template>

<script>
export default {
  props: ['formData'],
  methods: {
    submitForm() {
      this.$emit('updateFormData', { ...this.formData });
      this.$emit('next');
    },
  },
};
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

/* Card */
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

.form-group {
  position: relative;
  margin-bottom: 1.8rem;
}

.form-input {
  width: 100%;
  padding: 12px 10px;
  border: 1px solid #ccc;
  border-radius: 8px;
  background: #fff;
  font-size: 1rem;
  outline: none;
  transition: border 0.3s, box-shadow 0.3s;
}

.form-input:focus {
  border-color: #4a90e2;
  box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.2);
}

.form-label {
  position: absolute;
  top: 12px;
  left: 12px;
  color: #777;
  font-size: 0.9rem;
  pointer-events: none;
  transition: all 0.2s ease-in-out;
}

.form-input:focus + .form-label,
.form-input:not(:placeholder-shown) + .form-label,
.form-input:valid + .form-label {
  top: -10px;
  left: 8px;
  background: white;
  padding: 0 4px;
  font-size: 0.75rem;
  color: #4a90e2;
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
</style>
