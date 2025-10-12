<template>
  <div class="calendar-container">
    <div class="calendar">
      <div class="header">
        <button @click="prevMonth">←</button>
        <span>{{ currentMonthYear }}</span>
        <button @click="nextMonth">→</button>
      </div>
      <div class="grid">
        <div v-for="day in weekDays" :key="day" class="day-name">
          {{ day }}
        </div>
        <div
          v-for="(cell, index) in paddedDays"
          :key="index"
          :class="['day-cell', {
            'empty': !cell,
            'selected': isSelected(cell),
            'today': isToday(cell)
          }]"
          @click="cell && selectDate(cell)"
        >
          {{ cell?.getDate() }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      today: new Date(),
      currentDate: new Date(),
      selectedDate: null,
      weekDays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    };
  },
  computed: {
    currentMonthYear() {
      return this.currentDate.toLocaleString('default', {
        month: 'long',
        year: 'numeric'
      });
    },
    calendarDays() {
      const year = this.currentDate.getFullYear();
      const month = this.currentDate.getMonth();

      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const days = [];

      const leadingEmpty = firstDay.getDay();
      for (let i = 0; i < leadingEmpty; i++) {
        days.push(null);
      }
      for (let i = 1; i <= lastDay.getDate(); i++) {
        days.push(new Date(year, month, i));
      }
      while (days.length % 7 !== 0) {
        days.push(null);
      }
      return days;
    },
    paddedDays() {
      const days = this.calendarDays;
      while (days.length < 42) {
        days.push(null);
      }
      return days;
    }
  },
  methods: {
    prevMonth() {
      this.currentDate.setMonth(this.currentDate.getMonth() - 1);
      this.currentDate = new Date(this.currentDate);
    },
    nextMonth() {
      this.currentDate.setMonth(this.currentDate.getMonth() + 1);
      this.currentDate = new Date(this.currentDate);
    },
    selectDate(date) {
      this.selectedDate = date;
      const isoDate = date.getFullYear() + '-' +
        String(date.getMonth() + 1).padStart(2, '0') + '-' +
        String(date.getDate()).padStart(2, '0');
      this.$emit('dateSelected', isoDate);
    },
    isToday(date) {
      if (!date) return false;
      const today = new Date();
      return (
        today.getFullYear() === date.getFullYear() &&
        today.getMonth() === date.getMonth() &&
        today.getDate() === date.getDate()
      );
    },
    isSelected(date) {
      if (!date || !this.selectedDate) return false;
      return (
        this.selectedDate.getFullYear() === date.getFullYear() &&
        this.selectedDate.getMonth() === date.getMonth() &&
        this.selectedDate.getDate() === date.getDate()
      );
    }
  },
  mounted() {
    this.selectedDate = new Date(this.today);
    this.$emit('dateSelected', this.selectedDate.toISOString().slice(0, 10));
  }
};
</script>

<style scoped>
.calendar-container {
  padding: 1rem 1rem;
  border-right: solid;
  border-width: 1px;
  border-color: #e0e0e0;
}

.calendar {
  max-width: 250px;
  padding: 8px;
  font-family: sans-serif;
  border-radius: 4px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-weight: bold;
}

.grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}

.day-name {
  text-align: center;
  font-weight: bold;
  font-size: 0.9em;
  color: #555;
}

.day-cell {
  height: 40px;
  text-align: center;
  line-height: 40px;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.day-cell.empty {
  background-color: #f5f5f5;
  cursor: default;
}

.day-cell:hover:not(.empty) {
  background-color: #e0f0ff;
}

.day-cell.selected {
  background-color: #2196f3;
  color: white;
  font-weight: bold;
}

.day-cell.today:not(.selected) {
  border: 1px solid #2196f3;
}
</style>
