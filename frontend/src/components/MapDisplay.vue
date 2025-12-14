<template>
  <div class="map-container">
    <div id="map" ref="mapElement"></div>

    <div class="location-info" v-if="markerLocation">
      <label>
        Location name:
        <input type="text" v-model="placeName" placeholder="Enter place name"></input>
      </label>
      <div>
                Selected coordinate: {{ markerLocation.lat.toFixed(5) }}, {{ markerLocation.lng.toFixed(5) }}
      </div>
    </div>

    <button class="map-btn back-btn" @click="cancel">Back</button>
    <button class="map-btn next-btn" @click="proceed">Confirm</button>
  </div>
</template>


<script>
import 'leaflet/dist/leaflet.css'
import L, { latLng } from 'leaflet'
import 'leaflet-control-geocoder'
import 'leaflet-control-geocoder/dist/Control.Geocoder.css'

export default {
  data() {
    return {
      map: null,
      marker: null,
      markerLocation: null,
      placeName: ''
    }
  },
  mounted() {
    this.map = L.map(this.$refs.mapElement).setView([13.75, 100.5], 12)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map)

    this.$nextTick(() =>{
      setTimeout(() => {
        this.map.invalidateSize()
      }, 300)
    })

    L.Control.geocoder({defaultMarkGeocode:false})
    .on('markgeocode', (e) =>{
      const center = e.geocode.center
      this.map.setView(center,17)
      this.setMarker({ lat: center.lat, lng: center.lng })
    })
    .addTo(this.map)

    this.map.on('click', (e) => { this.setMarker(e.latlng) })
  },
  methods: {
    setMarker(latlng) {
      if (this.marker) {
        this.marker.setLatLng(latlng)
      } else {
        this.marker = L.marker([latlng.lat, latlng.lng], {draggable:true}).addTo(this.map)
        this.marker.on('dragend', (event) => {
          const newLatLng = event.target.getLatLng()
          this.markerLocation = { lat: newLatLng.lat, lng: newLatLng.lng }
      })
    }
    this.markerLocation = { lat: latlng.lat, lng: latlng.lng }
    },
    proceed() {
      if (!this.markerLocation) {
        alert('Please select a location to add.')
        return
      }
      const payload = {
        location_name: this.placeName,
        location_lat: this.markerLocation.lat,
        location_lng: this.markerLocation.lng
      };
      fetch('http://localhost:3001/addnewlocation', {
        credentials: 'include',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      .then(res => {
        if (!res.ok) {
          throw new Error(`Server responded with status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (data && data.newLocationId) {
          const savedLocation = {
            id: data.newLocationID,
            name: this.placeName,
            location_lat: this.markerLocation.lat,
            location_lng: this.markerLocation.lng
          };
          this.$emit('next', savedLocation);
        } else {
          console.error('Server response error: Missing newLocationId.', data);
          alert('Failed to get the new location ID from the server.');
        }
      })
      .catch(err => {
        console.error(err)
        alert('Error saving location: ' + err.message);
      })
    },
    cancel() {
      this.$emit('back')
    }
  }
}
</script>

<style scoped>
.map-container {
  position: relative;
  width: 100%;
  height: 100%;
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
