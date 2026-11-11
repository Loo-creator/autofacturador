<script setup>
/**
 * Layout principal de la aplicación.
 *
 * REGLA DE ORO: la columna de contenido ocupa el 100% del ancho y alto disponible
 * a la derecha del sidebar. Cero espacios muertos.
 *
 * - Desktop: CSS Grid `grid-template-columns: <sidebar> 1fr`.
 * - La columna de contenido scrollea internamente (`overflow-y: auto`), por lo que
 *   la barra superior queda fija y nunca hay doble scrollbar.
 * - El ancho se limita a 1600px sólo en pantallas ultra-wide (`max-width` + `margin: auto`).
 * - Móvil: el sidebar se oculta y pasa a drawer; el contenido usa el 100% del ancho.
 */
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import Sidebar from './Sidebar.vue'
import TopbarNav from './TopbarNav.vue'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
const route = useRoute()

const sidebarWidth = computed(() => (ui.sidebarCollapsed ? '80px' : '260px'))

// Al navegar, el drawer móvil se cierra solo.
watch(() => route.path, () => ui.closeMobileNav())
</script>

<template>
  <div class="app-layout" :style="{ '--sidebar-w': sidebarWidth }">
    <Sidebar />

    <div class="app-layout__main">
      <TopbarNav />

      <main class="app-layout__content">
        <div class="app-layout__inner">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.app-layout {
  display: grid;
  grid-template-columns: var(--sidebar-w, 260px) minmax(0, 1fr);
  /* CRÍTICO: la fila debe ser una pista exacta (minmax(0,1fr)), NO `auto`.
     Con `auto` la fila crece con el contenido, se sale del contenedor y el
     `overflow:hidden` de abajo la recorta: la tabla se cortaba y no había scroll. */
  grid-template-rows: minmax(0, 1fr);
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  background: var(--bg);
  transition: grid-template-columns .3s cubic-bezier(.4, 0, .2, 1);
}

.app-layout__main {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  min-width: 0;
  /* `min-height: 0` permite que el ítem se encoja a la pista en vez de desbordarla */
  min-height: 0;
  height: 100%;
}

.app-layout__content {
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 32px;
  background: var(--grad-app), var(--app-bg);
  transition: background .35s ease;
  scroll-behavior: smooth;
  overscroll-behavior: contain;
}

.app-layout__inner {
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* ── Tablet ─────────────────────────────────────────────────────────────── */
@media (max-width: 1280px) {
  .app-layout__content { padding: 24px; }
}

/* ── Móvil: el sidebar se convierte en drawer (ver Sidebar.vue) ─────────── */
@media (max-width: 1024px) {
  .app-layout { grid-template-columns: minmax(0, 1fr); }
  .app-layout__content { padding: 16px; }
  .app-layout__inner { gap: 16px; }
}

@media (max-width: 640px) {
  .app-layout__content { padding: 12px; }
  .app-layout__inner { gap: 14px; }
}

/* Scrollbar del área de contenido */
.app-layout__content::-webkit-scrollbar { width: 8px; height: 8px; }
.app-layout__content::-webkit-scrollbar-track { background: transparent; }
.app-layout__content::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 99px; }
.app-layout__content::-webkit-scrollbar-thumb:hover { background: var(--muted-2); }
</style>
