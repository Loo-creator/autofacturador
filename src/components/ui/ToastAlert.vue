<script setup>
import { computed } from 'vue'
import { useToast } from '@/composables/useToast'

const { toasts, removeToast, pauseToast, resumeToast } = useToast()

const icons = {
  success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/></svg>`,
  error: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 9l6 6"/></svg>`,
  warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l9 16H3z"/><path d="M12 9v4M12 17h.01"/></svg>`,
  info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/></svg>`
}

const liveMode = computed(() => (toasts.value.some(t => t.type === 'error') ? 'assertive' : 'polite'))

function titleFor(t) {
  if (t.title) return t.title
  if (t.type === 'success') return 'Éxito'
  if (t.type === 'error') return 'Error'
  if (t.type === 'warning') return 'Aviso'
  return 'Información'
}
</script>

<template>
  <div class="toast-viewport" :aria-live="liveMode" aria-relevant="additions" aria-atomic="false">
    <TransitionGroup name="toast" tag="div" class="toast-stack">
      <article
        v-for="t in toasts"
        :key="t.id"
        class="toast"
        :class="`toast--${t.type || 'info'}`"
        role="alert"
        @mouseenter="pauseToast(t.id)"
        @mouseleave="resumeToast(t.id)"
      >
        <div class="toast__icon" aria-hidden="true" v-html="icons[t.type] || icons.info"></div>
        <div class="toast__body">
          <p class="toast__title">{{ titleFor(t) }}</p>
          <p v-if="t.message" class="toast__message">{{ t.message }}</p>
        </div>
        <button class="toast__close" type="button" aria-label="Cerrar notificación" @click="removeToast(t.id)">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
        <div
          v-if="t.duration > 0"
          class="toast__progress"
          :style="{ animationDuration: `${t.duration}ms`, animationPlayState: t._paused ? 'paused' : 'running' }"
          aria-hidden="true"
        ></div>
      </article>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-viewport {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 9999;
  pointer-events: none;
  font-family: 'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif;
}
.toast-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-end;
}
.toast {
  pointer-events: auto;
  position: relative;
  width: min(360px, calc(100vw - 32px));
  display: grid;
  grid-template-columns: 22px 1fr auto;
  gap: 12px;
  align-items: start;
  padding: 14px 14px 16px;
  background: var(--glass-panel);
  backdrop-filter: var(--blur-panel);
  -webkit-backdrop-filter: var(--blur-panel);
  border: 1px solid var(--glass-line);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(17, 24, 39, 0.18);
  overflow: hidden;
}
.toast__icon { width: 22px; height: 22px; margin-top: 1px; color: var(--brand-primary); }
.toast__icon :deep(svg) { width: 22px; height: 22px; display: block; }
.toast--success .toast__icon { color: var(--success); }
.toast--error .toast__icon { color: var(--danger); }
.toast--warning .toast__icon { color: var(--warning); }
.toast__body { min-width: 0; }
.toast__title { margin: 0; font-size: 15px; font-weight: 700; color: var(--text); line-height: 1.3; }
.toast__message { margin: 3px 0 0; font-size: 14px; color: var(--muted); line-height: 1.45; }
.toast__close {
  border: none; background: transparent; color: var(--muted-2); padding: 4px; border-radius: 8px; cursor: pointer;
  display: inline-flex; transition: color .2s, background .2s, transform .15s;
}
.toast__close:hover { color: var(--text-soft); background: var(--bg-subtle); }
.toast__close:active { transform: scale(0.92); }
.toast__close svg { width: 16px; height: 16px; }
.toast__progress {
  position: absolute; left: 0; bottom: 0; height: 3px; width: 100%;
  background: var(--grad-progress);
  transform-origin: left;
  animation: toast-progress linear forwards;
}
.toast--success .toast__progress { background: var(--success); }
.toast--error .toast__progress { background: var(--danger); }
.toast--warning .toast__progress { background: var(--warning); }
@keyframes toast-progress { from { transform: scaleX(1); } to { transform: scaleX(0); } }

.toast-enter-active { animation: toast-in .38s cubic-bezier(.16,1,.3,1); }
.toast-leave-active { animation: toast-out .3s ease forwards; position: absolute; }
.toast-move { transition: transform .3s ease; }
@keyframes toast-in { from { opacity: 0; transform: translateY(-20px) scale(.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes toast-out { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(120%); } }

@media (max-width: 640px) {
  .toast-viewport { top: auto; bottom: 16px; left: 16px; right: 16px; }
  .toast-stack { align-items: stretch; }
  .toast { width: 100%; }
  @keyframes toast-in { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes toast-out { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(16px); } }
}
</style>
