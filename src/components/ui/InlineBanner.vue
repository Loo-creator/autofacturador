<script setup>
import { computed } from 'vue'

const props = defineProps({
  type: { type: String, default: 'info' }, // error | warning | success | info
  title: { type: String, default: '' },
  message: { type: String, default: '' },
  actionLabel: { type: String, default: '' },
  dismissible: { type: Boolean, default: false }
})

const emit = defineEmits(['action', 'dismiss'])

const icons = {
  success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/></svg>',
  error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 9l6 6"/></svg>',
  warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l9 16H3l9-16z"/><path d="M12 9v4M12 17h.01"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/></svg>'
}

const accent = computed(() => {
  const map = { error: '#EF4444', warning: '#F59E0B', success: '#10B981', info: '#FB923C' }
  return map[props.type] || map.info
})
</script>

<template>
  <div
    class="banner"
    :class="`banner--${type}`"
    role="alert"
    aria-live="polite"
    :style="{ '--accent': accent }"
  >
    <span class="banner__accent" aria-hidden="true"></span>
    <div class="banner__icon" aria-hidden="true" v-html="icons[type] || icons.info"></div>
    <div class="banner__body">
      <p v-if="title" class="banner__title">{{ title }}</p>
      <p v-if="message || $slots.default" class="banner__message">
        <slot>{{ message }}</slot>
      </p>
    </div>
    <div class="banner__actions">
      <button
        v-if="actionLabel"
        type="button"
        class="banner__action"
        @click="emit('action')"
      >
        {{ actionLabel }}
      </button>
      <button
        v-if="dismissible"
        type="button"
        class="banner__dismiss"
        aria-label="Cerrar alerta"
        @click="emit('dismiss')"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.banner {
  --accent: #FB923C;
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
  padding: 14px 16px 14px 18px;
  background: var(--glass-panel);
  backdrop-filter: var(--blur-soft);
  -webkit-backdrop-filter: var(--blur-soft);
  border: 1px solid var(--glass-line);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
  font-family: 'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif;
  overflow: hidden;
  transition: box-shadow 0.2s ease;
}
.banner__accent {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: var(--accent);
  border-radius: 12px 0 0 12px;
}
.banner__icon {
  width: 20px;
  height: 20px;
  color: var(--accent);
  flex-shrink: 0;
  margin-top: 1px;
}
.banner__icon :deep(svg) { width: 20px; height: 20px; display: block; }
.banner__body { flex: 1; min-width: 0; }
.banner__title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
  line-height: 1.35;
}
.banner__message {
  margin: 2px 0 0;
  font-size: 14px;
  color: var(--muted);
  line-height: 1.5;
}
.banner__title + .banner__message { margin-top: 4px; }
.banner__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  flex-shrink: 0;
}
.banner__action {
  border: 1px solid rgba(251, 146, 60, 0.26);
  background: var(--brand-primary-soft);
  color: var(--brand-ink);
  font-size: 14px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}
.banner__action:hover { background: var(--brand-primary-soft); border-color: var(--brand-primary); }
.banner__dismiss {
  border: none;
  background: transparent;
  color: #9CA3AF;
  padding: 4px;
  border-radius: 8px;
  cursor: pointer;
  display: inline-flex;
  transition: color 0.2s ease, background 0.2s ease;
}
.banner__dismiss:hover { color: var(--text-soft); background: var(--bg-subtle); }
.banner__dismiss svg { width: 16px; height: 16px; }

@media (max-width: 640px) {
  .banner { flex-wrap: wrap; }
  .banner__actions { width: 100%; justify-content: flex-end; padding-left: 32px; }
}
</style>
