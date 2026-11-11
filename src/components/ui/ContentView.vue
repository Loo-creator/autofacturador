<script setup>
/**
 * Contenedor de resultados: alterna entre vista de TABLA y vista de CARDS.
 *
 * - Tabla: 100% de ancho, `table-layout: auto` (las columnas se ajustan al contenido).
 * - Cards: CSS Grid `repeat(auto-fill, minmax(280px, 1fr))`, gap 24px, altura uniforme.
 * - En móvil la tabla se convierte automáticamente en cards apiladas (el UUID y el
 *   monto se muestran arriba en cada card).
 * - El selector Tabla/Tarjetas sólo aparece si `view="auto"`.
 */
import { ref, computed } from 'vue'
import DataTable from './DataTable.vue'
import { useMediaQuery } from '@/composables/useMediaQuery'

const props = defineProps({
  columns: { type: Array, required: true },
  rows: { type: Array, default: () => [] },
  rowKey: { type: String, default: 'id' },
  loading: { type: Boolean, default: false },
  skeletonRows: { type: Number, default: 5 },
  // 'auto' = deja elegir al usuario | 'table' | 'cards'
  view: { type: String, default: 'auto' },  emptyTitle: { type: String, default: 'No hay resultados' },
  emptySubtitle: { type: String, default: 'Intenta ajustar tu búsqueda o filtros.' },
  caption: { type: String, default: '' },
  // Configuración opcional de la card
  cardTitle: { type: [Function, String], default: null },
  cardSubtitle: { type: [Function, String], default: null },
  cardAmount: { type: [Function, String], default: null },
  cardIcon: { type: [Function, String], default: null },
  // Columnas que se muestran como metadatos en la card.
  // Si no se define, se derivan de las columnas por defecto (título/subtítulo/monto).
  cardMetaColumns: { type: Array, default: () => [] },
  cardActionLabel: { type: String, default: 'Ver detalle' }
})

const emit = defineEmits(['update:view', 'card-action'])

const isMobile = useMediaQuery('(max-width: 768px)')

/** Preferencia del usuario (persiste entre navegaciones). */
const userPref = ref(readPref())

function readPref() {
  try {
    const v = localStorage.getItem('ff_content_view')
    return v === 'cards' ? 'cards' : 'table'
  } catch { return 'table' }
}

const showSwitcher = computed(() => props.view === 'auto')

const effectiveView = computed(() => {
  // 'table' | 'cards' fuerzan un modo; 'auto' deja elegir al usuario.
  if (props.view === 'cards') return 'cards'
  if (props.view === 'table') return 'table'
  if (isMobile.value) return 'cards'
  return userPref.value
})

function setView(v) {
  userPref.value = v
  try { localStorage.setItem('ff_content_view', v) } catch { /* ignore */ }
  emit('update:view', v)
}

/** Columna que se usa como título de la card (la primera con texto). */
const titleColumn = computed(() => props.columns[0] || null)
const subtitleColumn = computed(() => props.columns[1] || null)
const amountColumn = computed(() => props.columns.find(c => c.align === 'right') || null)

function resolve(source, row, fallback) {
  if (!source) return fallback
  if (typeof source === 'function') return source(row)
  return row[source] ?? fallback
}

function cardTitle(row) {
  return resolve(props.cardTitle, row, titleColumn.value ? row[titleColumn.value.key] : '—')
}
function cardSubtitle(row) {
  return resolve(props.cardSubtitle, row, subtitleColumn.value ? row[subtitleColumn.value.key] : '—')
}
function cardAmount(row) {
  return resolve(props.cardAmount, row, amountColumn.value ? row[amountColumn.value.key] : '—')
}
function cardIcon(row) {
  return resolve(props.cardIcon, row, (cardTitle(row) || '?').toString().charAt(0))
}

/** Filas de metadatos de la card: todas las columnas salvo título, subtítulo y monto. */
function cardMeta(row) {
  const source = props.cardMetaColumns.length
    ? props.columns.filter(c => props.cardMetaColumns.includes(c.key))
    : props.columns.filter(c => ![titleColumn.value?.key, subtitleColumn.value?.key, amountColumn.value?.key].includes(c.key))
  return source
    .filter(c => c.label)
    .map(c => ({ key: c.key, label: c.label, value: row[c.key] }))
}
</script>

