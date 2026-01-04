<template>
  <div class="day-timetable">
    <div class="header-row">
      <div class="time-corner" :style="{ height: config.headerHeight + 'px' }"></div>
      <div 
        v-for="car in carColumns" 
        :key="car.id" 
        class="car-header"
        :style="{ width: config.colWidth + 'px', height: config.headerHeight + 'px' }"
      >
        {{ car.name }}
      </div>
    </div>

    <div class="scroll-container" ref="scrollContainer">
      <div class="column-grid" :style="{ height: totalGridHeight + 'px' }">
        <div 
          v-for="(car, index) in carColumns" 
          :key="'bg-' + index" 
          class="column-bg"
          :class="{ 'alt-bg': index % 2 === 1 }"
          :style="{ width: config.colWidth + 'px' }"
        ></div>
      </div>

      <div class="time-grid">
        <div 
          v-for="hour in hours" 
          :key="hour" 
          class="time-row"
          :style="{ height: config.rowHeight + 'px' }"
        >
          <div class="time-label">{{ formatHour(hour) }}</div>
        </div>
      </div>

      <div class="events-layer" ref="eventsLayer">
        <div
          v-for="event in layoutedEvents"
          :key="event.id"
          class="event-block"
          :class="[event.type, { 'is-dragging': draggingEventId === event.id, 'editable': editMode }]"
          :style="computeEventStyle(event)"
          @mousedown="startDrag(event, $event)"
          @mouseenter="showTooltip(event, $event)"
          @mouseleave="hideTooltip"
        >
          <div class="event-content">
            <div class="event-title">{{ event.title }}</div>
          </div>
          <div class="resize-handle" @mousedown.stop="startResize(event, $event)"></div>
        </div>
      </div>
    </div>

    <div
      v-if="floatingTime"
      class="floating-time"
      :style="{ top: floatingTime.y + 'px', left: floatingTime.x + 'px' }"
    >
      <div v-if="floatingTime.title" class="tooltip-title">
        <strong>{{ floatingTime.title }}</strong>
      </div>
      <template v-if="floatingTime.mode === 'hover'">
        <strong>To:</strong> {{ floatingTime.destName }} <br>
        <strong>From:</strong> {{ floatingTime.sourceName }}<br>
        <strong>Car:</strong> {{ floatingTime.carName }} <br>
        <strong>Duration:</strong> {{ secondsToDuration(floatingTime.durationSec) }}


      </template>
      <template v-else-if="floatingTime.mode === 'Change start time'">
        <span class="mode-label">Change trip start time:</span><br>
        {{ secondsToTime(floatingTime.originalTime) }} → {{ secondsToTime(floatingTime.newTime) }}
      </template>
      <template v-else-if="floatingTime.mode === 'Change trip duration'">
        <span class="mode-label">Change trip duration:</span><br>
        {{ secondsToDuration(floatingTime.originalTime) }} → {{ secondsToDuration(floatingTime.newTime) }}
      </template>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DayTimetable',
  props: {
    schedule: { type: Array, required: true },
    carData: { type: Array, required: true },
    lockVertical: { type: Boolean, default: false },
    editMode: { type: Boolean, default: false },
  },
  data() {
    return {
      config: { colWidth: 200, rowHeight: 100, headerHeight: 45, gap: 4 },
      events: [],
      draggingEventId: null,
      resizingEventId: null,
      
      dragStart: { x: 0, y: 0, scrollTop: 0 },
      original: { startSec: 0, carId: null, durationSec: 0 },
      
      // We keep a centralized mouse state
      mouseState: { x: 0, y: 0, shift: false },
      
      floatingTime: null,
      scrollAnimationId: null,

      history: [],
      redoStack: [],
      maxHistory: 50,
    };
  },
  watch: {
    schedule: {
      immediate: true,
      handler() { this.events = this.schedule.filter(r => r.start_time).map(this.parseRow); }
    }
  },
  computed: {
    hours() { return Array.from({ length: 25 }, (_, i) => i); },
    totalGridHeight() { return this.hours.length * this.config.rowHeight; },
    carColumns() {
      return [{ id: null, name: 'Unassigned' }, ...this.carData.map(c => ({ id: c.car_id, name: c.car_name }))];
    },
    totalColumns() { return this.carColumns.length; },
    layoutedEvents() {
      const eventsByCar = new Map();
      this.events.forEach(originalEvent => {
        const displayEvent = { ...originalEvent };
        const car = this.carColumns.find(c => c.id === displayEvent.carId);
        displayEvent.carName = car ? car.name : 'Unknown';
        const key = displayEvent.carId ?? 'unassigned';
        if (!eventsByCar.has(key)) eventsByCar.set(key, []);
        eventsByCar.get(key).push(displayEvent);
      });
      const result = [];
      this.carColumns.forEach(car => {
        const key = car.id ?? 'unassigned';
        const list = eventsByCar.get(key) || [];
        this.resolveOverlaps(list);
        result.push(...list);
      });
      return result;
    }
  },
  methods: {
    resolveOverlaps(events) {
      events.sort((a, b) => a.startSec - b.startSec);
      const active = [];
      events.forEach(event => {
        for (let i = active.length - 1; i >= 0; i--) {
          if (active[i].endSec <= event.startSec) active.splice(i, 1);
        }
        const usedLanes = new Set(active.map(e => e.subColumn));
        let lane = 0; while (usedLanes.has(lane)) lane++;
        event.subColumn = lane;
        active.push(event);
        const maxLanes = Math.max(...active.map(e => e.subColumn + 1));
        active.forEach(e => { e.subColumns = maxLanes; });
      });
      events.forEach(e => { if (!e.subColumns) e.subColumns = 1; });
    },

    computeEventStyle(event) {
      const { colWidth, rowHeight, gap } = this.config;
      const pxPerSec = rowHeight / 3600;
      const carIndex = this.carColumns.findIndex(c => c.id === event.carId);
      const top = event.startSec * pxPerSec;
      const height = Math.max(event.durationSec * pxPerSec, 30);
      const effectiveGap = event.subColumns > 1 ? gap : 0;
      const singleUnitWidth = (colWidth - (event.subColumns - 1) * effectiveGap) / event.subColumns;
      const left = (carIndex * colWidth) + (event.subColumn * (singleUnitWidth + effectiveGap));
      return { 
        top: `${top}px`, 
        height: `${height}px`, 
        width: `${singleUnitWidth}px`, 
        left: `${left}px`, 
        backgroundColor: this.bookingColor(event.colorKey) 
      };
    },

    // --- MOUSE HANDLERS ---
    
    startDrag(displayEvent, e) {
      if (!this.editMode) return;
      if (this.resizingEventId) return;
      this.draggingEventId = displayEvent.id;
      this.setupInteraction(e, displayEvent);
    },

    startResize(displayEvent, e) {
      if (!this.editMode) return;
      this.resizingEventId = displayEvent.id;
      this.setupInteraction(e, displayEvent);
    },
    
    setupInteraction(e, event) {
      this.dragStart = { x: e.clientX, y: e.clientY, scrollTop: this.$refs.scrollContainer.scrollTop };
      this.original = { startSec: event.startSec, carId: event.carId, durationSec: event.durationSec };
      this.mouseState = { x: e.clientX, y: e.clientY, shift: e.shiftKey };
      
      document.body.classList.add('no-select');
      document.addEventListener('mousemove', this.onMouseMove);
      document.addEventListener('mouseup', this.stopInteraction);
      
      // Start the independent scroll loop
      this.startAutoScrollLoop();
    },

    // Central mouse listener: just updates coordinates
    onMouseMove(e) {
      this.mouseState = { x: e.clientX, y: e.clientY, shift: e.shiftKey };
      this.updateEventPosition(); // Calc position immediately on mouse move
    },

    // --- CORE CALCULATION LOGIC ---
    // This is called by mousemove OR by the scroll loop
    updateEventPosition() {
      const { colWidth, rowHeight } = this.config;
      const container = this.$refs.scrollContainer;
      const MAX_DAY_SEC = 86400; // 24 * 60 * 60

      const deltaY = this.mouseState.y - this.dragStart.y;
      const scrollOffset = container.scrollTop - this.dragStart.scrollTop;
      const totalYChange = deltaY + scrollOffset;
      const secDelta = Math.round(totalYChange / (rowHeight / 3600));

      if (this.draggingEventId) {
        const sourceEvent = this.events.find(ev => ev.id === this.draggingEventId);
        if (!sourceEvent) return;

        const isVerticalLocked = this.lockVertical ? !this.mouseState.shift : this.mouseState.shift;
        if (!isVerticalLocked) {
          // 1. Calculate potential new start
          let newStart = this.original.startSec + secDelta;
          
          // 2. Clamp Start: Don't let it go before 00:00
          newStart = Math.max(0, newStart);
          
          // 3. Clamp End: Don't let the bottom go past 24:00
          if (newStart + sourceEvent.durationSec > MAX_DAY_SEC) {
            newStart = MAX_DAY_SEC - sourceEvent.durationSec;
          }

          sourceEvent.startSec = newStart;
          sourceEvent.endSec = sourceEvent.startSec + sourceEvent.durationSec;
        }

        // Horizontal Movement
        const deltaX = this.mouseState.x - this.dragStart.x;
        const colShift = Math.round(deltaX / colWidth);
        const originalIdx = this.carColumns.findIndex(c => c.id === this.original.carId);
        if (originalIdx !== -1) {
          const newIdx = Math.max(0, Math.min(originalIdx + colShift, this.totalColumns - 1));
          sourceEvent.carId = this.carColumns[newIdx].id;
        }

        const layoutEvent = this.layoutedEvents.find(ev => ev.id === this.draggingEventId);
        if (layoutEvent) this.updateTooltip(layoutEvent, 'Change start time', this.original.startSec, sourceEvent.startSec);

      } else if (this.resizingEventId) {
        const sourceEvent = this.events.find(ev => ev.id === this.resizingEventId);
        if (!sourceEvent) return;

        // 1. Calculate potential new duration
        let newDuration = this.original.durationSec + secDelta;

        // 2. Clamp Minimum: Don't let it be shorter than 5 minutes
        newDuration = Math.max(300, newDuration);

        // 3. Clamp Maximum: Don't let the duration push the end time past 24:00
        if (sourceEvent.startSec + newDuration > MAX_DAY_SEC) {
          newDuration = MAX_DAY_SEC - sourceEvent.startSec;
        }

        sourceEvent.durationSec = newDuration;
        sourceEvent.endSec = sourceEvent.startSec + sourceEvent.durationSec;

        const layoutEvent = this.layoutedEvents.find(ev => ev.id === this.resizingEventId);
        if (layoutEvent) this.updateTooltip(layoutEvent, 'Change trip duration', this.original.durationSec, sourceEvent.durationSec);
      }
    },

    // --- SCROLL LOOP (Clean & Independent) ---
    startAutoScrollLoop() {
      const loop = () => {
        // Stop if we aren't dragging/resizing anymore
        if (!this.draggingEventId && !this.resizingEventId) return;

        const container = this.$refs.scrollContainer;
        const rect = container.getBoundingClientRect();
        const threshold = 50; 
        const speed = 15;

        // Check if mouse is in the hot zone
        let scrollDelta = 0;
        if (this.mouseState.y < rect.top + threshold) scrollDelta = -speed;
        else if (this.mouseState.y > rect.bottom - threshold) scrollDelta = speed;

        if (scrollDelta !== 0) {
          container.scrollTop += scrollDelta;
          // IMPORTANT: Since scroll changed, we must recalculate the block position
          // to keep it attached to the mouse cursor
          this.updateEventPosition();
        }

        this.scrollAnimationId = requestAnimationFrame(loop);
      };
      
      cancelAnimationFrame(this.scrollAnimationId);
      this.scrollAnimationId = requestAnimationFrame(loop);
    },

    stopInteraction() {
      cancelAnimationFrame(this.scrollAnimationId); // Kill the loop
      document.body.classList.remove('no-select');
      document.removeEventListener('mousemove', this.onMouseMove);
      document.removeEventListener('mouseup', this.stopInteraction);
      
      this.draggingEventId = null;
      this.resizingEventId = null;
      this.floatingTime = null;
      this.$emit('change', this.events);
    },

    // --- TOOLTIPS & HELPERS (Same as before) ---
    updateTooltip(layoutEvent, mode, original, current) {
      const style = this.computeEventStyle(layoutEvent);
      const containerRect = this.$refs.eventsLayer.getBoundingClientRect();
      const scrollRect = this.$refs.scrollContainer.getBoundingClientRect();

      let x = containerRect.left + parseFloat(style.left);
      let y = containerRect.top + parseFloat(style.top) + parseFloat(style.height) + 5;
      
      // Clamp tooltip Y so it doesn't disappear
      if (y > scrollRect.bottom - 40) y = scrollRect.bottom - 40;
      if (y < scrollRect.top + 40) y = scrollRect.top + 40;

      this.floatingTime = {
        title: layoutEvent.title,
        mode,
        originalTime: original,
        newTime: current,
        x, y
      };
    },
    showTooltip(event, e) {
      if (this.draggingEventId || this.resizingEventId) return;
      const rect = e.currentTarget.getBoundingClientRect();
      this.floatingTime = {
        title: event.title,
        carName: event.carName,
        startSec: event.startSec,
        endSec: event.endSec,
        sourceName: event.sourceName,
        destName: event.destName,
        durationSec: event.durationSec,
        mode: 'hover',
        x: rect.left,
        y: rect.bottom + 5
      };
    },
    hideTooltip() { if (this.floatingTime?.mode === 'hover') this.floatingTime = null; },
    parseRow(row) {
      const startSec = this.timeToSeconds(row.start_time.slice(0, 5));
      const durationSec = row.manual_estimate != null ? row.manual_estimate : row.time_matrix;
      const uniqueId = `seg-${row.trip_id}`;
      return {
        id: uniqueId,
        colorKey: row.booking_id,
        title: row.title,
        requester: row.requester,
        type: row.trip_type,
        startSec,
        durationSec,
        endSec: startSec + durationSec,
        carId: row.car_id ?? null,
        sourceName: row.source_name,
        destName: row.destination_name,
        originalStartTime: row.start_time
      };
    },
    bookingColor(key) {
      const colors = ['#f48a8f','#ff8a8e','#ffb089','#ffe97a','#fff59d','#fff9a6','#c9f7a3','#9cf28f','#93e88c','#8fe6f7','#8fcdfb','#8fa4f5','#c59adf','#f2a3d9','#ffb3cc'];
      let hash = 0; const str = String(key);
      for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
      return colors[Math.abs(hash) % colors.length];
    },
    formatHour(h) { return `${String(h).padStart(2, '0')}:00`; },
    timeToSeconds(t) { const [h, m] = t.split(':').map(Number); return h * 3600 + m * 60; },
    secondsToTime(s) { const h = Math.floor(s / 3600) % 24; const m = Math.floor((s % 3600) / 60); return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`; },
    secondsToDuration(s) { const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); return h > 0 ? `${h}h ${m}m` : `${m}m`; },

    saveHistory() {
      const snapshot = JSON.stringify(this.events);
      if (this.history.length > 0 && this.history[this.history.length - 1] === snapshot) return;

      this.history.push(snapshot);
      this.redoStack = []; // IMPORTANT: Clear redo stack on new action
      
      if (this.history.length > this.maxHistory) this.history.shift();
    },

    undo() {
      if (this.history.length <= 1) return; 

      // Move current state to redo stack before going back
      const currentState = this.history.pop();
      this.redoStack.push(currentState);
      
      const previousState = JSON.parse(this.history[this.history.length - 1]);
      this.events = previousState;
      this.$emit('change', this.events);
    },

    redo() {
      if (this.redoStack.length === 0) return;

      // Take the last undone state and put it back in history
      const nextState = this.redoStack.pop();
      this.history.push(nextState);

      this.events = JSON.parse(nextState);
      this.$emit('change', this.events);
    },

    handleKeyDown(e) {
      const isZ = e.key.toLowerCase() === 'z';
      const isY = e.key.toLowerCase() === 'y';
      const ctrlOrMeta = e.ctrlKey || e.metaKey;

      // Redo: Ctrl+Shift+Z OR Ctrl+Y
      if (ctrlOrMeta && ((isZ && e.shiftKey) || isY)) {
        e.preventDefault();
        this.redo();
      } 
      // Undo: Ctrl+Z
      else if (ctrlOrMeta && isZ) {
        e.preventDefault();
        this.undo();
      }
    },
    stopInteraction() {
      cancelAnimationFrame(this.scrollAnimationId);
      document.body.classList.remove('no-select');
      document.removeEventListener('mousemove', this.onMouseMove);
      document.removeEventListener('mouseup', this.stopInteraction);
      
      // If a change actually happened, save it to history
      if (this.draggingEventId || this.resizingEventId) {
        this.saveHistory();
      }

      this.draggingEventId = null;
      this.resizingEventId = null;
      this.floatingTime = null;
      this.$emit('change', this.events);
    },
    clearHistory() {
      this.history = [];
      this.redoStack = [];
      // Save the current state as the new "baseline"
      this.saveHistory(); 
      console.log("Edit history cleared.");
    },
  },
  mounted() {
    window.addEventListener('keydown', this.handleKeyDown);
    // Save initial state once schedule is loaded
    setTimeout(() => this.saveHistory(), 500); 
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.handleKeyDown);
  },
};
</script>

<style scoped>
/* Layout & Container */
.day-timetable { 
  width: 100%; 
  height: 100%; 
  display: flex; 
  flex-direction: column; 
  border: 1px solid #ddd; 
  font-family: sans-serif; 
  position: relative; 
  background: white;
}

/* Header Section */
.header-row { 
  display: flex; 
  flex-shrink: 0; 
  background: #fff; 
  border-bottom: 2px solid #ddd; 
  z-index: 20; 
}

.time-corner { 
  width: 60px; 
  flex-shrink: 0; 
  border-right: 1px solid #eee; 
}

.car-header { 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  font-weight: bold; 
  font-size: 13px; 
  border-right: 1px solid #eee; 
  flex-shrink: 0; 
}

/* Grid & Scrolling */
.scroll-container { 
  position: relative; 
  overflow-y: auto; 
  flex-grow: 1; 
  overflow-x: hidden; 
}

.column-grid { 
  position: absolute; 
  top: 0; 
  left: 60px; 
  display: flex; 
  pointer-events: none; 
  z-index: 0; 
}

.column-bg { 
  height: 100%; 
  border-right: 1px solid #e0e0e0; 
}

.alt-bg { 
  background-color: #f7f9fc; 
}

.time-row { 
  border-bottom: 1px solid #f0f0f0; 
  position: relative; 
  box-sizing: border-box; 
}

.time-label { 
  position: absolute; 
  top: -7px; 
  left: 0; 
  width: 60px; 
  text-align: right; 
  padding-right: 10px; 
  font-size: 11px; 
  color: #999; 
}

.events-layer { 
  position: absolute; 
  top: 0; 
  left: 60px; 
  right: 0; 
  bottom: 0; 
}

/* Event Blocks */
.event-block { 
  position: absolute; 
  color: #2b2f36; 
  border-radius: 4px; 
  padding: 6px; 
  font-size: 12px; 
  cursor: default; 
  box-shadow: 0 2px 4px rgba(0,0,0,0.15); 
  z-index: 10; 
  box-sizing: border-box; 
  overflow: hidden; 
  transition: width 0.1s ease-out, left 0.1s ease-out, box-shadow 0.2s; 
}

.event-title { 
  font-weight: bold; 
  white-space: nowrap; 
  overflow: hidden; 
  text-overflow: ellipsis; 
}

/* Edit Mode States */
.event-block.editable { 
  cursor: grab; 
}

.event-block.editable:hover {
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  z-index: 15;
}

.event-block.is-dragging {
  cursor: grabbing !important;
  z-index: 100;
  opacity: 0.9;
  box-shadow: 0 8px 16px rgba(0,0,0,0.3);
  transition: none; /* Disable transitions while actively dragging */
}

/* Resize Handle (Consolidated) */
.resize-handle { 
  position: absolute; 
  bottom: 0; 
  left: 0; 
  right: 0; 
  height: 10px; 
  display: none; /* Hidden by default in view mode */
  transition: background 0.2s;
  z-index: 2;
}

.event-block.editable .resize-handle {
  display: flex; 
  justify-content: center;
  align-items: center;
  cursor: ns-resize;
  background: rgba(0, 0, 0, 0.08); /* Visible background to indicate handle */
  border-bottom-left-radius: 4px;
  border-bottom-right-radius: 4px;
}

/* The "Grabber" line indicator */
.event-block.editable .resize-handle::after {
  content: "";
  width: 20px;
  height: 2px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
}

.event-block.editable .resize-handle:hover { 
  background: rgba(0, 0, 0, 0.15); 
}

.event-block.editable .resize-handle:hover::after {
  background: rgba(0, 0, 0, 0.4);
}

/* Tooltips & Helpers */
.floating-time { 
  position: fixed; 
  z-index: 10000; 
  background: rgba(33, 33, 33, 0.95); 
  color: #fff; 
  padding: 8px 12px; 
  border-radius: 6px; 
  font-size: 12px; 
  pointer-events: none; 
  white-space: nowrap; 
  box-shadow: 0 4px 12px rgba(0,0,0,0.3); 
}

.tooltip-title { 
  margin-bottom: 4px; 
  padding-bottom: 4px; 
  border-bottom: 1px solid #555; 
}

.mode-label { 
  color: #fff; 
  font-size: 12px;
}

.no-select { 
  user-select: none; 
}
</style>