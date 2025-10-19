<template>
  <div class="day-timetable">
    <div class="scroll-container">
      <!-- Time Grid -->
      <div class="time-grid">
        <div v-for="hour in hours" :key="hour" class="time-row">
          <div class="time-label">{{ formatHour(hour) }}</div>
          <!-- <div class="time-line"></div> -->
        </div>
      </div>

      <!-- Events Layer -->
      <div class="events-layer">
        <div
          v-for="(event, index) in parsedSchedule"
          :key="event.id || index"
          class="event-block"
          :style="computeEventStyle(event)"
        >
          <div class="event-title">Booking #{{ event.id }}</div>
          <div class="event-time">{{ event.start }} - {{ event.end }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    schedule: {
      type: Array,
      default: () => [],
    },
  },
  computed: {
    hours() {
    return Array.from({ length: 25 }, (_, i) => i);
  },
    parsedSchedule() {
      const events = this.schedule.map((event) => {
        const startStr = this.formatTime(event.pick_up_time_dept);
        const endStr = this.formatTime(event.pick_up_time_return);
        const startMin = this.parseTimeToMinutes(startStr);
        const endMin = this.parseTimeToMinutes(endStr);

        console.log(event.id, event.pick_up_time_dept, new Date(event.pick_up_time_dept).toString(), startStr, startMin);

        return {
          id: event.id,
          start: startStr,
          end: endStr,
          startMin,
          endMin,
        };
      });

      events.sort((a, b) => a.startMin - b.startMin);

      const columns = [];
      events.forEach((event) => {
        let col = 0;
        while (true) {
          if (!columns[col]) {
            columns[col] = [];
            break;
          }
          const overlap = columns[col].some(
            (e) => !(event.endMin <= e.startMin || event.startMin >= e.endMin)
          );
          if (!overlap) break;
          col++;
        }
        columns[col].push(event);
        event.column = col;
      });

      events.forEach((event) => {
        const overlapping = events.filter(
          (e) => !(event.endMin <= e.startMin || event.startMin >= e.endMin)
        );
        const maxCol = Math.max(...overlapping.map((e) => e.column));
        event.totalColumns = maxCol + 1;
      });

      return events;
    },
  },
  methods: {
    formatHour(hour) {
      return hour.toString().padStart(2, '0') + ':00';
    },
    formatTime(isoString) {
      const date = new Date(isoString);
      const h = date.getUTCHours().toString().padStart(2, '0');
      const m = date.getUTCMinutes().toString().padStart(2, '0');
      return `${h}:${m}`;
    },
    parseTimeToMinutes(timeStr) {
      const [hour, minute] = timeStr.split(':').map(Number);
      return hour * 60 + minute;
    },
    computeEventStyle(event) {
      const pixelsPerMinute = 50 / 60;

      const top = event.startMin * pixelsPerMinute;
      const height = (event.endMin - event.startMin) * pixelsPerMinute;

      const fullWidth = 600;
      const columnGap = 5;

      const totalGaps = (event.totalColumns - 1) * columnGap;
      const columnWidth = (fullWidth - totalGaps) / event.totalColumns;
      const left = (columnWidth + columnGap) * event.column;

      return {
        position: 'absolute',
        top: `${top}px`,
        height: `${height}px`,
        width: `${columnWidth}px`,
        left: `${left}px`,
      };
    },
  }
};
</script>

<style scoped>
.day-timetable {
  width: 100%;
  background: #f9f9f9;
  font-family: Arial, sans-serif;
  overflow-x: auto;
  position: relative;
}

/* Scrollable timeline */
.scroll-container {
  position: relative;
  height: calc(24 * 50px);
  min-height: 1200px;
}

/* Time grid */
.time-grid {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1;
}

.time-row {
  position: relative;
  height: 50px;
  border-top: 1px solid #e0e0e0;
  vertical-align: top;
  text-align: left;
}

.time-label {
  /* position: absolute;
  top: 50%;
  left: 0; */
  width: 60px;
  padding: 3px 5px;
  font-size: 12px;
  color: #555;
}

/* Event container */
.events-layer {
  position: absolute;
  top: 0;
  left: 60px; /* Leave room for time labels */
  right: 0;
  z-index: 2;
  height: 1200px;
  background-color: transparent;
}

/* Each event block */
.event-block {
  position: absolute;
  background-color: #2196f3;
  color: white;
  border-radius: 4px;
  padding: 4px 6px;
  font-size: 12px;
  box-sizing: border-box;
  overflow: hidden;
  z-index: 3;
  pointer-events: auto;
}

.event-title {
  font-weight: bold;
}

.event-time {
  font-size: 0.75em;
  opacity: 0.8;
}
</style>
