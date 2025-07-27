<template>
  <div>
    <AccountBar />
    <div class="AdminView-Container">
      <AdminCalendar />
    </div>
  </div>
</template>

<script>
import AccountBar from '@/components/AccountBar.vue'
import AdminCalendar from '@/components/AdminCalendar.vue';

export default {
  components: {
    AccountBar, AdminCalendar,
  },
}
</script>


<style scoped>
.AdminView-Container {
  display: flex;
  padding: 1rem 1rem;
  background: #f9f9f9;
}


</style>