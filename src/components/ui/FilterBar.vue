<script setup>
/**
 * Barra de filtros full-width (estilo panel de control).
 *
 * - Una sola barra horizontal que ocupa TODO el ancho del contenido, alineada
 *   con la tabla/cards de abajo.
 * - Glassmorphism: fondo translúcido + backdrop-filter + borde luminoso.
 * - Inputs "outlined con label arriba": contenedor blanco con borde, label de 12px
 *   encima y el input real sin borde dentro.
 * - Layout con CSS Grid y **Container Queries**: la barra reacciona al ancho REAL
 *   del contenido, no al de la ventana. Al colapsar el sidebar, el contenedor crece
 *   y la barra vuelve a una sola fila automáticamente.
 */
import { computed } from 'vue'
import SelectField from '@/components/ui/SelectField.vue'

const props = defineProps({
  search: { type: String, default: '' },
  tipo: { type: String, default: '' },
  estatus: { type: String, default: '' },
  desde: { type: String, default: '' },
  hasta: { type: String, default: '' },
  monto: { type: String, default: '' },
  tipos: { type: Array, default: () => [] },       // [{ value, label }]
  estatuses: { type: Array, default: () => [] },    // [{ value, label }]
  montos: { type: Array, default: () => [] },      // [{ value, label }]
  placeholder: { type: String, default: 'Buscar por folio, receptor o UUID...' },
  searchLabel: { type: String, default: 'Búsqueda' },
  tipoLabel: { type: String, default: 'Tipo de CFDI' },
  estatusLabel: { type: String, default: 'Estatus' },
  fechaLabel: { type: String, default: 'Rango de fechas' },
  montoLabel: { type: String, default: 'Monto' },
  // Permite ocultar campos que una vista concreta no necesite.
  showTipo: { type: Boolean, default: true },
  showEstatus: { type: Boolean, default: true },
  showFechas: { type: Boolean, default: true },
  showMonto: { type: Boolean, default: true },
  loading: { type: Boolean, default: false },
  total: { type: Number, default: 0 },
  shown: { type: Number, default: 0 },
  showSearchButton: { type: Boolean, default: true }
})

const emit = defineEmits([
  'update:search', 'update:tipo', 'update:estatus', 'update:desde',
  'update:hasta', 'update:monto', 'search', 'reset',
])

const searchModel = computed({
  get: () => props.search,
  set: (v) => emit('update:search', v),
})

function onEnter(e) {
  if (e.key === 'Enter') emit('search')
}

const hayFiltros = computed(() =>
  Boolean(props.search || props.tipo || props.estatus || props.desde || props.hasta || props.monto)
)

/** La rejilla se adapta a los campos visibles (si una vista oculta un campo, no queda hueco). */
const gridTemplate = computed(() => {
  const cols = ['2fr']
  if (props.showTipo) cols.push('1fr')
  if (props.showEstatus) cols.push('1fr')
  if (props.showFechas) cols.push('2fr')
  if (props.showMonto) cols.push('1fr')
  cols.push('auto')
  return cols.join(' ')
})
</script>

<template>
  <section class="fb" aria-label="Filtros de búsqueda">
    <div class="fb__grid" :style="{ '--fb-cols': gridTemplate }">
      <!-- Búsqueda / UUID -->
      <div class="fb-field fb-field--search">
        <label class="fb-label" for="fb-search">{{ searchLabel }}</label>
        <div class="fb-control">
          <svg class="fb-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            id="fb-search"
            v-model="searchModel"
            class="fb-input"
            type="search"
            :placeholder="placeholder"
            @keyup="onEnter"
          />
        </div>
      </div>

      <!-- Tipo (CFDI / Forma de pago / Establecimiento, según la vista) -->
      <div v-if="showTipo" class="fb-field">
        <label class="fb-label" for="fb-tipo">{{ tipoLabel }}</label>
        <div class="fb-control">
          <SelectField id="fb-tipo" size="sm" flush :value="tipo" @change="emit('update:tipo', $event)">
            <option value="">Todos</option>
            <option v-for="t in tipos" :key="t.value" :value="t.value">{{ t.label }}</option>
          </SelectField>
        </div>
      </div>

      <!-- Estatus -->
      <div v-if="showEstatus" class="fb-field">
        <label class="fb-label" for="fb-estatus">{{ estatusLabel }}</label>
        <div class="fb-control">
          <SelectField id="fb-estatus" size="sm" flush :value="estatus" @change="emit('update:estatus', $event)">
            <option value="">Todos</option>
            <option v-for="s in estatuses" :key="s.value" :value="s.value">{{ s.label }}</option>
          </SelectField>
        </div>
      </div>

      <!-- Rango de fechas -->
      <div v-if="showFechas" class="fb-field fb-field--fecha">
        <span class="fb-label">{{ fechaLabel }}</span>
        <div class="fb-control fb-control--range">
          <input class="fb-input fb-date" type="date" :value="desde" @input="emit('update:desde', $event.target.value)" />
          <span class="fb-sep" aria-hidden="true">—</span>
          <input class="fb-input fb-date" type="date" :value="hasta" @input="emit('update:hasta', $event.target.value)" />
        </div>
      </div>

      <!-- Monto -->
      <div v-if="showMonto" class="fb-field">
        <label class="fb-label" for="fb-monto">{{ montoLabel }}</label>
        <div class="fb-control">
          <SelectField id="fb-monto" size="sm" flush :value="monto" @change="emit('update:monto', $event)">
            <option value="">Cualquier monto</option>
            <option v-for="m in montos" :key="m.value" :value="m.value">{{ m.label }}</option>
          </SelectField>
        </div>
      </div>

      <!-- Acciones -->
      <div class="fb-actions">
        <button v-if="showSearchButton" type="button" class="fb-submit" :disabled="loading" @click="emit('search')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
            <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" />
          </svg>
          <span>{{ loading ? 'Buscando…' : 'Buscar' }}</span>
        </button>
      </div>
    </div>

    <!-- Fila secondary: chips activos + acciones extra + contador -->
    <div class="fb__foot">
      <div class="fb__foot-left">
        <button v-if="hayFiltros" type="button" class="fb-clear" @click="emit('reset')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12" /></svg>
          Limpiar
        </button>
        <slot name="extra" />
      </div>
      <p class="fb__count" aria-live="polite">
        <template v-if="total">Mostrando <strong>{{ shown }}</strong> de <strong>{{ total }}</strong> resultados</template>
        <template v-else>Sin resultados</template>
      </p>
    </div>
  </section>
