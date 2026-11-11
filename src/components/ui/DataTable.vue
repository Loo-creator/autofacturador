<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  columns: { type: Array, required: true },
  rows: { type: Array, default: () => [] },
  rowKey: { type: String, default: 'id' },
  loading: { type: Boolean, default: false },
  skeletonRows: { type: Number, default: 5 },
  expandable: { type: Boolean, default: false },
  emptyTitle: { type: String, default: 'No hay resultados' },
  emptySubtitle: { type: String, default: 'Intenta ajustar tu búsqueda o filtros.' },
  caption: { type: String, default: '' }
})

const expanded = ref(new Set())
const colCount = computed(() => props.columns.length || 1)

const statusMap = {
  vigente: { label: 'Vigente', cls: 'badge--vigente', dot: '#047857' },
  activa: { label: 'Vigente', cls: 'badge--vigente', dot: '#047857' },
  activo: { label: 'Vigente', cls: 'badge--vigente', dot: '#047857' },
  emitida: { label: 'Vigente', cls: 'badge--vigente', dot: '#047857' },
  cancelada: { label: 'Cancelada', cls: 'badge--cancelada', dot: '#B91C1C' },
  cancelado: { label: 'Cancelada', cls: 'badge--cancelada', dot: '#B91C1C' },
  pendiente: { label: 'Pendiente', cls: 'badge--pendiente', dot: '#B45309' },
  pendiente_cancelacion: { label: 'Pendiente', cls: 'badge--pendiente', dot: '#B45309' },
  borrador: { label: 'Pendiente', cls: 'badge--pendiente', dot: '#B45309' },
  procesando: { label: 'Pendiente', cls: 'badge--pendiente', dot: '#B45309' }
}

function badgeFor(value) {
  if (value == null) return null
  const key = String(value).toLowerCase()
  return statusMap[key] || null
}
function getRowKey(row, idx) { return row?.[props.rowKey] ?? idx }
function isExpanded(key) { return expanded.value.has(key) }
function toggleRow(key) {
  if (!props.expandable) return
  const next = new Set(expanded.value)
  next.has(key) ? next.delete(key) : next.add(key)
  expanded.value = next
}
</script>

<template>
  <div class="table-glass">
    <div class="table-scroll">
      <table class="data-table">
        <caption v-if="caption" class="sr-only">{{ caption }}</caption>
        <thead>
          <tr>
            <th v-for="col in columns" :key="col.key" scope="col" :style="{ textAlign: col.align || 'left', width: col.width || 'auto' }">
              {{ col.label }}
            </th>
          </tr>
        </thead>

        <tbody v-if="loading">
          <tr v-for="n in skeletonRows" :key="`sk-${n}`" class="skeleton-row" aria-hidden="true">
            <td v-for="col in columns" :key="col.key">
              <span class="skeleton" :style="{ width: col.skeletonWidth || (col.align === 'right' ? '55%' : '75%') }"></span>
            </td>
          </tr>
        </tbody>

        <tbody v-else-if="!rows.length">
          <tr class="empty-row">
            <td :colspan="colCount">
              <div class="empty-state">
                <div class="empty-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/><path d="M8 11h6"/>
                  </svg>
                </div>
                <p class="empty-title">{{ emptyTitle }}</p>
                <p class="empty-subtitle">{{ emptySubtitle }}</p>
                <div v-if="$slots.emptyAction" class="empty-action"><slot name="emptyAction"></slot></div>
              </div>
            </td>
          </tr>
        </tbody>

        <tbody v-else>
          <template v-for="(row, idx) in rows" :key="getRowKey(row, idx)">
            <tr
              class="data-row"
              :class="{ clickable: expandable, expanded: isExpanded(getRowKey(row, idx)) }"
              @click="toggleRow(getRowKey(row, idx))"
            >
              <td v-for="col in columns" :key="col.key" :style="{ textAlign: col.align || 'left' }">
                <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]" :index="idx" :expanded="isExpanded(getRowKey(row, idx))">
                  <template v-if="badgeFor(row[col.key])">
                    <span class="badge" :class="badgeFor(row[col.key]).cls">
                      <span class="badge-dot" :style="{ background: badgeFor(row[col.key]).dot }"></span>
                      {{ badgeFor(row[col.key]).label }}
                    </span>
                  </template>
                  <template v-else>
                    <span class="cell-text">{{ row[col.key] ?? '—' }}</span>
                  </template>
                </slot>
                <span v-if="expandable && col === columns[columns.length - 1]" class="quick-actions" @click.stop>
                  <slot name="rowActions" :row="row" :index="idx">
                    <button type="button" class="action-btn" aria-label="Acciones rápidas">
                      <svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>
                    </button>
                  </slot>
                </span>
              </td>
            </tr>
            <tr v-if="expandable" class="expand-row">
              <td :colspan="colCount">
                <div class="expand-wrap" :class="{ open: isExpanded(getRowKey(row, idx)) }">
                  <div class="expand-inner">
                    <div class="expand-panel">
                      <slot name="expanded" :row="row" :index="idx">
                        <div class="detail-grid">
                          <div class="detail-item"><span class="d-label">UUID</span><span class="d-value mono">{{ row.uuid || '—' }}</span></div>
                          <div class="detail-item"><span class="d-label">RFC Receptor</span><span class="d-value mono">{{ row.receptor?.rfc || row.rfc || '—' }}</span></div>
                          <div class="detail-item"><span class="d-label">Monto</span><span class="d-value">{{ row.total != null ? `$${Number(row.total).toLocaleString('es-MX', {minimumFractionDigits:2})}` : '—' }}</span></div>
                          <div class="detail-item"><span class="d-label">Comprobantes</span><span class="d-value"><span class="file-pill">XML</span> <span class="file-pill">PDF</span></span></div>
                        </div>
                      </slot>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.table-glass {
  width: 100%;
  background: var(--glass-panel);
  backdrop-filter: var(--blur-soft);
  -webkit-backdrop-filter: var(--blur-soft);
  border: 1px solid var(--glass-line);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(17, 24, 39, 0.06);
  overflow: hidden;
  font-family: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif;
  transition: background-color .35s ease, border-color .35s ease;
}
.table-scroll { width: 100%; overflow-x: auto; }
.data-table { width: 100%; border-collapse: separate; border-spacing: 0; table-layout: auto; min-width: 640px; }
.data-table th, .data-table td {
  padding: 18px 22px; border-bottom: 1px solid var(--border-soft);
  font-size: 15px; color: var(--text); vertical-align: middle; position: relative;
}
.data-table th {
  font-size: 13px; font-weight: 600; color: var(--muted);
  text-transform: uppercase; letter-spacing: .04em;
  background: var(--table-head-bg); white-space: nowrap;
}
.data-row { transition: background .15s ease; }
.data-row:hover { background: var(--row-hover); }
.data-row.clickable { cursor: pointer; }
.data-table tbody tr:last-child.data-row td { border-bottom: none; }

