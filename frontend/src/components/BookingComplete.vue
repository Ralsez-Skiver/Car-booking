<template>
    <div class="booking-complete-container">
        <p>Booking complete</p>
        <button @click="$emit('returnAfterFinish')">
            Return
        </button>
    </div>
</template>

<style scoped>
.booking-complete-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    font-size: 48px;
}
button {
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 36px;
}
button:hover {
  background-color: #0056b3;
}
</style>