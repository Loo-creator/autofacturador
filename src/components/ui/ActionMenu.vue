<script setup>
/**
 * Menú de acciones ("Opciones").
 *
 * Lista flotante con el diseño del sistema: se posiciona con fixed (nunca la recorta
 * un contenedor), se voltea si no hay espacio, cierra con Escape / clic fuera / Tab
 * y es navegable con el teclado.
 */
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  items: { type: Array, default: () => [] },
  label: { type: String, default: 'Opciones' },
  disabled: { type: Boolean, default: false },
  compact: { type: Boolean, default: false },
  align: { type: String, default: 'right' } // right | left
})
const emit = defineEmits(['select'])

const abierto = ref(false)
const activo = ref(-1)
const trigger = ref(null)
const panel = ref(null)
const pos = ref({ top: 0, left: 0, width: 0, arriba: false })

const itemsVisibles = computed(() => props.items.filter(i => !i.oculto))

function calcular() {
  if (!trigger.value) return
  const r = trigger.value.getBoundingClientRect()
  const abajo = window.innerHeight - r.bottom
  const arribaEspacio = r.top
  const flip = abajo < 220 && arribaEspacio > abajo
  const w = Math.max(r.width, 230)
  let left = props.align === 'left' ? r.left : r.right - w
  // No dejar la lista fuera de la ventana
  left = Math.min(Math.max(8, left), window.innerWidth - w - 8)
  pos.value = {
    top: flip ? r.top - 8 : r.bottom + 8,
    left,
    width: w,
    arriba: flip,
  }
}

async function abrir() {
  if (props.disabled || abierto.value) return
  abierto.value = true
  activo.value = -1
  await nextTick()
  calcular()
  document.addEventListener('mousedown', alClicFuera, true)
  document.addEventListener('keydown', alTeclado, true)
}

function cerrar() {
  if (!abierto.value) return
  abierto.value = false
  activo.value = -1
  document.removeEventListener('mousedown', alClicFuera, true)
  document.removeEventListener('keydown', alTeclado, true)
}

function alternar() { abierto.value ? cerrar() : abrir() }

function alClicFuera(e) {
  if (trigger.value?.contains(e.target) || panel.value?.contains(e.target)) return
  cerrar()
}

function alTeclado(e) {
  if (e.key === 'Escape') { e.preventDefault(); cerrar(); trigger.value?.focus() }
  else if (e.key === 'Tab') cerrar()
  else if (e.key === 'ArrowDown') { e.preventDefault(); mover(1) }
  else if (e.key === 'ArrowUp') { e.preventDefault(); mover(-1) }
  else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    const it = itemsVisibles.value[activo.value]
    if (it) elegir(it)
  }
}

function mover(delta) {
  const n = itemsVisibles.value.length
  if (!n) return
  activo.value = (activo.value + delta + n) % n
  panel.value?.querySelector('.am__item.is-active')?.scrollIntoView({ block: 'nearest' })
}

function elegir(item) {
  if (item.disabled) return
  cerrar()
  emit('select', item)
}

function realinear() { if (abierto.value) calcular() }
onMounted(() => {
  window.addEventListener('scroll', realinear, true)
  window.addEventListener('resize', realinear)
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', realinear, true)
  window.removeEventListener('resize', realinear)
  document.removeEventListener('mousedown', alClicFuera, true)
  document.removeEventListener('keydown', alTeclado, true)
})
</script>

