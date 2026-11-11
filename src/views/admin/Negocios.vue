<script setup>
/**
 * Negocios (admin): alta, configuración y estado de los negocios de la plataforma.
 */
import { ref, onMounted, computed } from 'vue'
import SelectField from '@/components/ui/SelectField.vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import FilterBar from '@/components/ui/FilterBar.vue'
import ContentView from '@/components/ui/ContentView.vue'
import StatCard from '@/components/ui/StatCard.vue'
import { useNegociosStore } from '@/stores/negocios'
import { useToast } from '@/composables/useToast'
import ActionMenu from '@/components/ui/ActionMenu.vue'
import { REGIMENES } from '@/utils/satCatalogs'
import { formatDate } from '@/utils/formatters'

const store = useNegociosStore()
const toast = useToast()

const open = ref(false)
const page = ref(1)
const pageSize = 8
const searching = ref(false)

/* ── Estado de la barra de filtros ──────────────────────────────────────── */
const search = ref('')
const regimenFilter = ref('')
const estadoFilter = ref('')
const desde = ref('')
const hasta = ref('')

const form = ref({ nombre: '', rfc: '', regimen: '601', cp: '', serie: 'A', activo: true })

const regimenOptions = REGIMENES.map(r => ({ value: r.id, label: `${r.id} - ${r.nombre}` }))
const estadoOptions = [
  { value: 'activo', label: 'Activos' },
  { value: 'suspendido', label: 'Suspendidos' },
]

const columns = [
  { key: 'nombre', label: 'Negocio' },
  { key: 'rfc', label: 'RFC' },
  { key: 'regimen', label: 'Régimen' },
  { key: 'cp', label: 'CP' },
  { key: 'serie', label: 'Serie' },
  { key: 'fecha', label: 'Alta' },
  { key: 'estado', label: 'Estado' },
  { key: 'acciones', label: '', align: 'right', width: '170px' }
]

onMounted(() => store.fetch())

const filtered = computed(() => {
  let list = [...store.items]
  if (regimenFilter.value) list = list.filter(n => n.regimen === regimenFilter.value)
  if (estadoFilter.value) list = list.filter(n => (n.activo ? 'activo' : 'suspendido') === estadoFilter.value)
  if (desde.value) list = list.filter(n => (n.createdAt || '') >= desde.value)
  if (hasta.value) list = list.filter(n => (n.createdAt || '') <= hasta.value)
  const q = search.value.trim().toLowerCase()
  if (q) list = list.filter(n => `${n.nombre} ${n.rfc} ${n.branding?.nombreComercial || ''}`.toLowerCase().includes(q))
  return list
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize)))
const paged = computed(() => filtered.value.slice((page.value - 1) * pageSize, page.value * pageSize))

const kpi = computed(() => ({
  total: store.items.length,
  activos: store.items.filter(n => n.activo).length,
  suspendidos: store.items.filter(n => !n.activo).length,
}))

function opcionesDe(n) {
  return [
    { key: 'editar', label: 'Editar negocio', hint: 'Datos fiscales, serie y branding', icon: 'xml' },
    { key: 'toggle', label: n.activo ? 'Suspender negocio' : 'Reactivar negocio', hint: 'Deja de emitir CFDI', icon: 'cancel', danger: n.activo },
    { key: 'detalle', label: 'Ver detalle', hint: 'Serie, folios y CSD', icon: 'pdf' },
    { key: 'eliminar', label: 'Eliminar negocio', hint: 'Acción irreversible', icon: 'cancel', danger: true },
  ]
}
function onAccion(item, n) {
  if (item.key === 'editar') edit(n)
  else if (item.key === 'toggle') toggleActivo(n)
  else if (item.key === 'detalle') verDetalle(n)
  else if (item.key === 'eliminar') remove(n.id)
}
async function toggleActivo(n) {
  const r = await store.update(n.id, { activo: !n.activo })
  if (r.ok) toast.success({ title: n.activo ? 'Negocio suspendido' : 'Negocio reactivado', message: n.nombre })
  else toast.error(r.error || 'No se pudo actualizar')
}
function verDetalle(n) {
  toast.info({ title: n.nombre, message: `RFC ${n.rfc} · Serie ${n.serie} · Folio ${n.folio}` })
}
function edit(n) { form.value = { ...n }; open.value = true }
function nuevo() { form.value = { nombre: '', rfc: '', regimen: '601', cp: '', serie: 'A', activo: true }; open.value = true }
async function save() {
  const r = form.value.id ? await store.update(form.value.id, form.value) : await store.create(form.value)
  if (r.ok) { toast.success({ title: 'Negocio guardado', message: 'Los datos se actualizaron correctamente.' }); open.value = false }
  else toast.error(r.error)
}
async function remove(id) {
  if (confirm('¿Eliminar negocio?')) { await store.remove(id); toast.success({ title: 'Negocio eliminado', message: 'El registro fue eliminado.' }) }
}
function onSearch() { searching.value = true; setTimeout(() => { searching.value = false }, 400); page.value = 1 }
function resetFilters() {
  search.value = ''; regimenFilter.value = ''; estadoFilter.value = ''
  desde.value = ''; hasta.value = ''
  page.value = 1
}
</script>

