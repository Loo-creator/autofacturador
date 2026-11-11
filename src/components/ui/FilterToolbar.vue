<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: 'Buscar...' },
  filters: { type: Array, default: () => [] }, // [{ key, label }]
  activeFilter: { type: String, default: '' },
  chips: { type: Array, default: () => [] }, // [{ key, label }]
  total: { type: Number, default: 0 },
  shown: { type: Number, default: 0 },
  showExport: { type: Boolean, default: true },
  searchLabel: { type: String, default: 'Buscar' }
})

const emit = defineEmits(['update:modelValue', 'update:activeFilter', 'remove-chip', 'clear-chips', 'export'])

const query = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

function selectFilter(key) {
  emit('update:activeFilter', key)
}
</script>

<template>
  <div class="toolbar" role="region" aria-label="Barra de búsqueda y filtros">
    <div class="toolbar__row">
      <div class="search">
        <span class="search__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
        </span>
        <input
          v-model="query"
          class="search__input"
          type="search"
          :placeholder="placeholder"
          :aria-label="searchLabel"
        />
      </div>

      <div v-if="filters.length" class="pills" role="group" aria-label="Filtros rápidos">
        <button
          v-for="f in filters"
          :key="f.key"
          type="button"
          class="pill"
          :class="{ 'is-active': activeFilter === f.key }"
          :aria-pressed="activeFilter === f.key"
          @click="selectFilter(f.key)"
        >
          {{ f.label }}
        </button>
      </div>

      <div class="toolbar__spacer"></div>

      <button v-if="showExport" type="button" class="export-btn" aria-label="Exportar resultados" @click="emit('export')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12m0 0l4-4m-4 4l-4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"/></svg>
        <span>Exportar</span>
      </button>
    </div>

    <div v-if="chips.length || total >= 0" class="toolbar__meta">
      <div v-if="chips.length" class="chips" role="list" aria-label="Filtros activos">
        <span v-for="c in chips" :key="c.key" class="chip" role="listitem">
          <span class="chip__label">{{ c.label }}</span>
          <button type="button" class="chip__remove" :aria-label="`Quitar filtro ${c.label}`" @click="emit('remove-chip', c.key)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </span>
        <button type="button" class="chips__clear" aria-label="Limpiar todos los filtros" @click="emit('clear-chips')">Limpiar</button>
      </div>
      <div v-else class="chips-placeholder"></div>
      <p class="count" aria-live="polite">Mostrando {{ shown }} de {{ total }} resultados</p>
    </div>
  </div>
</template>

<style scoped>
.toolbar {
  width: 100%;
  font-family: 'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.toolbar__row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.search {
  position: relative;
  flex: 1 1 280px;
  min-width: 220px;
}
.search__icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--muted-2);
  display: inline-flex;
  pointer-events: none;
}
.search__icon svg { width: 18px; height: 18px; }
.search__input {
  width: 100%;
  padding: 12px 15px 12px 43px;
  background: var(--input-bg);
  backdrop-filter: var(--blur-soft);
  -webkit-backdrop-filter: var(--blur-soft);
  border: 1px solid var(--control-border);
  border-radius: 12px;
  font-size: 15px;
  color: var(--text);
  outline: none;
  transition: box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease;
}
.search__input::placeholder { color: var(--muted-2); }
.search__input:focus {
  background: var(--input-focus-bg);
  border-color: rgba(251, 146, 60, .45);
  box-shadow: 0 0 0 4px rgba(251, 146, 60, .16);
}
/* Un solo indicador de foco (el global no debe duplicarlo) */
.search__input:focus-visible {
  outline: none !important;
  box-shadow: 0 0 0 4px rgba(251, 146, 60, .16) !important;
  border-color: rgba(251, 146, 60, .45) !important;
}
.pills {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.pill {
  padding: 8px 17px;
  border-radius: 999px;
  border: 1px solid var(--control-border);
  background: var(--control-bg);
  color: var(--muted);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}
.pill:hover { border-color: var(--border-strong); color: var(--text-soft); }
.pill.is-active {
  background: var(--brand-primary-soft);
  border-color: var(--brand-primary);
  color: var(--brand-ink);
  font-weight: 600;
}
.toolbar__spacer { flex: 1 1 auto; }
.export-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid var(--control-border);
  background: var(--control-bg);
  color: var(--text-soft);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}
.export-btn svg { width: 16px; height: 16px; }
.export-btn:hover { background: var(--control-hover-bg); border-color: var(--border-strong); }

.toolbar__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.chips {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 2px;
  max-width: 100%;
  scrollbar-width: none;
}
.chips::-webkit-scrollbar { display: none; }
.chips-placeholder { flex: 1; }
.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px 5px 12px;
  border-radius: 999px;
  background: var(--brand-primary-soft);
  color: var(--brand-ink);
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}
.chip__remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: rgba(251, 146, 60, 0.18);
  color: var(--brand-primary);
  width: 18px;
  height: 18px;
  border-radius: 50%;
  cursor: pointer;
  padding: 0;
  transition: background 0.2s ease;
}
.chip__remove:hover { background: var(--brand-primary); color: var(--accent-contrast); }
.chip__remove svg { width: 12px; height: 12px; }
.chips__clear {
  border: none;
  background: transparent;
  color: var(--muted);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  padding: 4px 6px;
  border-radius: 6px;
  white-space: nowrap;
}
.chips__clear:hover { color: var(--text); background: var(--bg-subtle); }
.count {
  margin: 0;
  font-size: 13px;
  color: var(--muted);
  white-space: nowrap;
  margin-left: auto;
}

@media (max-width: 768px) {
  .toolbar__row { flex-direction: column; align-items: stretch; }
  .search { flex: 1 1 auto; width: 100%; }
  .pills { width: 100%; }
  .export-btn { width: 100%; justify-content: center; }
  .toolbar__meta { flex-direction: column; align-items: flex-start; }
  .count { margin-left: 0; }
}
</style>
