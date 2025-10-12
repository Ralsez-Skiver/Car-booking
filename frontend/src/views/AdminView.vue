<template>
  <div class="snappy-container">

    <section class="admin-pages">
      <AccountBar/>
      <div class="adminView-container">
        <AdminCalendar @dateSelected="fetchBookingData"/>
        <TimeTable :schedule="bookingData"/>
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
      bookingData: []
    };
  },
  methods: {
    async fetchBookingData(date) {
      try {
        const response = await fetch(`http://localhost:3001/schedule?date=${date}`, {credentials: 'include'})
        const data = await response.json();
        this.bookingData = data;
        console.log(data)
      } catch (error) {
          console.error("Error fetching:", error)
          this.bookingData = [];
      }
    }
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
</style>