<template>
  <AppLayout>
    <div class="page-header">
      <div>
        <h1 class="page-title">Negocios</h1>
        <p class="page-subtitle">Alta, configuración y estado de los negocios de la plataforma</p>
      </div>
      <button class="btn btn-primary" @click="nuevo">Nuevo negocio</button>
    </div>

    <div class="grid kpi-grid section-block">
      <StatCard label="Negocios" :value="kpi.total" tone="brand" />
      <StatCard label="Activos" :value="kpi.activos" tone="cyan" />
      <StatCard label="Suspendidos" :value="kpi.suspendidos" tone="coral" />
      <StatCard label="Series activas" :value="new Set(store.items.map(n => n.serie)).size" tone="purple" />
    </div>

    <FilterBar
      v-model:search="search"
      v-model:tipo="regimenFilter"
      v-model:estatus="estadoFilter"
      v-model:desde="desde"
      v-model:hasta="hasta"
      :tipos="regimenOptions"
      :estatuses="estadoOptions"
      :show-monto="false"
      :loading="searching"
      :total="filtered.length"
      :shown="paged.length"
      placeholder="Buscar por nombre, RFC o nombre comercial..."
      search-label="Búsqueda / Negocio"
      tipo-label="Régimen fiscal"
      estatus-label="Estado"
      fecha-label="Fecha de alta"
      @search="onSearch"
      @reset="resetFilters"
    >
      <template #extra>
        <button class="btn btn-secondary btn-sm" @click="toast.info({ title: 'Exportación lista', message: 'Archivo CSV generado (mock).' })">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12m0 0l4-4m-4 4l-4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"/></svg>
          Exportar
        </button>
      </template>
    </FilterBar>

    <ContentView
      view="auto"
      :columns="columns"
      :rows="paged"
      row-key="id"
      :loading="store.loading"
      empty-title="No hay negocios"
      empty-subtitle="Da de alta el primer negocio para comenzar a operar."
      caption="Listado de negocios"
      :card-title="row => row.nombre"
      :card-subtitle="row => row.branding?.nombreComercial || row.rfc"
      :card-amount="row => `Serie ${row.serie}`"
      :card-icon="row => (row.nombre || 'N').charAt(0)"
      :card-meta-columns="['rfc', 'regimen', 'cp', 'fecha', 'estado']"
      card-action-label="Editar"
      @card-action="edit"
    >
      <template #cell-nombre="{ row }">
        <div class="cell-main">{{ row.nombre }}</div>
        <div class="cell-sub">{{ row.branding?.nombreComercial || 'Sin nombre comercial' }}</div>
      </template>
      <template #cell-rfc="{ row }"><span class="mono text-muted">{{ row.rfc }}</span></template>
      <template #cell-regimen="{ row }"><span class="badge badge-muted">{{ row.regimen }}</span></template>
      <template #cell-cp="{ row }"><span class="text-muted">{{ row.cp }}</span></template>
      <template #cell-serie="{ row }"><span class="mono">{{ row.serie }}</span></template>
      <template #cell-fecha="{ row }"><span class="text-muted">{{ row.createdAt ? formatDate(row.createdAt) : '—' }}</span></template>
      <template #cell-estado="{ row }"><StatusBadge :status="row.activo ? 'activo' : 'suspendido'" /></template>
      <template #cell-acciones="{ row }">
        <ActionMenu :items="opcionesDe(row)" label="Opciones" @select="onAccion($event, row)" />
      </template>
      <template #emptyAction>
        <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
          <button class="btn btn-secondary btn-sm" @click="resetFilters">Limpiar filtros</button>
          <button class="btn btn-primary btn-sm" @click="nuevo">Nuevo negocio</button>
        </div>
      </template>
    </ContentView>

    <div v-if="filtered.length" class="pagination card" style="margin-top:12px">
      <span>Mostrando {{ (page - 1) * pageSize + 1 }}-{{ Math.min(page * pageSize, filtered.length) }} de {{ filtered.length }} resultados</span>
      <div class="pagination-controls">
        <button class="page-btn" :disabled="page <= 1" @click="page--">Anterior</button>
        <button class="page-btn" :disabled="page >= totalPages" @click="page++">Siguiente</button>
      </div>
    </div>

    <BaseModal :open="open" :title="form.id ? 'Editar negocio' : 'Nuevo negocio'" @close="open = false">
      <div class="form-grid">
        <div class="field span-2"><label>Nombre / Razón social</label><input class="input" v-model="form.nombre" /></div>
        <div class="field"><label>RFC</label><input class="input mono" v-model="form.rfc" /></div>
        <div class="field"><label>Código postal</label><input class="input" v-model="form.cp" /></div>
        <div class="field"><label>Régimen fiscal</label><SelectField v-model="form.regimen"><option v-for="r in REGIMENES" :key="r.id" :value="r.id">{{ r.id }} - {{ r.nombre }}</option></SelectField></div>
        <div class="field"><label>Serie</label><input class="input" v-model="form.serie" /></div>
        <div class="field span-2">
          <label style="display:flex;align-items:center;gap:8px;font-weight:500;font-size:14px;color:var(--text-soft)">
            <input type="checkbox" v-model="form.activo" style="width:16px;height:16px;accent-color:var(--brand-primary)" /> Negocio activo
          </label>
        </div>
      </div>
      <template #footer><button class="btn btn-secondary" @click="open = false">Cancelar</button><button class="btn btn-primary" @click="save">Guardar negocio</button></template>
    </BaseModal>
  </AppLayout>
</template>
