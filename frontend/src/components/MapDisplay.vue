<template>
  <div class="map-container">
    <div id="map" ref="mapElement"></div>

    <div class="location-info" v-if="markerLocations.length > 0">
      <div v-for="(loc, i) in markerLocations" :key="i">
        {{ markerLabels[i] }}: {{ loc.lat.toFixed(5) }}, {{ loc.lng.toFixed(5) }}
      </div>
    </div>

    <button class="map-btn back-btn" @click="$emit('back')">Back</button>
    <button class="map-btn next-btn" @click="proceed">Next</button>
  </div>
</template>


<script setup>
import 'leaflet/dist/leaflet.css'
import { ref, onMounted } from 'vue'
import L from 'leaflet'

const emit = defineEmits(['next', 'back', 'update-data'])

const mapElement = ref(null)
const map = ref(null)
const markers = ref([])
const markerLocations = ref([])

const markerLabels = ['From', 'To', 'Back']

onMounted(() => {
  map.value = L.map(mapElement.value).setView([13.75, 100.5], 12)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map.value)

  map.value.on('click', (e) => {
    if (markerLocations.value.length >= 3) return

    const { lat, lng } = e.latlng
    markerLocations.value.push({ lat, lng })

    const label = markerLabels[markerLocations.value.length - 1]

    const marker = L.marker([lat, lng], {
        draggable: true
    }).addTo(map.value)

    marker.bindPopup(label)

    marker.on('dragend', (event) => {
      const position = event.target.getLatLng()
      const index = markers.value.indexOf(event.target)
      if (index !== -1) {
        markerLocations.value[index] = {
          lat: position.lat,
          lng: position.lng
        }
      }
    })

    markers.value.push(marker)
  })
})

function proceed() {
  const locations = [...markerLocations.value]
  if (locations.length < 2) {
    alert('Please select at least 2 locations: From and To.')
    return
  }
  if (locations.length === 2) {
    locations.push(locations[0])
  }
  emit('update-data', {
    locations
  })
  emit('next')
}
</script>


<style scoped>
.map-container {
  position: relative;
  width: 100vw;
  height: calc(100vh - 56px);
}

#map {
  width: 100%;
  height: 100%;
}

.location-info {
  position: absolute;
  bottom: 70px;
  left: 1rem;
  background: rgba(255, 255, 255, 0.9);
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 14px;
  z-index: 1000;
}

.map-btn {
  position: absolute;
  padding: 10px 16px;
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: bold;
  cursor: pointer;
  z-index: 1000;
  bottom: 1rem ;
}

.back-btn {
  left: 1rem;
}

.next-btn {
  right: 1rem;
}
</style>
