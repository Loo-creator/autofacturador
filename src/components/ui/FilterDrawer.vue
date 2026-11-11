<script setup>
import { reactive, ref, computed, watch } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'apply', 'clear'])

const applying = ref(false)

const defaultFilters = () => ({
  uuid: '',
  operacion: '',
  llavePago: '',
  estatus: 'Todos',
  tipo: 'Todos',
  fechaDesde: '',
  fechaHasta: '',
  montoMin: 0,
  montoMax: 50000
})

const filters = reactive(defaultFilters())

const estatusOptions = ['Todos', 'Vigente', 'Cancelado', 'Pendiente', 'En Proceso de Cancelación']
const tipoOptions = ['Todos', 'Ingreso (I)', 'Egreso (E)', 'Traslado (T)', 'Pago (P)', 'Nómina (N)']

const MIN_LIMIT = 0
const MAX_LIMIT = 100000
const STEP = 500

const rangeStyle = computed(() => {
  const min = Math.min(filters.montoMin, filters.montoMax)
  const max = Math.max(filters.montoMin, filters.montoMax)
  const start = ((min - MIN_LIMIT) / (MAX_LIMIT - MIN_LIMIT)) * 100
  const end = ((max - MIN_LIMIT) / (MAX_LIMIT - MIN_LIMIT)) * 100
  return {
    background: `linear-gradient(to right, var(--border-strong) ${start}%, var(--brand-primary) ${start}%, var(--accent-purple) ${end}%, var(--border-strong) ${end}%)`
  }
})

function formatMoney(v) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(v)
}

function onMinInput(e) {
  const val = Number(e.target.value)
  filters.montoMin = Math.min(val, filters.montoMax)
}
function onMaxInput(e) {
  const val = Number(e.target.value)
  filters.montoMax = Math.max(val, filters.montoMin)
}

function selectEstatus(opt) { filters.estatus = opt }
function selectTipo(opt) { filters.tipo = opt }

function resetFilters() {
  Object.assign(filters, defaultFilters())
}

function onClear() {
  resetFilters()
  emit('clear')
}

function onApply() {
  if (applying.value) return
  applying.value = true
  const payload = { ...filters }
  setTimeout(() => {
    applying.value = false
    emit('apply', payload)
    emit('close')
  }, 800)
}

function onClose() {
  if (applying.value) return
  emit('close')
}