<template>
  <div class="cv">
    <div v-if="showSwitcher" class="cv__switcher" role="group" aria-label="Cambiar vista">
      <button
        type="button"
        class="cv__switch"
        :class="{ 'is-active': effectiveView === 'table' }"
        :aria-pressed="effectiveView === 'table'"
        @click="setView('table')"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="16" rx="2" /><path d="M3 10h18M9 10v10" />
        </svg>
        <span>Tabla</span>
      </button>
      <button
        type="button"
        class="cv__switch"
        :class="{ 'is-active': effectiveView === 'cards' }"
        :aria-pressed="effectiveView === 'cards'"
        @click="setView('cards')"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
          <rect x="3" y="4" width="7" height="7" rx="1.5" /><rect x="14" y="4" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="6" rx="1.5" /><rect x="14" y="14" width="7" height="6" rx="1.5" />
        </svg>
        <span>Tarjetas</span>
      </button>
    </div>

    <!-- ── Vista tabla ─────────────────────────────────────────────────── -->
    <DataTable
      v-if="effectiveView === 'table'"
      :columns="columns"
      :rows="rows"
      :row-key="rowKey"
      :loading="loading"
      :skeleton-rows="skeletonRows"
      :empty-title="emptyTitle"
      :empty-subtitle="emptySubtitle"
      :caption="caption"
    >
      <template v-for="col in columns" #[`cell-${col.key}`]="{ row, value, index }">
        <slot :name="`cell-${col.key}`" :row="row" :value="value" :index="index">
          {{ value ?? '—' }}
        </slot>
      </template>
      <template #emptyAction><slot name="emptyAction" /></template>
    </DataTable>

    <!-- ── Vista cards ─────────────────────────────────────────────────── -->
    <div v-else class="cv__cards">
      <template v-if="loading">
        <div v-for="n in skeletonRows" :key="`sk-${n}`" class="cv-card cv-card--skeleton" aria-hidden="true">
          <div class="cv-skeleton cv-skeleton--icon"></div>
          <div class="cv-skeleton cv-skeleton--title"></div>
          <div class="cv-skeleton cv-skeleton--line"></div>
          <div class="cv-skeleton cv-skeleton--amount"></div>
        </div>
      </template>

      <template v-else-if="rows.length">
        <article v-for="(row, i) in rows" :key="row[rowKey] ?? i" class="cv-card">
          <header class="cv-card__head">
            <span class="cv-card__icon" aria-hidden="true">{{ cardIcon(row) }}</span>
            <div class="cv-card__titles">
              <p class="cv-card__title" :title="String(cardTitle(row))">{{ cardTitle(row) }}</p>
              <p class="cv-card__subtitle" :title="String(cardSubtitle(row))">{{ cardSubtitle(row) }}</p>
            </div>
            <span class="cv-card__amount">{{ cardAmount(row) }}</span>
          </header>

          <dl class="cv-card__meta">
            <div v-for="m in cardMeta(row)" :key="m.key" class="cv-card__meta-row">
              <dt>{{ m.label }}</dt>
              <dd>
                <slot :name="`cell-${m.key}`" :row="row" :value="row[m.key]">{{ row[m.key] ?? '—' }}</slot>
              </dd>
            </div>
          </dl>

          <footer class="cv-card__foot">
            <slot name="card-actions" :row="row" :index="i">
              <button type="button" class="cv-card__btn" @click="emit('card-action', row)">
                {{ cardActionLabel }}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </button>
            </slot>
          </footer>
        </article>
      </template>

      <div v-else class="cv__empty">
        <p class="cv__empty-title">{{ emptyTitle }}</p>
        <p class="cv__empty-sub">{{ emptySubtitle }}</p>
        <div v-if="$slots.emptyAction" class="cv__empty-action"><slot name="emptyAction" /></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cv {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  min-width: 0;
}

