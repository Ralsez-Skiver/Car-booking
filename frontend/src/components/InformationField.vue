<template>
    <div class="informationfield-container">
        info form
        <br>
        <button class="next-btn" @click="$emit('next')">Next</button>
    </div>
</template>

<style>
.informationfield-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100vw;
  height: 92vh;
}
</style>