<template>
  <div class="am" :class="{ 'is-open': abierto, 'am--compact': compact }">
    <button
      ref="trigger"
      type="button"
      class="am__trigger"
      :disabled="disabled"
      :aria-expanded="abierto"
      aria-haspopup="menu"
      @click="alternar"
      @keydown.enter.prevent="alternar"
      @keydown.space.prevent="alternar"
      @keydown.down.prevent="abrir"
    >
      <span class="am__label">{{ label }}</span>
      <svg class="am__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
    </button>

    <Teleport to="body">
      <Transition name="am">
        <div
          v-if="abierto"
          ref="panel"
          class="am__panel"
          :style="{
            top: pos.top + 'px',
            left: pos.left + 'px',
            width: pos.width + 'px',
            transform: pos.arriba ? 'translateY(-100%)' : 'none',
          }"
          role="menu"
          @keydown="alTeclado"
        >
          <template v-for="(it, i) in itemsVisibles" :key="it.key">
            <p v-if="it.group && it.group !== itemsVisibles[i - 1]?.group" class="am__group">{{ it.group }}</p>
            <button
              type="button"
              class="am__item"
              :class="{ 'is-danger': it.danger, 'is-active': i === activo, 'is-disabled': it.disabled }"
              role="menuitem"
              :disabled="it.disabled"
              @mouseenter="activo = i"
              @click="elegir(it)"
            >
              <span class="am__icon" :class="{ 'is-danger': it.danger }" aria-hidden="true">
                <svg v-if="it.icon === 'xml'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>
                <svg v-else-if="it.icon === 'pdf'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M12 12v6M9.5 15.5L12 18l2.5-2.5"/></svg>
                <svg v-else-if="it.icon === 'mail'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>
                <svg v-else-if="it.icon === 'cancel'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 9l6 6"/></svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v.01M11 12h1v4h1"/></svg>
              </span>
              <span class="am__text">
                <strong>{{ it.label }}</strong>
                <span v-if="it.hint">{{ it.hint }}</span>
              </span>
            </button>
          </template>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.am { position: relative; display: inline-flex; }

.am__trigger {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 7px 12px; border-radius: 9px;
  border: 1px solid var(--control-border); background: var(--control-bg);
  color: var(--text-soft); font-size: 13px; font-weight: 600; font-family: inherit;
  cursor: pointer; white-space: nowrap;
  transition: all .18s ease;
}
.am__trigger:hover:not(:disabled) { border-color: var(--brand-primary); color: var(--brand-ink); background: var(--brand-primary-soft); }
.am.is-open .am__trigger { border-color: var(--brand-primary); color: var(--brand-ink); background: var(--brand-primary-soft); box-shadow: 0 0 0 3px rgba(251, 146, 60, .12); }
.am__trigger:disabled { opacity: .45; cursor: not-allowed; }
.am__chevron { width: 15px; height: 15px; flex-shrink: 0; transition: transform .2s ease; }
.am.is-open .am__chevron { transform: rotate(180deg); }
.am--compact .am__trigger { padding: 6px 10px; font-size: 12.5px; }

/* ── Panel ──────────────────────────────────────────────────────────────── */
.am__panel {
  position: fixed;
  z-index: 320;
  padding: 6px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  animation: am-in .14s cubic-bezier(.16, 1, .3, 1);
}

.am__group {
  margin: 4px 8px 6px;
  font-size: 10.5px; font-weight: 700; letter-spacing: .06em;
  text-transform: uppercase; color: var(--muted-2);
}

.am__item {
  display: flex; align-items: center; gap: 11px;
  width: 100%; padding: 9px 11px;
  border: none; border-radius: 9px; background: transparent;
  color: var(--text-soft); text-align: left; font-family: inherit;
  cursor: pointer;
  transition: background .12s ease, color .12s ease;
}
.am__item:hover:not(.is-disabled),
.am__item.is-active:not(.is-disabled) { background: var(--brand-primary-soft); color: var(--brand-ink); }
.am__item.is-danger { color: var(--danger); }
.am__item.is-danger:hover:not(.is-disabled),
.am__item.is-danger.is-active:not(.is-disabled) { background: var(--danger-soft); color: var(--danger); }
.am__item.is-disabled { opacity: .45; cursor: not-allowed; }

.am__icon {
  width: 32px; height: 32px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 9px;
  background: var(--bg-subtle); color: var(--muted);
  transition: background .12s ease, color .12s ease;
}
.am__icon svg { width: 16px; height: 16px; }
.am__item:hover:not(.is-disabled) .am__icon,
.am__item.is-active:not(.is-disabled) .am__icon { background: var(--surface); color: var(--brand-primary); }
.am__icon.is-danger { color: var(--danger); }

.am__text { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.am__text strong { font-size: 13.5px; font-weight: 600; color: inherit; }
.am__text span { font-size: 11.5px; color: var(--muted); }
.am__item.is-danger .am__text span { color: color-mix(in srgb, var(--danger) 70%, transparent); }

@keyframes am-in {
  from { opacity: 0; transform: translateY(-6px) scale(.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
</style>
