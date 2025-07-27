<template>
  <div class="bar-container">
    <div
      v-for="(day, index) in dailyData"
      :key="day.date"
      class="bar-wrapper"
    >
      <div class="bar" @click="toggleExpand(index)">
        <span class="bar-label">{{ day.date }}</span>
      </div>
      <div v-if="expandedIndex === index" class="details">
        <p><strong>Details for {{ day.date }}:</strong></p>
        <p>{{ day.details }}</p>
      </div>
    </div>

    <button class="next-btn" @click="$emit('next')">
      Request car booking
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const expandedIndex = ref(null)

const dailyData = ref([
  { date: '2025-07-24', value: 100, details: 'Sample data for 2025-07-24' },
  { date: '2025-07-25', value: 60, details: 'Sample data for 2025-07-25' },
  { date: '2025-07-26', value: 80, details: 'Sample data for 2025-07-26' },
  { date: '2025-07-27', value: 50, details: 'Sample data for 2025-07-27' },
  { date: '2025-07-24', value: 100, details: 'Sample data for 2025-07-24' },
  { date: '2025-07-25', value: 60, details: 'Sample data for 2025-07-25' },
  { date: '2025-07-26', value: 80, details: 'Sample data for 2025-07-26' },
  { date: '2025-07-27', value: 50, details: 'Sample data for 2025-07-27' },
  { date: '2025-07-24', value: 100, details: 'Sample data for 2025-07-24' },
  { date: '2025-07-25', value: 60, details: 'Sample data for 2025-07-25' },
  { date: '2025-07-26', value: 80, details: 'Sample data for 2025-07-26' },
  { date: '2025-07-27', value: 50, details: 'Sample data for 2025-07-27' },
  { date: '2025-07-24', value: 100, details: 'Sample data for 2025-07-24' },
  { date: '2025-07-25', value: 60, details: 'Sample data for 2025-07-25' },
  { date: '2025-07-26', value: 80, details: 'Sample data for 2025-07-26' },
  { date: '2025-07-27', value: 50, details: 'Sample data for 2025-07-27' },
])

const toggleExpand = (index) => {
  expandedIndex.value = expandedIndex.value === index ? null : index
}
</script>

<style scoped>
.bar-container {
  display: flex;
  flex-direction: column;
  padding: 1rem 1rem;
  gap: 10px;
  width: 50%;
  margin: auto;
  max-height: 80vh;
  overflow-y: auto;
  height: 80vh;
}

.bar-wrapper {
  width: 100%;
}

.bar {
  background-color: #4caf50;
  color: white;
  cursor: pointer;
  padding: 10px;
  border-radius: 4px;
}

.bar-label {
  font-weight: bold;
}

.details {
  background-color: #f1f1f1;
  padding: 10px;
  border-left: 4px solid #4caf50;
  border-radius: 0 0 4px 4px;
}

.next-btn {
  margin-top: 15px;
  padding: 10px;
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>