.quick-actions {
  position: absolute; right: 12px; top: 50%; transform: translateY(-50%) translateY(4px);
  opacity: 0; transition: opacity .18s ease, transform .18s ease; pointer-events: none;
}
.data-row:hover .quick-actions { opacity: 1; transform: translateY(-50%) translateY(0); pointer-events: auto; }
.action-btn {
  width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--control-border);
  background: var(--control-bg); color: var(--muted); display: inline-flex; align-items: center; justify-content: center;
  cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.06); transition: all .2s ease;
}
.action-btn:hover { color: var(--text); background: var(--control-hover-bg); }
.action-btn svg { width: 16px; height: 16px; }

.badge {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 5px 12px; border-radius: 999px; font-size: 13px; font-weight: 600; line-height: 1.4;
}
.badge-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.badge--vigente { background: var(--badge-success-bg); color: var(--badge-success-fg); }
.badge--cancelada { background: var(--badge-danger-bg); color: var(--badge-danger-fg); }
.badge--pendiente { background: var(--badge-warning-bg); color: var(--badge-warning-fg); }

.expand-row td { padding: 0; border-bottom: none; }
.expand-wrap { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .3s cubic-bezier(.4,0,.2,1); }
.expand-wrap.open { grid-template-rows: 1fr; border-bottom: 1px solid var(--border-soft); }
.expand-inner { overflow: hidden; }
.expand-panel {
  margin: 0 16px 16px; padding: 18px 20px;
  background: var(--bg-subtle); backdrop-filter: var(--blur-soft);
  border: 1px solid var(--glass-line); border-radius: 14px;
}
.detail-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px 20px; }
.detail-item { display: flex; flex-direction: column; gap: 4px; }
.d-label { font-size: 12px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: .05em; }
.d-value { font-size: 15px; color: var(--text); font-weight: 500; word-break: break-all; }
.mono { font-family: ui-monospace, monospace; font-size: 13px; }
.file-pill { display: inline-flex; padding: 3px 10px; border-radius: 999px; background: var(--brand-primary-soft); color: var(--brand-primary); font-size: 13px; font-weight: 600; margin-right: 6px; }

.skeleton-row td { padding: 20px 22px; }
.skeleton {
  display: inline-block; height: 14px; border-radius: 8px;
  background: linear-gradient(90deg, var(--bg-subtle) 25%, var(--surface-2) 37%, var(--bg-subtle) 63%);
  background-size: 400% 100%; animation: shimmer 1.4s ease infinite; max-width: 100%;
}
@keyframes shimmer { 0% { background-position: 100% 0; } 100% { background-position: 0 0; } }

.empty-row td { padding: 0; border-bottom: none; }
.empty-state { min-height: 340px; padding: 56px 24px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 8px; }
.empty-icon { width: 64px; height: 64px; color: var(--muted-2); margin-bottom: 4px; }
.empty-icon :deep(svg), .empty-icon svg { width: 64px; height: 64px; }
.empty-title { margin: 0; font-size: 17px; font-weight: 700; color: var(--text); }
.empty-subtitle { margin: 0; font-size: 15px; color: var(--muted); max-width: 440px; }
.empty-action { margin-top: 12px; }

.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }

@media (max-width: 768px) {
  .data-table { min-width: 560px; }
  .data-table th, .data-table td { padding: 14px 14px; }
  .quick-actions { position: static; transform: none; opacity: 1; pointer-events: auto; margin-left: 8px; }
}
</style>