watch(() => props.open, (val) => {
  if (val) document.body.style.overflow = 'hidden'
  else document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer-fade">
      <div v-if="open" class="drawer-overlay" @click="onClose" aria-hidden="true"></div>
    </Transition>

    <Transition name="drawer-slide">
      <aside
        v-if="open"
        class="filter-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        <header class="drawer-header">
          <div class="header-text">
            <h2 id="drawer-title" class="drawer-title">Filtrado Avanzado</h2>
            <p class="drawer-subtitle">Refina tu búsqueda de CFDI</p>
          </div>
          <button class="close-btn" type="button" aria-label="Cerrar panel de filtros" @click="onClose">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div class="drawer-body">
          <section class="section stagger-item" style="--i:0">
            <h3 class="section-title">Identificadores Fiscales</h3>
            <div class="fields">
              <div class="field stagger-item" style="--i:1">
                <label class="label" for="f-uuid">UUID</label>
                <div class="input-glass-wrap">
                  <span class="input-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M12 11a4 4 0 100-8 4 4 0 000 8z" />
                      <path d="M5 20a7 7 0 0114 0" />
                      <path d="M3 12h2m14 0h2M12 21v-2" />
                    </svg>
                  </span>
                  <input id="f-uuid" v-model="filters.uuid" type="text" class="input-glass has-icon" placeholder="Ej. A1B2C3D4-..." />
                </div>
              </div>
              <div class="field stagger-item" style="--i:2">
                <label class="label" for="f-op">No. Operación</label>
                <input id="f-op" v-model="filters.operacion" type="text" class="input-glass" placeholder="Ej. OP-2024-001" />
              </div>
              <div class="field stagger-item" style="--i:3">
                <label class="label" for="f-llave">Llave de Pago</label>
                <input id="f-llave" v-model="filters.llavePago" type="text" class="input-glass" placeholder="Ej. LLAVE-123" />
              </div>
            </div>
          </section>

          <section class="section stagger-item" style="--i:4">
            <h3 class="section-title">Estatus CFDI</h3>
            <div class="pill-group" role="group" aria-label="Estatus CFDI">
              <button
                v-for="(opt, idx) in estatusOptions"
                :key="opt"
                type="button"
                class="pill stagger-item"
                :class="{ active: filters.estatus === opt }"
                :style="{ '--i': 5 + idx }"
                :aria-pressed="filters.estatus === opt"
                @click="selectEstatus(opt)"
              >
                <span class="pill-check" aria-hidden="true">✓</span>
                <span>{{ opt }}</span>
              </button>
            </div>
          </section>

          <section class="section stagger-item" style="--i:10">
            <h3 class="section-title">Tipo de CFDI</h3>
            <div class="pill-group" role="group" aria-label="Tipo de CFDI">
              <button
                v-for="(opt, idx) in tipoOptions"
                :key="opt"
                type="button"
                class="pill stagger-item"
                :class="{ active: filters.tipo === opt }"
                :style="{ '--i': 11 + idx }"
                :aria-pressed="filters.tipo === opt"
                @click="selectTipo(opt)"
              >
                <span class="pill-check" aria-hidden="true">✓</span>
                <span>{{ opt }}</span>
              </button>
            </div>
          </section>

          <section class="section stagger-item" style="--i:17">
            <h3 class="section-title">Fecha de Emisión</h3>
            <div class="date-grid">
              <div class="field stagger-item" style="--i:18">
                <label class="label" for="f-desde">Desde</label>
                <input id="f-desde" v-model="filters.fechaDesde" type="date" class="input-glass" />
              </div>
              <div class="field stagger-item" style="--i:19">
                <label class="label" for="f-hasta">Hasta</label>
                <input id="f-hasta" v-model="filters.fechaHasta" type="date" class="input-glass" />
              </div>
            </div>
          </section>

          <section class="section stagger-item" style="--i:20">
            <h3 class="section-title">Monto Total</h3>
            <div class="amount-values" aria-live="polite">
              <span>{{ formatMoney(Math.min(filters.montoMin, filters.montoMax)) }}</span>
              <span class="amount-sep">—</span>
              <span>{{ formatMoney(Math.max(filters.montoMin, filters.montoMax)) }}</span>
            </div>
            <div class="dual-slider stagger-item" style="--i:21">
              <div class="slider-track" :style="rangeStyle"></div>
              <input
                type="range"
                class="range"
                :min="MIN_LIMIT"
                :max="MAX_LIMIT"
                :step="STEP"
                :value="filters.montoMin"
                aria-label="Monto mínimo"
                @input="onMinInput"
              />
              <input
                type="range"
                class="range"
                :min="MIN_LIMIT"
                :max="MAX_LIMIT"
                :step="STEP"
                :value="filters.montoMax"
                aria-label="Monto máximo"
                @input="onMaxInput"
              />
            </div>
          </section>
        </div>

        <footer class="drawer-footer">
          <button type="button" class="btn btn-clear" @click="onClear" :disabled="applying">Limpiar</button>
          <button type="button" class="btn btn-apply" @click="onApply" :disabled="applying">
            <span class="btn-content" :class="{ hidden: applying }">Aplicar Filtros</span>
            <span v-if="applying" class="spinner-wrap" aria-label="Aplicando filtros">
              <svg class="spinner" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle class="spinner-track" cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3" />
                <path class="spinner-head" d="M21 12a9 9 0 00-9-9" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
              </svg>
            </span>
          </button>
        </footer>
      </aside>
    </Transition>
  </Teleport>
</template>

<style scoped>
.filter-drawer,
.filter-drawer * {
  box-sizing: border-box;
  font-family: 'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif;
}

.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: var(--blur-soft);
  -webkit-backdrop-filter: var(--blur-soft);
  z-index: 1000;
}

.filter-drawer {
  position: fixed;
  top: 0;
  right: 0;
  height: 100%;
  width: 420px;
  max-width: 100%;
  background: var(--glass-panel-strong);
  backdrop-filter: var(--blur-glass);
  -webkit-backdrop-filter: var(--blur-glass);
  border-left: 1px solid var(--glass-line);
  box-shadow: -20px 0 40px rgba(0, 0, 0, 0.08);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  color: var(--text);
}

.drawer-header {
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 24px 18px;
  border-bottom: 1px solid var(--border);
  background: var(--surface-2);
}
.drawer-title {
  margin: 0;
  font-size: 21px;
  font-weight: 700;
  color: var(--text);
  line-height: 1.2;
}
.drawer-subtitle {
  margin: 4px 0 0;
  font-size: 14px;
  color: var(--muted);
}
.close-btn {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: var(--muted-2);
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.3s ease, color 0.2s ease, background 0.2s ease;
}
.close-btn svg { width: 24px; height: 24px; }
.close-btn:hover {
  transform: rotate(90deg);
  color: var(--danger);
  background: var(--danger-soft);
}

.drawer-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 20px 24px 24px;
  scrollbar-width: thin;
  scrollbar-color: rgba(251, 146, 60, 0.38) transparent;
}
.drawer-body::-webkit-scrollbar { width: 6px; }
.drawer-body::-webkit-scrollbar-track { background: transparent; }
.drawer-body::-webkit-scrollbar-thumb {
  background: var(--border-strong);
  border-radius: 999px;
}
.drawer-body::-webkit-scrollbar-thumb:hover { background: var(--muted-2); }

