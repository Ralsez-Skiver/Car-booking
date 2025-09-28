  <template>
    <div class="bar-container">
      
      <button class="next-btn" @click="$emit('next')">
        Request car booking
      </button>

      <div  @click="ExpandList" class="toggle-booking-data">
        {{ BoolExpandPastData ? 'Hide previous bookings' : 'View previous bookings'}}
      </div>

      <div v-if="BoolExpandPastData" class="list-container">
        <div
          v-for="(day, index) in dataFormatted"
          :key="day.date + index"
          class="bar-wrapper"
        >
          <div class="bar" @click="ExpandDataDetail(index)">
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

  const ExpandDataDetail = (index) => {
    expandedIndex.value = expandedIndex.value === index ? null : index
  }

  const BoolExpandPastData = ref(false)
  const ExpandList = () => {
    BoolExpandPastData.value = !BoolExpandPastData.value
  }
  </script>

  <style scoped>
  .bar-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    width: 50%;
    margin: auto;
    height: 80vh;
    padding: 1rem;
    font-family: Arial, sans-serif;
  }

  .next-btn {
    margin-top: 10px;
    margin-bottom: 10px;
    padding: 10px;
    background-color: #64b5f6;
    color: black;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    position: sticky;
    top: 0;
    font-weight: bold;
    font-size: 16px;
  }

  .list-container {
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-top: 10px;
  }

  .bar-wrapper {
    width: 98%;
    margin: auto;
  }

  .bar {
    background-color: #a2e494;
    color: #333333;
    cursor: pointer;
    padding: 10px;
    border-radius: 4px;
  }

  .details {
    background-color: #cbf5c7;
    border-radius: 0 0 4px 4px;
    padding: 1px 0 1px 10px;
  }

  .toggle-booking-data {
    padding: 10px;
    background-color: #9e9e9e;
    color: black;
    border-radius: 4px;
    cursor: pointer;
    position: sticky;
    top: 0;
    font-weight: bold;
    text-align: center;
    font-size: 16px;
  }
  </style>

