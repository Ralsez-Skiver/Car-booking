<template>
  <div class="day-timetable">
    <div class="scroll-container">

      <!-- TIME GRID -->
      <div class="time-grid">
        <div v-for="hour in hours" :key="hour" class="time-row">
          <div class="time-label">{{ formatHour(hour) }}</div>
        </div>
      </div>

      <!-- EVENTS -->
      <div class="events-layer">
        <div
          v-for="event in layoutedEvents"
          :key="event.id"
          class="event-block"
          :class="event.type"
          :style="computeEventStyle(event)"
          @mousedown="startDrag(event, $event)"
        >
          <div class="event-title">{{ event.title }}</div>
          <div class="event-requester">{{ event.requester }}</div>

          <!-- Resize handle -->
          <div
            class="resize-handle"
            @mousedown.stop="startResize(event, $event)"
          ></div>

          <!-- Tooltip -->
          <div class="tooltip">
            <strong>{{ event.title }}</strong><br />
            {{ secondsToTime(event.startSec) }} → {{ secondsToTime(event.endSec) }}<br />
            Car: {{ event.carName || 'Unassigned' }} <br />
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script>
export default {
  name: 'DayTimetable',

  props: {
    schedule: { type: Array, required: true },
    carData: { type: Array, required: true },
  },

  data() {
    return {
      events: [],

      // Drag state
      draggingEvent: null,
      dragStart: { x: 0, y: 0 },
      original: { startSec: 0, carId: null },

      // Resize state
      resizingEvent: null,
      resizeStartY: 0,
      originalDurationSec: 0,
    };
  },

  watch: {
    schedule: {
      immediate: true,
      handler() {
        this.events = this.schedule
          .filter(r => r.start_time)
          .map(this.parseRow);
      }
    }
  },

  computed: {
    /* Hours for the left grid */
    hours() {
      return Array.from({ length: 25 }, (_, i) => i);
    },

    /* Normalize cars + add Unassigned */
    carColumns() {
      return [
        ...this.carData.map(c => ({ id: c.car_id, name: c.car_name })),
        { id: null, name: 'Unassigned' },
      ];
    },

    totalColumns() {
      return this.carColumns.length;
    },

    /* Group events by carId */
    eventsByCar() {
      const map = new Map();
      this.events.forEach(e => {
        const key = e.carId ?? 'unassigned';
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(e);
      });
      return map;
    },

    /* Resolve overlaps per car and create layouted events */
    layoutedEvents() {
      const result = [];

      this.carColumns.forEach(car => {
        const key = car.id ?? 'unassigned';
        const list = this.eventsByCar.get(key) || [];

        this.resolveOverlaps(list);

        list.forEach(e => {
          e.carName = car.name;
          result.push(e);
        });
      });

      return result;
    }
  },

  methods: {
    /* ---------------- PARSER ---------------- */
    parseRow(row) {
      const startSec = this.timeToSeconds(row.start_time.slice(0, 5));
      const durationSec =
        row.manual_estimate != null ? row.manual_estimate : row.time_matrix;

      return {
        id:
          row.trip_type === 'segment'
            ? `seg-${row.trip_id}`
            : `ret-${row.booking_id}`,
        title: row.title,
        requester: row.requester,
        type: row.trip_type,
        startSec,
        durationSec,
        endSec: startSec + durationSec,
        carId: row.car_id ?? null,
        subColumn: 0,
        subColumns: 1,
      };
    },

    /* ----------- OVERLAP RESOLUTION ---------- */
    resolveOverlaps(events) {
      events.sort((a, b) => a.startSec - b.startSec);
      const columns = [];

      events.forEach(event => {
        let col = 0;
        while (true) {
          if (!columns[col]) {
            columns[col] = [];
            break;
          }

          const overlap = columns[col].some(
            e => !(event.endSec <= e.startSec || event.startSec >= e.endSec)
          );
          if (!overlap) break;
          col++;
        }
        columns[col].push(event);
        event.subColumn = col;
      });

      const total = columns.length;
      events.forEach(e => (e.subColumns = total));
    },

    /* ---------------- STYLE ----------------- */
    computeEventStyle(event) {
      const pixelsPerSecond = 100 / 3600;
      const baseWidth = 160;
      const gap = 6;

      const carIndex = this.carColumns.findIndex(c => c.id === event.carId);

      const top = event.startSec * pixelsPerSecond;
      const height = Math.max(event.durationSec * pixelsPerSecond, 30);

      const subWidth = (baseWidth - (event.subColumns - 1) * gap) / event.subColumns;
      const left = carIndex * (baseWidth + gap) + event.subColumn * (subWidth + gap);

      return {
        top: `${top}px`,
        height: `${height}px`,
        width: `${subWidth}px`,
        left: `${left}px`,
        background: this.subColumnColor(event.subColumn),
      };
    },

    subColumnColor(i) {
      const colors = ['#4caf50', '#2196f3', '#9c27b0', '#ff5722'];
      return colors[i % colors.length];
    },

    /* ---------------- DRAG ------------------ */
    startDrag(event, e) {
      if (this.resizingEvent) return;

      this.draggingEvent = event;
      this.dragStart = { x: e.clientX, y: e.clientY };
      this.original.startSec = event.startSec;
      this.original.carId = event.carId;

      document.addEventListener('mousemove', this.onDrag);
      document.addEventListener('mouseup', this.stopDrag);
    },

    onDrag(e) {
      if (!this.draggingEvent) return;

      const pixelsPerSecond = 100 / 3600;

      // vertical
      const deltaY = e.clientY - this.dragStart.y;
      const secDelta = Math.round(deltaY / pixelsPerSecond);

      this.draggingEvent.startSec = Math.max(0, this.original.startSec + secDelta);
      this.draggingEvent.endSec = this.draggingEvent.startSec + this.draggingEvent.durationSec;

      // horizontal
      const deltaX = e.clientX - this.dragStart.x;
      const colWidth = 160 + 6;
      const shift = Math.round(deltaX / colWidth);

      const originalIndex = this.carColumns.findIndex(c => c.id === this.original.carId);
      let newIndex = originalIndex + shift;
      newIndex = Math.max(0, Math.min(newIndex, this.totalColumns - 1));

      this.draggingEvent.carId = this.carColumns[newIndex].id;
    },

    stopDrag() {
      document.removeEventListener('mousemove', this.onDrag);
      document.removeEventListener('mouseup', this.stopDrag);
      this.draggingEvent = null;
      // save event if needed
    },

    /* ---------------- RESIZE ---------------- */
    startResize(event, e) {
      this.resizingEvent = event;
      this.resizeStartY = e.clientY;
      this.originalDurationSec = event.durationSec;

      document.addEventListener('mousemove', this.onResize);
      document.addEventListener('mouseup', this.stopResize);
    },

    onResize(e) {
      if (!this.resizingEvent) return;

      const pixelsPerSecond = 100 / 3600;
      const deltaY = e.clientY - this.resizeStartY;
      const secDelta = Math.round(deltaY / pixelsPerSecond);

      const MIN_DURATION = 5 * 60; // 5 minutes

      this.resizingEvent.durationSec = Math.max(MIN_DURATION, this.originalDurationSec + secDelta);
      this.resizingEvent.endSec = this.resizingEvent.startSec + this.resizingEvent.durationSec;
    },

    stopResize() {
      document.removeEventListener('mousemove', this.onResize);
      document.removeEventListener('mouseup', this.stopResize);
      this.resizingEvent = null;
      // save event if needed
    },

    /* ---------------- TIME ------------------ */
    formatHour(h) { return `${String(h).padStart(2, '0')}:00`; },
    timeToSeconds(t) { const [h, m] = t.split(':').map(Number); return h * 3600 + m * 60; },
    secondsToTime(s) { const h = Math.floor(s / 3600) % 24; const m = Math.floor((s % 3600) / 60); return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`; },
  }
};
</script>

<style scoped>
.day-timetable {
  width: 100%;
  background: #f9f9f9;
  font-family: Arial, sans-serif;
  overflow-x: auto;
}

.scroll-container {
  position: relative;
  height: calc(24 * 100px);
}

.time-row {
  height: 100px;
  border-top: 1px solid #e0e0e0;
}

.time-label {
  font-size: 12px;
  padding: 4px;
  width: 60px;
}

.events-layer {
  position: absolute;
  top: 0;
  left: 60px;
  right: 0;
}

.event-block {
  position: absolute;
  color: #fff;
  border-radius: 4px;
  padding: 4px;
  font-size: 12px;
  cursor: grab;
}

.resize-handle {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 6px;
  cursor: ns-resize;
  background: rgba(255,255,255,0.35);
  border-radius: 0 0 4px 4px;
}

.event-block:hover .resize-handle {
  background: rgba(255,255,255,0.6);
}

.tooltip {
  position: absolute;
  top: 100%;
  left: 0;
  background: rgba(0,0,0,.85);
  color: #fff;
  padding: 6px;
  border-radius: 4px;
  font-size: 11px;
  white-space: nowrap;
  opacity: 0;
  z-index: 1000;
  pointer-events: none;
}

.event-block:hover .tooltip {
  opacity: 1;
}

.event-title {
  font-weight: bold;
  overflow: hidden;
}

.event-requester {
  opacity: 0.85;
}
</style>