/* ── Selector de vista ──────────────────────────────────────────────────── */
.cv__switcher {
  display: inline-flex;
  align-self: flex-end;
  gap: 2px;
  padding: 3px;
  background: var(--glass-panel);
  backdrop-filter: var(--blur-soft);
  -webkit-backdrop-filter: var(--blur-soft);
  border: 1px solid var(--glass-border);
  border-radius: 999px;
  box-shadow: var(--glass-shadow, 0 4px 20px rgba(0, 0, 0, .03));
}
.cv__switch {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 15px;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: var(--muted);
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all .2s ease;
}
.cv__switch svg { width: 15px; height: 15px; }
.cv__switch:hover { color: var(--brand-ink); }
.cv__switch.is-active {
  background: var(--brand-primary-soft);
  color: var(--brand-ink);
  box-shadow: 0 2px 6px rgba(251, 146, 60, .20);
}

/* ── Cards ──────────────────────────────────────────────────────────────── */
.cv__cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  width: 100%;
}

.cv-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 200px;
  padding: 18px;
  background: var(--glass-bg);
  backdrop-filter: var(--blur-soft);
  -webkit-backdrop-filter: var(--blur-soft);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  box-shadow: var(--glass-shadow, 0 4px 20px rgba(0, 0, 0, .03));
  transition: transform .22s cubic-bezier(.4, 0, .2, 1), box-shadow .22s ease,
              border-color .22s ease, background-color .35s ease;
}
.cv-card:hover {
  transform: translateY(-3px);
  border-color: rgba(251, 146, 60, .38);
  box-shadow: 0 14px 34px rgba(17, 24, 39, .09);
}

.cv-card__head {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
}
.cv-card__icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--brand-primary-soft);
  color: var(--brand-ink);
  font-weight: 700;
  font-size: 15px;
  text-transform: uppercase;
}
.cv-card__titles { min-width: 0; }
.cv-card__title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cv-card__subtitle {
  margin: 2px 0 0;
  font-size: 13px;
  color: var(--muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cv-card__amount {
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
  white-space: nowrap;
}

.cv-card__meta {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 7px;
  flex: 1;
}
.cv-card__meta-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  font-size: 13.5px;
  min-width: 0;
}
.cv-card__meta-row dt {
  color: var(--muted);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .04em;
  flex-shrink: 0;
}
.cv-card__meta-row dd {
  margin: 0;
  color: var(--text-soft);
  font-weight: 500;
  text-align: right;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cv-card__foot { margin-top: auto; }
.cv-card__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 40px;
  border: 1px solid var(--brand-primary);
  border-radius: 10px;
  background: transparent;
  color: var(--brand-primary);
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all .2s ease;
}
.cv-card__btn svg { width: 15px; height: 15px; transition: transform .2s ease; }
.cv-card__btn:hover { background: var(--brand-primary); color: var(--accent-contrast); box-shadow: 0 6px 16px rgba(251, 146, 60, .26); }
.cv-card__btn:hover svg { transform: translateX(3px); }

/* ── Skeleton ───────────────────────────────────────────────────────────── */
.cv-card--skeleton { pointer-events: none; }
.cv-skeleton {
  border-radius: 8px;
  background: linear-gradient(90deg, var(--control-border) 25%, var(--bg-subtle) 37%, var(--control-border) 63%);
  background-size: 400% 100%;
  animation: cv-shimmer 1.4s ease infinite;
}
.cv-skeleton--icon { width: 40px; height: 40px; border-radius: 12px; }
.cv-skeleton--title { width: 60%; height: 14px; }
.cv-skeleton--line { width: 100%; height: 11px; }
.cv-skeleton--amount { width: 40%; height: 18px; margin-top: auto; }
@keyframes cv-shimmer { 0% { background-position: 100% 0; } 100% { background-position: 0 0; } }

/* ── Estado vacío ───────────────────────────────────────────────────────── */
.cv__empty {
  grid-column: 1 / -1;
  min-height: 280px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-align: center;
  padding: 48px 24px;
  background: var(--glass-bg);
  backdrop-filter: var(--blur-soft);
  -webkit-backdrop-filter: var(--blur-soft);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
}
.cv__empty-title { margin: 0; font-size: 17px; font-weight: 700; color: var(--text); }
.cv__empty-sub { margin: 0; font-size: 15px; color: var(--muted); max-width: 440px; }
.cv__empty-action { margin-top: 12px; }

@media (max-width: 768px) {
  .cv__cards { grid-template-columns: minmax(0, 1fr); gap: 14px; }
  .cv__switcher { align-self: stretch; }
  .cv__switch { flex: 1; justify-content: center; }
}
</style>
