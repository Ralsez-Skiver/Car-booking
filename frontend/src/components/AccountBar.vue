<template>
  <header class="top-banner">
    <div class="user-info">
      <strong>{{ username }}</strong>
    </div>
    <button @click="logout" class="logout-button">
      <strong>Logout</strong>
    </button>
  </header>
</template>

<script>
import axios from 'axios'

export default {
  name: "AccountBar",
  data() {
    return {
      username: '',
      role: '',
    }
  },
  async created() {
    try {
      const res = await axios.get('http://localhost:3001/me')
      this.username = res.data.username
      this.role = res.data.role
    } catch (err) {
      // If no user info, redirect to login
      this.$router.push('/login')
    }
  },
  methods: {
    async logout() {
      try {
        await axios.post('http://localhost:3001/logout')
        this.$router.push('/login')
      } catch (err) {
        alert('Logout failed')
      }
    }
  }
}
</script>

<style scoped>
.top-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 36px;
  background-color: #1a237e;
  color: #f9f9f9;
  font-family: Arial, sans-serif;
  border-bottom-left-radius: 4px;
  border-bottom-right-radius: 4px;
}

.user-info {
  font-size: 16px;
}

.logout-button {
  padding: 6px 12px;
  font-size: 14px;
  background-color: #3f51b5;
  color: #f9f9f9;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-family: Arial, sans-serif;
}

.logout-button:hover {
  background-color: #5c6cb0;
}
</style>
