<template>
  <div class="bar-container">
    
    <button class="next-btn" @click="$emit('next')">
      Request car booking
    </button>

    <div @click="ExpandList" class="toggle-booking-data">
      {{ BoolExpandPastData ? 'Hide previous bookings' : 'View previous bookings'}}
    </div>

    <div v-if="BoolExpandPastData" class="list-container">
      <div v-if="dataFormatted.length === 0" class="no-data-message">
        No past data found.
      </div>

      <div
        v-for="(day, index) in dataFormatted"
        :key="day.booking_id"
        class="bar-wrapper"
      >
        <div
          class="bar"
          :class="{
            'approval-approved': day.details.approval === 1,
            'approval-pending': day.details.approval === 0,
            'approval-rejected': day.details.approval === -1
          }"
          @click="ExpandDataDetail(index)"
        >
          <span class="bar-label">
            {{ new Date(day.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) }} :
            {{ day.title }} 
          </span>
        </div>

        <div v-if="expandedIndex === index" class="details"
          :class="{
            'details-approved': day.details.approval === 1,
            'details-pending': day.details.approval === 0,
            'details-rejected': day.details.approval === -1
          }">
          
          <div class="top-details-group">
            <strong>Requested:</strong> {{ new Date(day.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }) }} <br>
            <strong>Passengers:</strong> {{ day.details.passenger }} <br>
            <strong>Luggage:</strong> {{ day.details.luggage }}
          </div>
          <hr>
          
          <div class="segments-container">
            <h4 class="segment-group-title">Trip Segments</h4>
            <div 
                v-for="(segment) in day.details.segments"
                :key="segment.segment_order"
                class="segment-summary-card"
            >
                <h5>{{ ordinal(segment.segment_order) }} Destination</h5>
                <p>
                    <strong>Time:</strong> {{ segment.pickup_time.slice(0,5) }} <br>
                    <strong>From:</strong> {{ segment.pickup_location_name }} <br>
                    <strong>To:</strong> {{ segment.destination_name }}
                </p>
            </div>
          </div>

          <div v-if="day.details.returnTime !== 'N/A'" class="return-trip-card">
              <h4 class="segment-group-title">Return Trip</h4>
              <p>
                  <strong>Time:</strong> {{ day.details.returnTime.slice(0,5) }} <br>
                  <strong>From:</strong> {{ day.details.returnLocation }} <br>
                  <strong>To:</strong> {{ day.details.returnDestination }}
              </p>
          </div>
          
        </div>

      </div>
    </div>

  </div>
</template>


<script setup>
import { onMounted, ref } from 'vue'

const expandedIndex = ref(null)
const dataFormatted = ref([])
const BoolExpandPastData = ref(false)

// const formatDateTime = (datetimeStr) => {
//     if (!datetimeStr) return 'N/A';
//     const date = new Date(datetimeStr);
//     // Formats date and time: e.g., 07/Dec/2025, 10:30
//     return date.toLocaleString('en-GB', {
//         day: '2-digit', month: 'short', year: 'numeric', 
//         hour: '2-digit', minute: '2-digit', hour12: false
//     });
// }

const ordinal = (n) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

onMounted(async () => {
    try {
        const res = await fetch('http://localhost:3001/requestee_past_data', { credentials: 'include' });
        if (!res.ok) {
            throw new Error('Failed to fetch past data');
        }
        const data = await res.json();
        
        // 1. Sort by the pickup time of the FIRST segment (most recent trip date first)
        dataFormatted.value = data
            .sort((a, b) => {
                // Get the date of the first segment, or fall back to the requested_time
                const dateA = a.segments.length > 0 ? new Date(a.segments[0].pickup_time) : new Date(a.requsted_time);
                const dateB = b.segments.length > 0 ? new Date(b.segments[0].pickup_time) : new Date(b.requsted_time);
                
                // Sort descending
                return dateB - dateA; 
            })
            // 2. Map the data to the new structure for display
            .map(item => ({
                booking_id: item.booking_id,
                title: item.title,
                
                date: item.booking_date, 

                details: {
                    passenger: item.passenger,
                    // Convert tinyint(1) to Yes/No
                    luggage: item.luggage ? 'Yes' : 'No', 
                    approval: item.approval,
                    segments: item.segments, // Pass the full array for the nested loop in the template
                    
                    // Display Time for the bar label and pickup details
                    pickupDate: item.segments.length > 0 ? item.segments[0].pickup_time : 'No Segments',
                    
                    returnTime: item.return_pickup_time ? item.return_pickup_time : 'N/A',
                    returnLocation: item.return_pickup_location_name || 'N/A',
                    returnDestination: item.return_destination_name || 'N/A'
                }
            }));
    } catch (error) {
        console.error(error);
    }
});

