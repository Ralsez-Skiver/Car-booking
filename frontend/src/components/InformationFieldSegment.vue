<template>
  <div class="informationfield-container">

    <div v-if="showMap" style="width: 100%; height: 92vh;">
      <MapDisplay ref="MapDisplay" @next="updatedAddLocation" @back="closeMap" />
    </div>

    <form v-else class="form-card" @submit.prevent="submitForm">
      <h2 class="form-title">{{ ordinal(segmentData.segment_order) }} Destination information</h2>

      <div class="form-group">
        <input
          type="time"
          v-model="segmentData.pickup_dept_time"
          required
          class="form-input"
        />
        <label class="form-label">Pick-up Time</label>
      </div>

      <div class="form-group">
        <select
          v-model="segmentData.pickup_dept_location_id" @change="handleLocationChange('dept')"
          required
          class="form-input"
        >
        <option v-for="location in locations" :key="location.location_id" :value=Number(location.location_id)>{{ location.location_name }}</option>
        <option value="new">+ Add new location</option>
      </select>
        <label class="form-label">Pick-up Location</label>
      </div>

      <div class="form-group">
        <select
          v-model="segmentData.destination_id" @change="handleLocationChange('dest')"
          :required="segmentData.destination_name"
          class="form-input"
        >
        <option v-for="location in locations" :key="location.location_id" :value=Number(location.location_id)>{{ location.location_name }}</option>
        <option value="new">+ Add new location</option>
      </select>
        <label class="form-label">Destination</label>
      </div>
      
      <div class="button-group">
        <button type="button" class="btn" @click="$emit('back')">Back</button>

        <button v-if="segmentCount > 1" type="button" class="btn danger" @click="$emit('deleteSegment', segmentData.segment_order)">
            Delete Segment
        </button>

        <template v-if="isLastSegment">
          <button type="button" class="btn" @click="$emit('addSegment')">Add Another</button>
          
          <button type="submit" class="btn">Finish Trip</button> 
        </template>

        <template v-else>
          <button type="submit" class="btn">Next Segment</button>
        </template>
      </div>
    </form>
  </div>
</template>

<script>
import MapDisplay from './MapDisplay.vue';

export default {
  components: { MapDisplay },
  props: ['segmentData','segment_index','isLastSegment','segmentCount'],
    data() {
    return{
      locations: [],
      showMap: false,
      activeLocation: null, // can be dept or dest
    };
  },
  methods: {
    ordinal(n){
      const s = ["th","st","nd","rd"];
      const v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    },
    submitForm() {
      this.$emit('next');
    },
    async loadLocation() {
      try { const res = await fetch("http://localhost:3001/locations", {credentials: "include"});
        if (!res.ok) throw new Error("Failed to fetch locations");
        this.locations = await res.json();
      } catch (err) {
        console.error("Error getting locations data:", err);
      }
    },
    handleLocationChange(type) {
      const selected = 
        type == "dept"
          ? this.segmentData.pickup_dept_location_id
          : this.segmentData.destination_id;

      if (selected == "new") {
        this.activeLocation = type;
        this.showMap = true;
        if (type == "dept") {
          this.segmentData.pickup_dept_location_id = "";
        } else {
          this.segmentData.destination_id = "";
        }
      }

      const loc = this.locations.find(l => l.location_id == selected);
      if (!loc) return;
      
      if (type == "dept") {
        this.segmentData.pickup_dept_location_name = loc.location_name
      } else {
        this.segmentData.destination_name = loc.location_name
      }
    },
    async updatedAddLocation(saved) {
        this.locations.push({
          location_id: saved.id,
          location_name: saved.name,
          location_lat: saved.location_lat,
          location_lng: saved.location_lng
        });
        const newLocationId = Number(saved.id);
        if (this.activeLocation == "dept") {
          this.segmentData.pickup_dept_location_id = newLocationId;
          this.segmentData.pickup_dept_location_name = saved.name;
        } else {
          this.segmentData.destination_id = newLocationId;
          this.segmentData.destination_name = saved.name;
        }
        this.showMap = false;
        this.activeLocation = null;
    },
    closeMap() {
    this.showMap = false;
    },
  },
    mounted() {
    this.loadLocation();
  }
}
</script>

<style scoped>
.informationfield-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 92vh;
  width: 100%;
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

.btn.danger {
    background-color: #B22222; /* Firebrick Red */
    color: white;
}
</style>
