<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="router-wrapper">
    <RouterView />
  </div>
</template>

<style>
html, body, #app {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow-x: hidden;
}

.no-select,
.no-select * {
  user-select: none !important;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}
</style>