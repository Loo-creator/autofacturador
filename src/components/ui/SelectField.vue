<script setup>
/**
 * Select propio (listbox estilizado).
 *
 * El `<SelectField>` nativo no se puede estilizar: la lista desplegable la dibuja el
 * sistema operativo, el anillo de foco se duplica con el estado :focus y el
 * "naranja" aparece a la vez en el texto y en el borde. Este componente resuelve
 * las tres cosas:
 *   - la lista se pinta con el sistema de diseño (Teleport al body, posición fixed)
 *   - un único indicador de foco (borde + halo suave)
 *   - navegación completa por teclado y lectura con lector de pantalla
 *
 * Soporta las dos formas de uso:
 *   1) con <option> dentro (como el select nativo)
 *   2) con la prop `options` ([{ value, label }])
 */
import { ref, computed, nextTick, onMounted, onBeforeUnmount, useSlots, Fragment, watch } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number, Boolean, Object, null], default: undefined },
  value: { type: [String, Number, Boolean, Object, null], default: undefined },
  options: { type: Array, default: () => [] },
  disabled: { type: Boolean, default: false },
  placeholder: { type: String, default: 'Selecciona…' },
  size: { type: String, default: 'md' }, // md | sm
  id: { type: String, default: undefined },
  ariaLabel: { type: String, default: undefined },
  searchable: { type: Boolean, default: false },
  // 'flush': el trigger no dibuja borde ni fondo (los aporta el contenedor padre)
  flush: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'change'])
const slots = useSlots()

const abierto = ref(false)
const activo = ref(-1)
const trigger = ref(null)
const lista = ref(null)
const filtro = ref('')
const pos = ref({ top: 0, left: 0, width: 0, maxHeight: 300, arriba: false })

/* ── Valor actual ───────────────────────────────────────────────────────── */
const valorActual = computed(() => {
  if (props.modelValue !== undefined) return props.modelValue
  if (props.value !== undefined) return props.value
  return ''
})

/* ── Opciones: del slot (<option>) o de la prop ──────────────────────────── */
function textoDe(vnode) {
  if (vnode == null) return ''
  if (typeof vnode === 'string' || typeof vnode === 'number') return String(vnode)
  if (Array.isArray(vnode.children)) return vnode.children.map(textoDe).join('')
  if (typeof vnode.children === 'string') return vnode.children
  return ''
}

function esOption(vnode) {
  if (!vnode || typeof vnode !== 'object') return false
  if (vnode.type === 'option') return true
  return typeof vnode.type === 'object' && vnode.type.__name === 'option'
}

function recolectar(vnodes, out = []) {
  for (const v of vnodes || []) {
    if (!v) continue
    if (v.type === Fragment) { recolectar(v.children, out); continue }
    if (esOption(v)) {
      out.push({
        value: v.props?.value,
        label: textoDe(v).trim() || String(v.props?.value ?? ''),
        disabled: !!v.props?.disabled,
      })
    }
  }
  return out
}

const todas = computed(() => {
  if (props.options.length) {
    return props.options.map(o => (o && typeof o === 'object'
      ? { value: o.value ?? o.id, label: o.label ?? o.nombre ?? String(o.value ?? o.id), disabled: !!o.disabled }
      : { value: o, label: String(o), disabled: false }))
  }
  return slots.default ? recolectar(slots.default()) : []
})

const opciones = computed(() => {
  if (!props.searchable || !filtro.value.trim()) return todas.value
  const q = filtro.value.trim().toLowerCase()
  return todas.value.filter(o => String(o.label).toLowerCase().includes(q))
})

const seleccionada = computed(() => todas.value.find(o => o.value === valorActual.value) || null)
const textoActual = computed(() => seleccionada.value?.label ?? (valorActual.value === '' || valorActual.value == null ? props.placeholder : String(valorActual.value)))
const hayValor = computed(() => valorActual.value !== '' && valorActual.value != null)

/* ── Posicionamiento ────────────────────────────────────────────────────── */
function calcular() {
  if (!trigger.value) return
  const r = trigger.value.getBoundingClientRect()
  const abajo = window.innerHeight - r.bottom
  const arriba = r.top
  const max = 360
  const flip = abajo < 240 && arriba > abajo
  pos.value = {
    top: flip ? r.top - 8 : r.bottom + 8,
    left: r.left,
    // Mínimo 200px de alto y 220px de ancho: la lista nunca se ve "reducida"
    width: Math.max(r.width, 220),
    maxHeight: Math.max(200, Math.min(max, flip ? arriba - 20 : abajo - 20)),
    arriba: flip,
  }
}

