<template>
  <div class="snappy-container">

    <section class="admin-pages">
      <AccountBar/>
      <div class="adminView-container">
        <div>
          <AdminCalendar @dateSelected="fetchBookingData"/>
<div class="timetable-controls">
  <button 
    :class="['btn-toggle', { 'is-editing': editMode }]" 
    @click="toggleEditMode"
  >
    {{ editMode ? 'Exit Edit Mode' : 'Edit Mode' }}
  </button>

  <div v-if="editMode" class="car-selector-wrapper">
    <label class="control-label">Select Active Fleet</label>
    <select v-model="selectedCars" multiple class="modern-select">
      <option v-for="car in carData" :key="car.car_id" :value="car.car_id">
        {{ car.car_name }}
      </option>
    </select>
    <small class="helper-text">Hold Ctrl/Cmd to select multiple</small>
  </div>
</div>
        </div>
        <TimeTable ref="timetable" :schedule="bookingData" :carData="carsWithEvents" :editMode="editMode"/>
      </div>
    </section>

    <section class="admin-pages">
      <BookingRequest />
    </section>

  </div>
</template>

<script>
import AccountBar from '@/components/AccountBar.vue'
import AdminCalendar from '@/components/AdminCalendar.vue';
import BookingRequest from '@/components/BookingRequest.vue';
import TimeTable from '@/components/TimeTable.vue';

export default {
  components: {
    AccountBar, AdminCalendar, BookingRequest, TimeTable
  },
  data() {
    return {
      bookingData: [],
      carData: [],
      editMode: false,
      selectedCars: [],
    };
  },
  methods: {
toggleEditMode() {
    this.editMode = !this.editMode;
    
    // OPTIONAL: When entering edit mode, pre-select cars that have events
    if (this.editMode) {
       const activeCarIds = this.bookingData.map(b => b.car_id).filter(Boolean);
       // Combine existing selection with active cars (using Set to remove duplicates)
       this.selectedCars = [...new Set([...this.selectedCars, ...activeCarIds])];
    } else {
      this.selectedCars = [];
      if (this.$refs.timetable) {
        this.$refs.timetable.clearHistory();
      }
    }
  },
    async fetchBookingData(date) {
      try {
        const response = await fetch(`http://localhost:3001/schedule?date=${date}`, {credentials: 'include'})
        const data = await response.json();
        this.bookingData = data;
        console.log("booking_data_dated",data)
      } catch (error) {
          console.error("Error fetching booking data:", error)
          this.bookingData = [];
      }
    },
    async fetchCarData() {
      try {
        const response = await fetch('http://localhost:3001/cardata', {credentials: 'include'})
        const data = await response.json();
        this.carData = data;
        console.log("cardata",data)
      } catch (error) {
        console.error("Error fetching car data:", error)
        this.carData = [];
      }
    }
  },
  computed: {
carsWithEvents() {
    // 1. Always get IDs of cars that have bookings/events
    const carsWithBookings = new Set(
      this.bookingData.map(b => b.car_id).filter(Boolean)
    );

    // 2. Identify which IDs should be visible
    // Start with the cars that have bookings
    let visibleCarIds = new Set(carsWithBookings);

    // If in Edit Mode, ADD the manually selected cars to the set
    if (this.editMode) {
      this.selectedCars.forEach(id => visibleCarIds.add(id));
    }

    // 3. Return the full car objects that match these IDs
    // We filter the main carData list to preserve the original sort order
    return this.carData.filter(c => visibleCarIds.has(c.car_id));
  }
  },
  mounted() {
    this.fetchCarData();
  }
}
</script>

<style scoped>
.snappy-container {
  height: 100vh;
  scroll-snap-type: y mandatory;
  scroll-behavior: smooth;
  overflow-x: hidden;
  overflow-y: scroll;
  background: #f9f9f9;
}

.admin-pages {
  height: 100vh;
  width: 100vw;
  scroll-snap-align: start;
  overflow-y: hidden;
}

.adminView-container {
  display: inline-flex;
  height: 100%;
  width: 100%;
}

/* Container for the whole control section */
.timetable-controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  width: 260px; /* Fixed width for the sidebar look */
  box-shadow: 2px 0 5px rgba(0,0,0,0.02);
}

/* The primary Toggle Button */
.btn-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid #2196f3;
  background: white;
  color: #2196f3;
}

.btn-toggle:hover {
  background: #f5f3ff;
  transform: translateY(-1px);
}

/* State when Edit Mode is Active */
.btn-toggle.is-editing {
  background: #2196f3;
  color: white;
}

/* Car Selector Wrapper */
.car-selector-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
  animation: fadeIn 0.3s ease-out;
}

.control-label {
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #2b2f36;
  font-weight: 700;
}

/* Modernized Multi-select */
.modern-select {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 8px;
  font-size: 14px;
  color: #334155;
  outline: none;
  min-height: 120px;
}

.modern-select:focus {
  border-color: #6366f1;
}

.helper-text {
  font-size: 11px;
  color: #94a3b8;
  font-style: italic;
}

/* Simple Animation */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}

</style>