<script setup>
/**
 * Vista principal del cliente: "Mis facturas".
 * Layout: FilterBar full-width + ContentView (tabla ⇄ tarjetas) + paginación.
 */
import { ref, onMounted, computed } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import FilterBar from '@/components/ui/FilterBar.vue'
import ContentView from '@/components/ui/ContentView.vue'
import FacturaAcciones from '@/components/ui/FacturaAcciones.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { useAuthStore } from '@/stores/auth'
import { useFacturasStore } from '@/stores/facturas'
import { formatMoney, formatDate, downloadBlob } from '@/utils/formatters'
import { descargarXML, descargarPDF } from '@/services/factura.service'

const auth = useAuthStore()
const store = useFacturasStore()

const search = ref('')
const tipoFilter = ref('')
const estatusFilter = ref('')
const desde = ref('')
const hasta = ref('')
const montoFilter = ref('')
const page = ref(1)
const pageSize = 10

const tipoOptions = [
  { value: 'INGRESO', label: 'Ingreso (I)' },
  { value: 'EGRESO', label: 'Egreso (E)' },
  { value: 'PAGO', label: 'Pago (P)' },
  { value: 'GLOBAL', label: 'Global' },
]
const estatusOptions = [
  { value: 'vigente', label: 'Vigente' },
  { value: 'cancelada', label: 'Cancelado' },
  { value: 'pendiente_cancelacion', label: 'Pendiente' },
]
const montoOptions = [
  { value: '0-500', label: '$0 – $500' },
  { value: '500-2000', label: '$500 – $2,000' },
  { value: '2000-10000', label: '$2,000 – $10,000' },
  { value: '10000-', label: '$10,000 +' },
]

const columns = [
  { key: 'folio', label: 'Folio' },
  { key: 'emisor', label: 'Emisor' },
  { key: 'fecha', label: 'Fecha' },
  { key: 'tipo', label: 'Tipo' },
  { key: 'estado', label: 'Estado' },
  { key: 'total', label: 'Total', align: 'right' },
  { key: 'acciones', label: '', align: 'right', width: '140px' }
]

onMounted(() => store.fetch())

// El admin ve todos los comprobantes (sin filtro por RFC).
const mias = computed(() => store.items.filter(f => !auth.rfcPropio || f.receptor?.rfc === auth.rfcPropio))

const filtered = computed(() => {
  let list = [...mias.value]
  if (tipoFilter.value) list = list.filter(f => f.tipo === tipoFilter.value || f.tipoComprobante === tipoFilter.value)
  if (estatusFilter.value) list = list.filter(f => f.estado === estatusFilter.value)
  if (desde.value) list = list.filter(f => (f.fecha || '').slice(0, 10) >= desde.value)
  if (hasta.value) list = list.filter(f => (f.fecha || '').slice(0, 10) <= hasta.value)
  if (montoFilter.value) {
    const [minRaw, maxRaw] = montoFilter.value.split('-')
    const min = Number(minRaw || 0)
    const max = maxRaw ? Number(maxRaw) : Infinity
    list = list.filter(f => Number(f.total || 0) >= min && Number(f.total || 0) <= max)
  }
  const q = search.value.trim().toLowerCase()
  if (q) list = list.filter(f => `${f.serie}-${f.folio} ${f.emisor?.nombre || ''} ${f.uuid || ''}`.toLowerCase().includes(q))
  return list
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize)))
const paged = computed(() => filtered.value.slice((page.value - 1) * pageSize, page.value * pageSize))

function onSearch() { page.value = 1 }
function resetFilters() {
  search.value = ''; tipoFilter.value = ''; estatusFilter.value = ''
  desde.value = ''; hasta.value = ''; montoFilter.value = ''
  page.value = 1
}
async function xml(id) { const r = await descargarXML(id); if (r.ok) downloadBlob(r.data.content, r.data.filename, 'application/xml') }
async function pdf(id) { const r = await descargarPDF(id); if (r.ok) downloadBlob(r.data.blob, r.data.filename, 'application/pdf') }
</script>

<template>
  <AppLayout>

    <div class="page-header">
      <div>
        <h1 class="page-title">Mis facturas</h1>
        <p class="page-subtitle">Historial y descarga de comprobantes XML y PDF</p>
      </div>
      <router-link to="/cliente/solicitar" class="btn btn-primary">Solicitar factura</router-link>
    </div>

    <FilterBar
      v-model:search="search"
      v-model:tipo="tipoFilter"
      v-model:estatus="estatusFilter"
      v-model:desde="desde"
      v-model:hasta="hasta"
      v-model:monto="montoFilter"
      :tipos="tipoOptions"
      :estatuses="estatusOptions"
      :montos="montoOptions"
      :total="filtered.length"
      :shown="paged.length"
      placeholder="Buscar por folio, emisor o UUID..."
      search-label="Búsqueda / UUID"
      @search="onSearch"
      @reset="resetFilters"
    >
      <template #extra>
        <router-link to="/cliente/solicitar" class="btn btn-secondary btn-sm">Nueva solicitud</router-link>
      </template>
    </FilterBar>

    <ContentView
      view="auto"
      :columns="columns"
      :rows="paged"
      row-key="id"
      :loading="store.loading"
      empty-title="No tienes facturas"
      empty-subtitle="Solicita tu primera factura con el folio de tu compra."
      caption="Listado de facturas del cliente"
      :card-title="row => `${row.serie}-${row.folio}`"
      :card-subtitle="row => row.emisor?.nombre || '—'"
      :card-amount="row => formatMoney(row.total)"
      :card-icon="row => (row.emisor?.nombre || 'F').charAt(0)"
      card-action-label="Descargar XML"
      @card-action="xml"
    >
      <template #cell-folio="{ row }">
        <div class="cell-main mono">{{ row.serie }}-{{ row.folio }}</div>
        <div class="cell-sub mono">UUID {{ (row.uuid || '').slice(0, 8) }}…</div>
      </template>
      <template #cell-emisor="{ row }">{{ row.emisor?.nombre || '—' }}</template>
      <template #cell-fecha="{ row }"><span class="text-muted">{{ formatDate(row.fecha) }}</span></template>
      <template #cell-tipo="{ row }"><span class="badge badge-muted">{{ row.tipo || row.tipoComprobante }}</span></template>
      <template #cell-estado="{ row }"><StatusBadge :status="row.estado" /></template>
      <template #cell-total="{ row }"><span style="font-weight:600;color:var(--text)">{{ formatMoney(row.total) }}</span></template>
      <template #cell-acciones="{ row }">
        <FacturaAcciones :factura="row" compacto />
      </template>
      <template #emptyAction>
        <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
          <button class="btn btn-secondary btn-sm" @click="resetFilters">Limpiar filtros</button>
          <router-link to="/cliente/solicitar" class="btn btn-primary btn-sm">Solicitar factura</router-link>
        </div>
      </template>
    </ContentView>

    <div v-if="filtered.length" class="pagination card" style="margin-top:12px;border-top-left-radius:0;border-top-right-radius:0;border-top:none">
      <span>Mostrando {{ (page - 1) * pageSize + 1 }}-{{ Math.min(page * pageSize, filtered.length) }} de {{ filtered.length }} resultados</span>
      <div class="pagination-controls">
        <button class="page-btn" :disabled="page <= 1" @click="page--">Anterior</button>
        <button class="page-btn" :disabled="page >= totalPages" @click="page++">Siguiente</button>
      </div>
    </div>
  </AppLayout>
</template>