async function abrir() {
  if (props.disabled || abierto.value) return
  abierto.value = true
  filtro.value = ''
  activo.value = Math.max(0, todas.value.findIndex(o => o.value === valorActual.value))
  await nextTick()
  calcular()
  ensureVisible()
  document.addEventListener('mousedown', alClicFuera, true)
  document.addEventListener('keydown', alTecladoGlobal, true)
}

function cerrar() {
  if (!abierto.value) return
  abierto.value = false
  document.removeEventListener('mousedown', alClicFuera, true)
  document.removeEventListener('keydown', alTecladoGlobal, true)
}

function alternar() { abierto.value ? cerrar() : abrir() }

function alClicFuera(e) {
  const t = trigger.value
  const l = lista.value
  if (t?.contains(e.target) || l?.contains(e.target)) return
  cerrar()
}

function ensureVisible() {
  const el = lista.value?.querySelector('.sf__option.is-active')
  el?.scrollIntoView({ block: 'nearest' })
}

/* ── Selección ──────────────────────────────────────────────────────────── */
function seleccionar(o) {
  if (o.disabled) return
  if (props.modelValue !== undefined) emit('update:modelValue', o.value)
  emit('change', o.value)
  cerrar()
  trigger.value?.focus()
}

/* ── Teclado ────────────────────────────────────────────────────────────── */
function mover(delta) {
  if (!opciones.value.length) return
  let i = activo.value
  for (let n = 0; n < opciones.value.length; n++) {
    i = (i + delta + opciones.value.length) % opciones.value.length
    if (!opciones.value[i].disabled) break
  }
  activo.value = i
  ensureVisible()
}

function alTecladoGlobal(e) {
  if (!abierto.value) return
  if (e.key === 'Escape') { e.preventDefault(); cerrar(); trigger.value?.focus() }
  else if (e.key === 'Tab') cerrar()
}

function onTriggerKey(e) {
  if (props.disabled) return
  if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault()
    if (!abierto.value) { abrir(); if (e.key === 'ArrowUp') activo.value = opciones.value.length - 1 }
    else if (e.key === 'ArrowDown') mover(1)
    else if (e.key === 'ArrowUp') mover(-1)
  } else if (e.key === 'Escape') cerrar()
}

function onPanelKey(e) {
  if (e.key === 'ArrowDown') { e.preventDefault(); mover(1) }
  else if (e.key === 'ArrowUp') { e.preventDefault(); mover(-1) }
  else if (e.key === 'Home') { e.preventDefault(); activo.value = 0; ensureVisible() }
  else if (e.key === 'End') { e.preventDefault(); activo.value = opciones.value.length - 1; ensureVisible() }
  else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    if (opciones.value[activo.value]) seleccionar(opciones.value[activo.value])
  }
}

function onBuscadorKey(e) {
  if (e.key === 'ArrowDown') { e.preventDefault(); mover(1) }
  else if (e.key === 'ArrowUp') { e.preventDefault(); mover(-1) }
  else if (e.key === 'Enter') {
    e.preventDefault()
    if (opciones.value[activo.value]) seleccionar(opciones.value[activo.value])
  } else if (e.key === 'Escape') { e.preventDefault(); cerrar(); trigger.value?.focus() }
}

/* ── Mantener la posición al hacer scroll o redimensionar ───────────────── */
function realinear() { if (abierto.value) calcular() }
onMounted(() => {
  window.addEventListener('scroll', realinear, true)
  window.addEventListener('resize', realinear)
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', realinear, true)
  window.removeEventListener('resize', realinear)
  document.removeEventListener('mousedown', alClicFuera, true)
  document.removeEventListener('keydown', alTecladoGlobal, true)
})

watch(() => props.modelValue, () => { if (!abierto.value) activo.value = todas.value.findIndex(o => o.value === props.modelValue) })
</script>

