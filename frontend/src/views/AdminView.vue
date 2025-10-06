<template>
  <div class="snappy-container">
    <section class="admin-pages">
      <AccountBar/>
      <div class="adminView-container">
        <AdminCalendar />
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

export default {
  components: {
    AccountBar, AdminCalendar, BookingRequest
  },
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
}

.adminView-container {
  display: flex;
  padding: 1rem 1rem;
}
</style>