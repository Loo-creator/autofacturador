<script setup>
import { onMounted, computed, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useUiStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import ToastAlert from '@/components/ui/ToastAlert.vue'
import AuthBackdrop from '@/components/auth/AuthBackdrop.vue'

const ui = useUiStore()
const auth = useAuthStore()
const route = useRoute()

/**
 * El fondo animado de las páginas de autenticación vive aquí (y no en cada vista):
 * así, al ir de /login a /registro el componente NO se desmonta, las figuras siguen
 * moviéndose y la transición entre ambas se siente continua.
 */
const esAuth = computed(() => route.path === '/login' || route.path === '/registro')

const backdrop = computed(() => route.path === '/registro'
  ? {
    eyebrow: 'Empieza en segundos',
    title: 'Tu portal de facturación, listo',
    subtitle: 'Crea tu cuenta y emite tus primeros CFDI 4.0 sin fricción ni paperwork.',
    noteTitle: 'Sin tarjeta',
    noteText: 'El registro es gratuito e inmediato.',
  }
  : {})

/** Título de la pestaña según la sección. */
const TITULOS = {
  '/login': 'Iniciar sesión',
  '/registro': 'Crear cuenta',
  '/facturar-express': 'Facturar sin registro',
  '/admin': 'Panel de administración',
  '/negocio': 'Portal del negocio',
  '/cliente': 'Mi portal',
}
const titulo = computed(() => {
  const exacto = TITULOS[route.path]
  if (exacto) return exacto
  if (route.path.startsWith('/admin')) return 'Panel de administración'
  if (route.path.startsWith('/negocio')) return 'Portal del negocio'
  if (route.path.startsWith('/cliente')) return 'Mi portal'
  return 'Autofacturación'
})
watch(titulo, (t) => {
  if (typeof document !== 'undefined') document.title = `${t} · Autofacturación CFDI 4.0`
}, { immediate: true })

onMounted(async () => {
  await auth.restore()
})
</script>

<template>
  <!-- Fondo animado persistente (login ↔ registro) -->
  <Transition name="backdrop">
    <AuthBackdrop v-if="esAuth" v-bind="backdrop" />
  </Transition>

  <RouterView v-slot="{ Component, route: r }">
    <Transition name="page" mode="out-in">
      <component :is="Component" :key="r.path" />
    </Transition>
  </RouterView>

  <ToastAlert />
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

:root { --font-sans: 'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif; }
body { font-family: var(--font-sans); }

/* ── Transición "mágica" entre páginas ─────────────────────────────────
   El fondo no se desmonta, así que sólo el contenido se desliza: el efecto
   es de una sola pieza en lugar de un corte seco.                            */
.page-enter-active {
  transition: opacity .34s cubic-bezier(.16, 1, .3, 1),
              transform .42s cubic-bezier(.16, 1, .3, 1),
              filter .34s ease;
}
.page-leave-active {
  transition: opacity .2s ease,
              transform .2s ease,
              filter .2s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateX(26px) scale(.985);
  filter: blur(6px);
}
.page-leave-to {
  opacity: 0;
  transform: translateX(-14px) scale(.99);
  filter: blur(4px);
}

/* Entrada/salida del fondo animado */
.backdrop-enter-active, .backdrop-leave-active { transition: opacity .45s ease; }
.backdrop-enter-from, .backdrop-leave-to { opacity: 0; }

/* Premium scrollbars */
* { scrollbar-width: thin; scrollbar-color: var(--border-strong) transparent; }
*::-webkit-scrollbar { width: 8px; height: 8px; }
*::-webkit-scrollbar-track { background: transparent; }
*::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 4px; }
*::-webkit-scrollbar-thumb:hover { background: var(--muted-2); }

/* Global micro-interactions */
button, .btn, a.btn { transition: transform .15s ease, box-shadow .25s ease, background .2s ease, color .2s ease, border-color .2s ease; }
button:active:not(:disabled), .btn:active:not(:disabled) { transform: scale(0.98); }
button:hover:not(:disabled).btn-primary, .btn-primary:hover:not(:disabled) { box-shadow: 0 0 0 4px rgba(251,146,60,0.16), 0 8px 18px rgba(251,146,60,0.24); }

input:focus, textarea:focus, .input:focus {
  box-shadow: 0 0 0 4px rgba(251, 146, 60, 0.18) !important;
  border-color: rgba(251, 146, 60, 0.45);
}
</style>
