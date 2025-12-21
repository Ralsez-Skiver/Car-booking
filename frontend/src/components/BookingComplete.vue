<template>
  <div class="booking-complete-container">
    <div class="card">
      <h2 class="title">Booking Complete!</h2>
      <button class="btn" @click="$emit('returnAfterFinish')">
        Return
      </button>
    </div>
  </div>
</template>

<style scoped>
.booking-complete-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100%;
  background: #f5f8fa;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.card {
  background: white;
  padding: 3rem;
  border-radius: 15px;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
  text-align: center;
  width: 400px;
}

.title {
  font-size: 2.5rem;
  color: #4a90e2;
  margin-bottom: 1rem;
}

.btn {
  padding: 14px 24px;
  background-color: #007aff;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.25rem;
  cursor: pointer;
  transition: background 0.3s ease, transform 0.2s ease;
}

.btn:hover {
  background-color: #005ecb;
  transform: translateY(-2px);
}
</style>
