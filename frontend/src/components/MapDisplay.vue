<template>
  <div class="map-container">
    <div id="map" ref="mapElement"></div>

    <div class="location-info" v-if="markerLocations.length > 0">
      <div v-for="(loc, i) in markerLocations" :key="i">
        {{ markerLabels[i] }}: {{ loc.lat.toFixed(5) }}, {{ loc.lng.toFixed(5) }}
      </div>
    </div>

    <button class="map-btn back-btn" @click="toprevious">Back</button>
    <button class="map-btn next-btn" @click="proceed">Next</button>
  </div>
</template>


<script>
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

export default {
  props: ['formData'],
  data() {
    return {
      map: null,
      markers: [],
      markerLocations: [],
      markerLabels: ['Pick-up', 'Drop-off', 'Return']
    }
  },
  mounted() {
    this.map = L.map(this.$refs.mapElement).setView([13.75, 100.5], 12)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map)

    setTimeout(() => {
      this.map.invalidateSize()
    }, 100)

    this.markerLocations = [...(this.formData.markerLocations || [])];
    this.markerLocations.forEach((loc, index) => {
      const marker = L.marker([loc.lat, loc.lng], {
        draggable: true
      }).addTo(this.map)
      const label = this.markerLabels[index] || `Marker ${index + 1}`;
      marker.bindPopup(label);

      marker.on('dragend', (event) => {
        const position = event.target.getLatLng();
        this.markerLocations[index] = {
          lat: position.lat,
          lng: position.lng
        };
      });

      this.markers.push(marker)
    });

    this.map.on('click', (e) => {
      if (this.markerLocations.length >= 3) return

      const { lat, lng } = e.latlng
      this.markerLocations.push({ lat, lng })

      const label = this.markerLabels[this.markerLocations.length - 1]

      const marker = L.marker([lat, lng], {
        draggable: true
      }).addTo(this.map)

      marker.bindPopup(label)

      marker.on('dragend', (event) => {
        const position = event.target.getLatLng()
        const index = this.markers.indexOf(event.target)
        if (index !== -1) {
          this.markerLocations[index] = {
            lat: position.lat,
            lng: position.lng
          }
        }
      })

      this.markers.push(marker)
    })
  },
  methods: {
    proceed() {
      const locations = [...this.markerLocations]
      if (locations.length < 2) {
        alert('Please select at least 2 locations: From and To.')
        return
      }
      if (locations.length === 2) {
        locations.push(locations[0])
      }
      this.$emit('updateFormData', { markerLocations: [...this.markerLocations] })
      this.$emit('next')
    },
    toprevious() {
      this.$emit('updateFormData', { markerLocations: [...this.markerLocations] })
      this.$emit('back')
    }
  }
}
</script>



<style scoped>
.map-container {
  position: relative;
  width: 100%;
  height: calc(100vh - 56px);
  overflow: hidden;
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
