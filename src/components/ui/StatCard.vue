<script setup>
defineProps({
  label: String,
  value: [String, Number],
  delta: String,
  tone: { type: String, default: 'brand' } // brand|coral|cyan|purple
})
</script>
<template>
  <div class="card kpi-card">
    <div class="card-body">
      <div class="kpi-icon" :class="tone">
        <slot name="icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 19h16M7 16V9m5 7V5m5 11v-6" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </slot>
      </div>
      <div class="kpi">
        <div class="kpi-label">{{ label }}</div>
        <div class="kpi-value">{{ value }}</div>
        <div v-if="delta" class="kpi-delta">{{ delta }}</div>
      </div>
    </div>
  </div>
</template>
