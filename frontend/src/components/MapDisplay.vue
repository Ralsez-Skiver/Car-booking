<template>
  <div class="map-container">
    <div id="map" ref="mapElement"></div>

    <div class="location-info" v-if="markerLocation">
        Selected coordinate: {{ markerLocation.lat.toFixed(5) }}, {{ markerLocation.lng.toFixed(5) }}
    </div>

    <button class="map-btn back-btn" @click="toprevious">Back</button>
    <button class="map-btn next-btn" @click="proceed">Next</button>
  </div>
</template>


<script>
import 'leaflet/dist/leaflet.css'
import L, { latLng } from 'leaflet'
import 'leaflet-control-geocoder'
import 'leaflet-control-geocoder/dist/Control.Geocoder.css'

export default {
  props: ['formData'],
  data() {
    return {
      map: null,
      marker: null,
      markerLocation: null,
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

    L.Control.geocoder({defaultMarkGeocode:false})
    .on('markgeocode', (e) =>{
      const center = e.geocode.center
      this.map.setView(center,17)
      this.setMarker({ lat: center.lat, lng: center.lng })
    })
    .addTo(this.map)

    if (this.formData.markerLocation) {
      this.setMarker(this.formData.markerLocation)
      this.map.setView(this.formData.markerLocation, 15)
    }

    this.map.on('click', (e) => {
      this.setMarker(e.latlng)
    })
  },
  methods: {
    setMarker(latlng) {
      if (this.marker) {
        this.marker.setLatLng(latLng)
      } else {
        this.marker = L.marker([latlng.lat, latlng.lng], {draggable:true}).addTo(this.map)
        this.marker.on('dragend', (event) => {
          this.markerLocation = { lat: latlng.lat, lng: latlng.lng }
      })
    }
    this.markerLocation = { lat: latlng.lat, lng: latlng.lng }
    },
    proceed() {
      if (!this.markerLocation) {
        alert('Please select a location to add.')
        return
      }
      this.$emit('next')
    },
    toprevious() {
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