</template>

<style scoped>
.fb {
  /* Container query: la barra se adapta al ancho real del contenido */
  container-type: inline-size;
  container-name: filterbar;

  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 24px;
  background: var(--glass-bg);
  backdrop-filter: var(--blur-soft);
  -webkit-backdrop-filter: var(--blur-soft);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  box-shadow: var(--glass-shadow, 0 4px 20px rgba(0, 0, 0, .03));
  font-family: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif;
  transition: background-color .35s ease, border-color .35s ease;
}

.fb__grid {
  display: grid;
  grid-template-columns: var(--fb-cols, 2fr 1fr 1fr 2fr 1fr auto);
  gap: 16px;
  align-items: end;
}

.fb-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.fb-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--muted);
  letter-spacing: .01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.fb-control {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: text;
  height: var(--field-h, 48px);
  padding: 0 14px;
  background: var(--control-bg);
  border: 1px solid var(--control-border);
  border-radius: 10px;
  transition: border-color .2s ease, box-shadow .2s ease, background-color .35s ease, color .35s ease;
}
.fb-control:hover { border-color: var(--border-strong); }
.fb-control:focus-within {
  border-color: var(--brand-primary);
  box-shadow: 0 0 0 4px rgba(251, 146, 60, .16);
}
/* El contenedor (.fb-control) ya dibuja el indicador de foco:
   si el input lo repitiera se vería un "doble borde" (halo + borde). */
.fb-input:focus,
.fb-input:focus-visible {
  outline: none !important;
  box-shadow: none !important;
  border-color: transparent !important;
}

/* El icono es decorativo: el clic debe llegar al input */
.fb-icon { width: 18px; height: 18px; color: var(--muted-2); pointer-events: none; flex-shrink: 0; }

.fb-input {
  flex: 1;
  min-width: 0;
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  background: transparent;
  font-size: 15px;
  color: var(--text);
  font-family: inherit;
}
.fb-input::placeholder { color: var(--muted-2); }
.fb-input[type='search']::-webkit-search-cancel-button { cursor: pointer; }

.fb-control--range { gap: 6px; padding: 0 10px; }
.fb-date { font-size: 13px; }
.fb-sep { color: var(--muted-2); font-size: 12px; flex-shrink: 0; }

.fb-actions { display: flex; align-items: center; gap: 8px; }
.fb-submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: var(--field-h, 48px);
  padding: 0 32px;
  border: none;
  border-radius: 10px;
  background: var(--brand-primary);
  color: var(--accent-contrast);
  font-size: 15px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  transition: background .2s ease, box-shadow .25s ease, transform .15s ease;
}
.fb-submit svg { width: 17px; height: 17px; }
.fb-submit:hover:not(:disabled) {
  background: var(--brand-primary-hover);
  box-shadow: 0 0 0 4px rgba(251, 146, 60, .16), 0 8px 18px rgba(251, 146, 60, .24);
}
.fb-submit:active:not(:disabled) { transform: scale(.98); }
.fb-submit:disabled { opacity: .55; cursor: not-allowed; }

.fb__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding-top: 12px;
  border-top: 1px solid rgba(17, 24, 39, .06);
}
.fb__foot-left { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.fb__count { margin: 0; font-size: 14px; color: var(--muted); }
.fb__count strong { color: var(--text); font-weight: 600; }

.fb-clear {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 13px;
  border: 1px solid var(--control-border);
  border-radius: 8px;
  background: var(--control-bg);
  color: var(--muted);
  font-size: 12.5px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all .2s ease;
}
.fb-clear svg { width: 14px; height: 14px; }
.fb-clear:hover { border-color: var(--danger); color: var(--danger); background: var(--danger-soft); }

/* ── Tablet: 2 columnas ─────────────────────────────────────────────────── */
@container filterbar (max-width: 1120px) {
  .fb__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .fb-field--search { grid-column: span 2; }
  .fb-field--fecha { grid-column: span 2; }
  .fb-actions { grid-column: span 2; }
  .fb-actions .fb-submit { flex: 1; }
}

/* ── Móvil: 1 columna, controles táctiles ───────────────────────────────── */
@container filterbar (max-width: 620px) {
  .fb { padding: 14px 16px; border-radius: 14px; }
  .fb__grid { grid-template-columns: minmax(0, 1fr); gap: 12px; }
  .fb-field--search, .fb-field--fecha, .fb-actions { grid-column: span 1; }
  .fb-control { height: 46px; }
  .fb-submit { width: 100%; height: 46px; padding: 0 20px; }
  .fb__foot { align-items: flex-start; flex-direction: column; }
}
</style>
