<template>
  <div class="RequesteeView">
    <AccountBar />
    <BookingRequest class="resize-for-account-bar"/>
  </div>
</template>

<script>
import AccountBar from '@/components/AccountBar.vue'
import BookingRequest from '@/components/BookingRequest.vue';


export default {
  components: {
    AccountBar,
    BookingRequest
  }
}
</script>

<style>
.RequesteeView {  
  display: flex;
  flex-direction: column;
  background: #faf9f6;
  height: 100vh;
}

.resize-for-account-bar {
  flex-grow: 1;
  overflow: auto;
}
</style>