<script setup>
import { computed } from 'vue'
const props = defineProps({
  open: Boolean,
  title: { type: String, default: '' },
  size: { type: String, default: 'md' } // md:600, lg:800
})
const emit = defineEmits(['close'])
const cls = computed(() => props.size === 'lg' ? 'modal modal-lg' : 'modal')
</script>

<template>
  <div v-if="open" class="modal-backdrop" @click.self="emit('close')">
    <div :class="cls" role="dialog" aria-modal="true">
      <div class="modal-header">
        <h3>{{ title }}</h3>
        <button class="btn btn-ghost btn-icon" @click="emit('close')" aria-label="Cerrar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="modal-body"><slot /></div>
      <div v-if="$slots.footer" class="modal-footer"><slot name="footer" /></div>
    </div>
  </div>
</template>