.section { margin-bottom: 24px; }
.section:last-child { margin-bottom: 8px; }
.section-title {
  margin: 0 0 12px;
  font-size: 13px;
  font-weight: 600;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.fields { display: flex; flex-direction: column; gap: 12px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.label { font-size: 14px; font-weight: 500; color: var(--text-soft); }

.input-glass-wrap { position: relative; }
.input-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--muted-2);
  display: inline-flex;
  pointer-events: none;
}
.input-icon svg { width: 18px; height: 18px; }

.input-glass {
  width: 100%;
  padding: 12px 14px;
  background: var(--input-bg);
  border: 1px solid var(--control-border);
  border-radius: 10px;
  font-size: 15px;
  color: var(--text);
  outline: none;
  transition: box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease;
}
.input-glass.has-icon { padding-left: 40px; }
.input-glass::placeholder { color: var(--muted-2); }
.input-glass:focus {
  background: var(--input-focus-bg);
  border-color: rgba(251, 146, 60, 0.38);
  box-shadow: 0 0 0 4px rgba(251, 146, 60, 0.16);
}

.pill-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.pill {
  display: inline-flex;
  align-items: center;
  gap: 0;
  padding: 8px 15px;
  border-radius: 999px;
  border: 1px solid var(--control-border);
  background: var(--control-bg);
  color: var(--muted);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}
.pill:hover { border-color: var(--border-strong); color: var(--text-soft); }
.pill.active {
  background: var(--brand-primary-soft);
  border-color: var(--brand-primary);
  color: var(--brand-ink);
  font-weight: 600;
}
.pill-check {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 0;
  opacity: 0;
  transform: scale(0.4);
  overflow: hidden;
  transition: width 0.2s ease, opacity 0.2s ease, transform 0.2s ease, margin 0.2s ease;
  font-size: 12px;
  margin-right: 0;
}
.pill.active .pill-check {
  width: 14px;
  opacity: 1;
  transform: scale(1);
  margin-right: 6px;
}

