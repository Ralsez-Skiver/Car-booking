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
/* .RequeseeView {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  background: #faf9f6;
  overflow: hidden;
} */

.resize-for-account-bar {
  flex-grow: 1;
  overflow: auto;
}
</style>