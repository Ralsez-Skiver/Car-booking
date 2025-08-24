  <template>
    <div class="bar-container">
      <button class="next-btn" @click="$emit('next')">
        Request car booking
      </button>

      <div class="list-container">
        <div
          v-for="(day, index) in dataFormatted"
          :key="day.date + index"
          class="bar-wrapper"
        >
          <div class="bar" @click="toggleExpand(index)">
            <span class="bar-label">{{ day.date }}</span>
          </div>
          <div v-if="expandedIndex === index" class="details">
            <p><strong>Details for {{ day.date }}:</strong></p>
            <p>
              <strong>Passengers:</strong> {{ day.details.passenger }} <br>
              <strong>Luggage:</strong> {{ day.details.luggage }} <br>
              <strong>Pickup Time:</strong> {{ day.details.pickupTime }} <br>
              <strong>Return Time:</strong> {{ day.details.returnTime }} <br>
              <strong>From:</strong> {{ day.details.origin }}  To: {{ day.details.destination }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </template>


  <script setup>
  import { onMounted, ref } from 'vue'
  import { stringifyQuery } from 'vue-router';

  const expandedIndex = ref(null)
  const dataFormatted = ref([])

  onMounted(async () => {
    try {
      const res = await fetch('http://localhost:3001/requestee_past_data', { credentials: 'include' });
      if (!res.ok) {
        throw new Error('Failed to fetch past data');
      }
      const data = await res.json();
      console.log('Fetched data:', data);
      dataFormatted.value = data.map(item => ({
        date: new Date(item.pick_up_time_dept).toLocaleDateString(),
        details: {
          passenger: item.passenger,
          luggage: item.luggage,
          origin: `(${item.origin_lat}, ${item.origin_long})`,
          destination: `(${item.destination_lat}, ${item.destination_long})`,
          pickupTime: new Date(item.pick_up_time_dept).toLocaleTimeString(),
          returnTime: new Date(item.pick_up_time_return).toLocaleTimeString(),
        }
      }))
    } catch (error) {
      console.error(error);
    }
  });

  const toggleExpand = (index) => {
    expandedIndex.value = expandedIndex.value === index ? null : index
  }
  </script>

  <style scoped>
  .bar-container {
    display: flex;
    flex-direction: column;
    width: 50%;
    margin: auto;
    height: 80vh;
    padding: 1rem;
  }

  .next-btn {
    margin-top: 10px;
    margin-bottom: 15px;
    padding: 10px;
    background-color: #2196f3;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .list-container {
    flex-grow: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 10px;
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
    border-radius: 0 0 4px 4px;
  }
  </style>