.date-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.amount-values {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 12px;
}
.amount-sep { color: var(--muted-2); font-weight: 500; }

.dual-slider {
  position: relative;
  height: 28px;
  display: flex;
  align-items: center;
}
.slider-track {
  position: absolute;
  left: 0;
  right: 0;
  height: 6px;
  border-radius: 999px;
}
.range {
  position: absolute;
  left: 0;
  width: 100%;
  height: 6px;
  margin: 0;
  background: transparent;
  pointer-events: none;
  -webkit-appearance: none;
  appearance: none;
}
.range::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  pointer-events: auto;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--control-bg);
  border: 2px solid var(--brand-primary);
  box-shadow: 0 2px 6px rgba(251, 146, 60, 0.38);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.range::-webkit-slider-thumb:hover {
  transform: scale(1.08);
  box-shadow: 0 3px 10px rgba(251, 146, 60, 0.48);
}
.range::-moz-range-thumb {
  pointer-events: auto;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--control-bg);
  border: 2px solid var(--brand-primary);
  box-shadow: 0 2px 6px rgba(251, 146, 60, 0.38);
  cursor: pointer;
}
.range::-webkit-slider-runnable-track { background: transparent; height: 6px; }
.range::-moz-range-track { background: transparent; height: 6px; }

.drawer-footer {
  flex-shrink: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  padding: 16px 24px;
  background: var(--surface-2);
  backdrop-filter: var(--blur-soft);
  -webkit-backdrop-filter: var(--blur-soft);
  border-top: 1px solid var(--border);
}

.btn {
  position: relative;
  height: 44px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.btn:disabled { opacity: 0.8; cursor: not-allowed; }

.btn-clear {
  background: transparent;
  border: 1px solid var(--control-border);
  color: var(--muted);
}
.btn-clear:hover:not(:disabled) {
  background: var(--bg-subtle);
  color: var(--text);
}
.btn-clear:active:not(:disabled) { transform: scale(0.98); }

.btn-apply {
  background: var(--brand-primary);
  border: none;
  color: #fff;
}
.btn-apply::after {
  content: "";
  position: absolute;
  top: 0;
  left: -120%;
  width: 60%;
  height: 100%;
  background: linear-gradient(120deg, transparent, rgba(255,255,255,0.45), transparent);
  transform: skewX(-20deg);
  transition: none;
}
.btn-apply:hover:not(:disabled) {
  box-shadow: 0 0 20px rgba(251, 146, 60, 0.44);
}
.btn-apply { color: var(--accent-contrast); }
.btn-apply:hover:not(:disabled)::after {
  left: 140%;
  transition: left 0.5s ease;
}
.btn-apply:active:not(:disabled) { transform: scale(0.98); }

.btn-content.hidden { visibility: hidden; }
.spinner-wrap {
  position: absolute;
  inset: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.spinner { width: 20px; height: 20px; animation: spin 0.8s linear infinite; }
.spinner-track { opacity: 0.35; }
.spinner-head { opacity: 1; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Drawer transitions */
.drawer-fade-enter-active, .drawer-fade-leave-active { transition: opacity 0.3s ease; }
.drawer-fade-enter-from, .drawer-fade-leave-to { opacity: 0; }

.drawer-slide-enter-active { transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.drawer-slide-leave-active { transition: transform 0.3s ease; }
.drawer-slide-enter-from, .drawer-slide-leave-to { transform: translateX(100%); }

/* Staggered fade-in-up */
.stagger-item {
  opacity: 0;
  animation: fade-in-up 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: calc(var(--i, 0) * 30ms);
}
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 640px) {
  .filter-drawer { width: 100%; border-left: none; }
  .date-grid { grid-template-columns: 1fr; }
  .drawer-header, .drawer-body, .drawer-footer { padding-left: 16px; padding-right: 16px; }
}
</style>
