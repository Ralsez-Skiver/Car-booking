<template>
  <div class="login-container">
    <h2>Mock Login</h2>
    <form @submit.prevent="login" class="login-form">
      <input v-model="username" placeholder="Username" required />
      <select v-model="role">
        <option disabled value="">Select Role</option>
        <option value="Requestee">Requestee</option>
        <option value="Invoice">Invoice</option>
        <option value="Admin">Admin</option>
      </select>
      <button type="submit">Login</button>
    </form>
  </div>
</template>


<script>
import axios from 'axios'

export default {
  data() {
    return {
      username: '',
      role: '',
    }
  },
  methods: {
    async login() {
      try {
        await axios.post('http://localhost:3001/login', {
          username: this.username,
          role: this.role,
        }, { withCredentials: true })

        this.$router.push(`/${this.role}`)
      } catch (err) {
        alert("Login failed")
      }
    }
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 0 1rem;
  background: #f9f9f9;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
  max-width: 300px;
}

input, select, button {
  padding: 0.5rem;
  font-size: 1rem;
}
</style>