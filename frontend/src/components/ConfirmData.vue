<template>
  <div class="informationfield-container">
    <div class="form-card">
      <h2 class="form-title">Confirm Booking Details</h2>

      <div class="summary-group">
        
        <strong>Title: </strong>{{ formData.title }}<br>
        <strong>Date: </strong>{{ formData.date }} <br>
        <strong>Passenger: </strong>{{ formData.passenger }}<br>
        <strong>Luggage: </strong>{{ formData.luggage ? 'Yes' : 'No' }}
        <hr>

        <h3>Trip Segments</h3>
        
        <template v-if="formData.segments && formData.segments.length > 0">
            <div 
                v-for="(segment) in formData.segments" 
                :key="segment.segment_order" 
                class="segment-summary-card"
            >
                <h4>Destination {{ segment.segment_order }}</h4> 
                <p>
                    <strong>Pick up time: </strong>{{ segment.pickup_dept_time }}<br>
                    <strong>Pick up Location: </strong>{{ segment.pickup_dept_location_name }}<br>
                    <strong>Destination: </strong>{{ segment.destination_name }}
                </p>
            </div>
        </template>
        <div v-else class="no-data-message">
            <p>No trip segments have been added.</p>
        </div>
        
        <div v-if="formData.return_destination_id" class="return-trip-card">
            <h4>Return trip</h4>
            <p>
                <strong>Pick up time: </strong>{{ formData.return_pickup_time }}<br>
                <strong>Pick up Location: </strong>{{ formData.return_pickup_location_name }}<br>
                <strong>Destination: </strong>{{ formData.return_destination_name }}
            </p>
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
  methods: {
    // formatDate(datetimeStr) {
    //   if (!datetimeStr) return '';
    //   const date = new Date(datetimeStr);
    //   return date.toLocaleString('en-GB', {
    //     year: 'numeric',
    //     month: 'short',
    //     day: '2-digit',
    //     hour: '2-digit',
    //     minute: '2-digit',
    //     hour12: false
    //   });
    // },
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
/* -------------------------------------- */
/* 1. LAYOUT & CARD STYLES */
/* -------------------------------------- */
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
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1); /* Lighter shadow for minimalism */
  width: 550px; 
  max-height: 85vh;
  overflow-y: auto;
}

.form-title {
  text-align: center;
  margin-bottom: 1.5rem;
  color: #333;
  font-size: 1.5rem; 
  border-bottom: 1px solid #e0e6ec; /* Thinner border */
  padding-bottom: 0.5rem;
}

.summary-group {
  font-size: 1rem;
  color: #444;
  line-height: 1.5; 
  padding: 1rem;
  border-radius: 8px;
  background: #ffffff; /* Cleaner white background */
  border: 1px solid #e0e6ec; /* Subtle border for the entire group */
  margin-bottom: 1.5rem;
}

.summary-group hr {
    border: none;
    border-top: 1px dashed #e0e6ec; /* Dashed separator */
    margin: 15px 0;
}

/* -------------------------------------- */
/* 2. SEGMENT & ITEM STYLES (MINIMAL) */
/* -------------------------------------- */

/* Style for each trip segment */
.segment-summary-card {
  border: none; /* Removed heavy border */
  padding: 0.5rem 0;
  margin-bottom: 0.5rem;
  background: transparent; /* Clean background */
  box-shadow: none;
}

/* Return trip card (subtle distinction) */
.return-trip-card {
    background: #fcfcfc; 
    border-left: 3px solid #ccc; /* Simple grey left bar */
    padding: 1rem;
    border-radius: 4px;
    margin-top: 15px;
}

/* Segment title styling */
.segment-summary-card h4,
.return-trip-card h4 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  color: #333; /* Use standard dark color */
  border-bottom: 1px solid #f0f0f0; /* Very light separator */
  padding-bottom: 0.3rem;
  font-size: 1.1rem; 
  font-weight: 600;
}

/* Data paragraphs */
.segment-summary-card p,
.return-trip-card p {
    line-height: 1.6;
    margin: 0;
}

/* Ensure data labels are aligned for readability */
.segment-summary-card strong,
.summary-group strong,
.return-trip-card strong {
  display: inline-block;
  min-width: 100px; 
  margin-right: 5px;
  font-weight: 600; /* Bold labels */
}

/* Style for the "No segments" message (retained for good UX) */
.no-data-message {
    padding: 1rem;
    background: #fff0f0;
    border: 1px dashed #DC143C;
    border-radius: 8px;
    text-align: center;
    color: #DC143C;
    margin-top: 10px;
}

/* -------------------------------------- */
/* 3. BUTTON STYLES (Crimson Red for Confirm) */
/* -------------------------------------- */
.button-group {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1.5rem;
}

.btn {
  width: 100%;
  padding: 12px;
  background: #DC143C; 
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: bold; 
  cursor: pointer;
  transition: background 0.2s ease, transform 0.1s ease;
}

.btn:hover {
    background: #A5102F; 
    transform: translateY(-1px);
}

.btn.secondary {
  background: #ccc;
  color: #333;
  font-weight: normal;
}

.btn.secondary:hover {
    background: #bbb;
}
</style>