const ExpandDataDetail = (index) => {
    expandedIndex.value = expandedIndex.value === index ? null : index
}

const ExpandList = () => {
    BoolExpandPastData.value = !BoolExpandPastData.value
}
</script>

<style scoped>
/* -------------------------------------- */
/* 1. LAYOUT & FIXED HEADER STYLES */
/* -------------------------------------- */
.bar-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    width: 50%;
    max-width: 600px;
    margin: auto;
    height: 80vh;
    padding: 1rem;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

/* Updated .next-btn for Vertical Centering */
.next-btn {
    margin-top: 10px;
    margin-bottom: 10px;
    padding: 12px;
    background-color: #64b5f6;
    color: black;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    position: sticky;
    top: 0;
    font-weight: bold;
    font-size: 16px;
    z-index: 10;
    
    /* 🟢 FLEXBOX FOR VERTICAL CENTERING */
    display: flex; 
    justify-content: center; /* Center horizontally (already likely centered by text-align) */
    align-items: center; /* Center vertically */
    height: 40px; /* Example fixed height for centering consistency, adjust as needed */
}

/* Updated .toggle-booking-data for Text Alignment */
.toggle-booking-data {
    padding: 12px;
    background-color: #9e9e9e;
    color: white;
    border-radius: 8px;
    cursor: pointer;
    position: sticky;
    top: 0;
    font-weight: bold;
    font-size: 16px;
    z-index: 10;
    
    /* 🟢 CENTER TEXT HORIZONTALLY */
    text-align: center; 
}

/* -------------------------------------- */
/* 2. BOOKING BAR STYLES */
/* -------------------------------------- */
.list-container {
    flex-grow: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 15px;
    padding: 10px 0;
}

.bar-wrapper {
    width: 100%;
    margin: 0;
}

.bar {
    color: #333333;
    cursor: pointer;
    padding: 12px;
    border-radius: 8px 8px 0 0;
    transition: background-color 0.2s;
    font-weight: 600;
}

.bar:hover {
    filter: brightness(0.95);
}

.bar-label {
    font-size: 1rem;
    font-weight: normal;
}

/* Approval Colors for Bar */
.approval-approved { background-color: #a2e494; }
.approval-pending { background-color: #f9f4a5; }
.approval-rejected { background-color: #e57373; }
.approval-review { background-color: #b0c4de; }

.no-data-message {
    background-color: #f0f0f0;
    color: #333333;
    padding: 15px;
    border-radius: 8px;
    text-align: center;
}

/* -------------------------------------- */
/* 3. EXPANDED DETAILS STYLES */
/* -------------------------------------- */
.details {
    border-radius: 0 0 8px 8px;
    padding: 15px;
    line-height: 1.6;
    border: 1px solid;
    border-top: none;
}

/* Color adjustments for expanded panel borders/backgrounds */
.details-approved { border-color: #a2e494; background-color: #f7fff7; }
.details-pending { border-color: #f9f4a5; background-color: #fffdf5; }
.details-rejected { border-color: #e57373; background-color: #fff7f7; }
.details-review { border-color: #b0c4de; background-color: #f0f4f9; }

/* Top-level trip details */
.top-details-group {
    padding-bottom: 10px;
}

.details hr {
    border: none;
    border-top: 1px dashed #e0e6ec;
    margin: 15px 0;
}

/* Segment and Return Trip Titles */
.segment-group-title {
    font-size: 1.1rem;
    font-weight: bold;
    color: #333;
    margin-top: 0;
    margin-bottom: 10px;
    border-bottom: 1px solid #f0f0f0;
    padding-bottom: 5px;
}

/* Individual Segment Card (using minimal style) */
.segment-summary-card {
    background: #fcfcfc;
    border: 1px solid #e0e6ec;
    border-left: 3px solid #64b5f6;
    padding: 10px;
    border-radius: 4px;
    margin-bottom: 8px;
}

.segment-summary-card h5 {
    font-size: 1rem;
    font-weight: 600;
    color: #007aff;
    margin: 0 0 5px 0;
}

/* Return trip card styling */
.return-trip-card {
    background: #fff8e8;
    border: 1px solid #ffc107;
    border-left: 3px solid #ffaa00;
    padding: 10px;
    border-radius: 4px;
    margin-top: 15px;
}

/* Data Label Alignment */
strong {
    display: inline-block;
    min-width: 120px;
    margin-right: 5px;
    font-weight: 600;
}
</style>

