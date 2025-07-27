<template>
  <header class="top-banner">
    <div class="user-info">
      Logged in as: <strong>{{ username }}</strong>
    </div>
    <button @click="logout" class="logout-button">
      Logout
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
  padding: 12px 24px;
  background-color: #2c3e50;
  color: #ecf0f1;
  font-family: Arial, sans-serif;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.user-info {
  font-size: 16px;
}

.logout-button {
  padding: 6px 12px;
  font-size: 14px;
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.logout-button:hover {
  background-color: #c0392b;
}
</style>
