<script setup>
defineProps({
  title: { type: String, default: 'Sin resultados' },
  description: { type: String, default: '' }
})
</script>
<template>
  <div class="empty">
    <div class="empty-icon">
      <slot name="icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="4" width="18" height="16" rx="3"/>
          <path d="M7 9h10M7 13h6" stroke-linecap="round"/>
        </svg>
      </slot>
    </div>
    <div class="empty-title">{{ title }}</div>
    <div v-if="description" class="empty-text">{{ description }}</div>
    <div v-if="$slots.default" style="margin-top:8px"><slot /></div>
  </div>
</template>