<template>
  <div class="sf" :class="[`sf--${size}`, { 'is-open': abierto, 'is-disabled': disabled, 'sf--flush': flush }]">
    <button
      ref="trigger"
      type="button"
      class="sf__trigger"
      :id="id"
      :disabled="disabled"
      role="combobox"
      aria-haspopup="listbox"
      :aria-expanded="abierto"
      :aria-controls="id ? `${id}-list` : undefined"
      :aria-label="ariaLabel"
      @click="alternar"
      @keydown="onTriggerKey"
    >
      <span class="sf__value" :class="{ 'is-placeholder': !hayValor }">{{ textoActual }}</span>
      <svg class="sf__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
    </button>

    <Teleport to="body">
      <Transition name="sf">
        <div
          v-if="abierto"
          ref="lista"
          class="sf__panel"
          :style="{
            top: pos.top + 'px',
            left: pos.left + 'px',
            width: pos.width + 'px',
            maxHeight: pos.maxHeight + 'px',
            transform: pos.arriba ? 'translateY(-100%)' : 'none',
          }"
          role="listbox"
          :id="id ? `${id}-list` : undefined"
          @keydown="onPanelKey"
        >
          <div v-if="searchable" class="sf__search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
            <input v-model="filtro" class="sf__search-input" type="text" placeholder="Buscar…" @keydown="onBuscadorKey" />
          </div>

          <button
            v-for="(o, i) in opciones"
            :key="String(o.value ?? i)"
            type="button"
            class="sf__option"
            :class="{ 'is-selected': o.value === valorActual, 'is-active': i === activo, 'is-disabled': o.disabled }"
            role="option"
            :aria-selected="o.value === valorActual"
            :disabled="o.disabled"
            @mouseenter="activo = i"
            @click="seleccionar(o)"
          >
            <span class="sf__option-text">{{ o.label }}</span>
            <svg v-if="o.value === valorActual" class="sf__check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5" /></svg>
          </button>

          <p v-if="!opciones.length" class="sf__empty">Sin opciones</p>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.sf { position: relative; min-width: 0; width: 100%; }

.sf__trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  height: 48px;
  padding: 0 14px;
  border: 1px solid transparent;
  border-radius: 10px;
  background: var(--input-bg);
  color: var(--text);
  font-size: 15px;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition: background .2s ease, border-color .2s ease, box-shadow .2s ease;
}
.sf--sm .sf__trigger { height: 34px; font-size: 13px; padding: 0 10px; border-radius: 8px; width: auto; }
.sf__trigger:hover:not(:disabled) { background: var(--input-bg-hover); }

/* Un único indicador de foco: borde + halo (nunca doble) */
.sf.is-open .sf__trigger,
.sf__trigger:focus-visible {
  background: var(--input-focus-bg);
  border-color: rgba(251, 146, 60, .45);
  box-shadow: 0 0 0 3px rgba(251, 146, 60, .16);
  outline: none;
}
.sf__trigger:disabled { opacity: .55; cursor: not-allowed; }

/* Modo flush: el contenedor padre pone el borde/fondo/chevron → aquí no se duplica */
.sf--flush .sf__trigger {
  border-color: transparent;
  background: transparent;
  padding: 0 2px 0 0;
  height: 100%;
  min-height: 26px;
  width: 100%;
}
.sf--flush.is-open .sf__trigger,
.sf--flush .sf__trigger:focus-visible {
  background: transparent;
  border-color: transparent;
  box-shadow: none;
}
.sf--flush .sf__value { font-size: inherit; }

.sf__value { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sf__value.is-placeholder { color: var(--muted); }
.sf__chevron { width: 16px; height: 16px; color: var(--muted); flex-shrink: 0; transition: transform .2s ease; }
.sf.is-open .sf__chevron { transform: rotate(180deg); color: var(--brand-primary); }

/* ── Panel ──────────────────────────────────────────────────────────────── */
.sf__panel {
  position: fixed;
  z-index: 300;
  padding: 6px;
  min-width: 220px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
  overflow-y: auto;
  overscroll-behavior: contain;
}

.sf__option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--text-soft);
  font-size: 14.5px;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition: background .12s ease, color .12s ease;
}
.sf__option:hover:not(.is-disabled),
.sf__option.is-active:not(.is-disabled) { background: var(--brand-primary-soft); color: var(--brand-ink); }
.sf__option.is-selected { color: var(--brand-ink); font-weight: 600; }
.sf__option.is-disabled { opacity: .45; cursor: not-allowed; }
.sf__option-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sf__check { width: 15px; height: 15px; flex-shrink: 0; color: var(--brand-primary); }

.sf__search {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 10px; margin-bottom: 4px;
  border-radius: 8px; background: var(--input-bg);
}
.sf__search svg { width: 15px; height: 15px; color: var(--muted); flex-shrink: 0; }
.sf__search-input { flex: 1; min-width: 0; border: none; background: transparent; outline: none; font-size: 13.5px; color: var(--text); font-family: inherit; }

.sf__empty { margin: 0; padding: 14px 12px; text-align: center; font-size: 13px; color: var(--muted); }

/* Apertura */
.sf-enter-active, .sf-leave-active { transition: opacity .14s ease, transform .14s ease; }
.sf-enter-from, .sf-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
