<script setup>
/**
 * Bandeja de tickets del negocio: ventas pendientes de facturar, ya facturadas,
 * expiradas y consolidadas en factura global. Es la bandeja que el negocio usa
 * para "recordar" al cliente que aún no ha facturado su compra.
 *
 * Layout: mismo patrón que Facturas → FilterBar full-width + ContentView (tabla ⇄ cards).
 */
import { ref, computed, onMounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import ScopeBanner from '@/components/ui/ScopeBanner.vue'
import FilterBar from '@/components/ui/FilterBar.vue'
import ContentView from '@/components/ui/ContentView.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import StatCard from '@/components/ui/StatCard.vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import ActionMenu from '@/components/ui/ActionMenu.vue'
import { formatMoney, formatDate } from '@/utils/formatters'
import { listTickets } from '@/services/ticket.service'
import { filtrarTickets, resumenTickets, RANGOS_MONTO, FORMAS_PAGO, ESTADOS_TICKET } from '@/utils/ticketFilters'

const auth = useAuthStore()
const toast = useToast()

/* ── Estado de la barra de filtros ──────────────────────────────────────── */
const search = ref('')
const formaPago = ref('')
const estadoFilter = ref('')
const desde = ref('')
const hasta = ref('')
const montoFilter = ref('')

const page = ref(1)
const pageSize = 8
const rows = ref([])
const loading = ref(false)
const searching = ref(false)

const formaPagoOptions = FORMAS_PAGO
const estadoOptions = ESTADOS_TICKET
const montoOptions = RANGOS_MONTO

const columns = [
  { key: 'folio', label: 'Folio ticket' },
  { key: 'fecha', label: 'Fecha' },
  { key: 'conceptos', label: 'Conceptos' },
  { key: 'plazo', label: 'Plazo' },
  { key: 'estado', label: 'Estado' },
  { key: 'total', label: 'Total', align: 'right' },
  { key: 'acciones', label: '', align: 'right', width: '150px' }
]

onMounted(async () => {
  loading.value = true
  const res = await listTickets(auth.user?.negocioId)
  loading.value = false
  if (res.ok) rows.value = res.data
  else toast.error(res.error)
})

const filtered = computed(() => filtrarTickets(rows.value, {
  search: search.value,
  estado: estadoFilter.value,
  formaPago: formaPago.value,
  desde: desde.value,
  hasta: hasta.value,
  monto: montoFilter.value,
}))

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize)))
const paged = computed(() => filtered.value.slice((page.value - 1) * pageSize, page.value * pageSize))

const kpi = computed(() => resumenTickets(rows.value))

function onSearch() { searching.value = true; setTimeout(() => { searching.value = false }, 400); page.value = 1 }
function resetFilters() {
  search.value = ''; formaPago.value = ''; estadoFilter.value = ''
  desde.value = ''; hasta.value = ''; montoFilter.value = ''
  page.value = 1
}
function exportar() { toast.info({ title: 'Exportación lista', message: 'Archivo generado (mock).' }) }
function opcionesDe(r) {
  return [
    { key: 'detalle', label: 'Ver detalle', hint: `${r.conceptos.length} concepto(s)`, icon: 'pdf' },
    { key: 'recordar', label: 'Recordar al cliente', hint: 'Avisar que falta facturar', icon: 'mail', disabled: r.evaluacion.estado !== 'disponible' },
    { key: 'exportar', label: 'Exportar ticket', hint: 'Archivo CSV', icon: 'xml' },
  ]
}
function onAccion(item, r) {
  if (item.key === 'detalle') verDetalle(r)
  else if (item.key === 'recordar') recordar(r)
  else if (item.key === 'exportar') exportar()
}
function verDetalle(r) {
  toast.info({ title: `Ticket ${r.folio}`, message: `${r.conceptos.length} concepto(s) · ${formatMoney(r.total)}` })
}
function recordar(r) {
  toast.info({ title: 'Recordatorio enviado', message: `Se avisó al cliente del ticket ${r.folio} (mock).` })
}
</script>

<template>
  <AppLayout>
    <ScopeBanner />
    <div class="page-header">
      <div>
        <h1 class="page-title">Tickets y ventas</h1>
        <p class="page-subtitle">Ventas capturadas en punto de venta y su estado de facturación</p>
      </div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-secondary" @click="exportar">Exportar</button>
        <router-link to="/negocio/factura-global" class="btn btn-primary">Factura global</router-link>
      </div>
    </div>

    <div class="grid kpi-grid section-block">
      <StatCard label="Tickets registrados" :value="kpi.total" tone="brand" />
      <StatCard label="Por facturar" :value="kpi.pendientes" tone="cyan" />
      <StatCard label="Monto por facturar" :value="formatMoney(kpi.montoPendiente)" tone="coral" />
      <StatCard label="Expirados" :value="kpi.expirados" tone="purple" />
    </div>

    <FilterBar
      v-model:search="search"
      v-model:tipo="formaPago"
      v-model:estatus="estadoFilter"
      v-model:desde="desde"
      v-model:hasta="hasta"
      v-model:monto="montoFilter"
      :tipos="formaPagoOptions"
      :estatuses="estadoOptions"
      :montos="montoOptions"
      :loading="searching"
      :total="filtered.length"
      :shown="paged.length"
      placeholder="Buscar por folio, concepto o negocio..."
      search-label="Búsqueda / Folio"
      tipo-label="Forma de pago"
      estatus-label="Estado del ticket"
      fecha-label="Fecha de compra"
      monto-label="Monto"
      @search="onSearch"
      @reset="resetFilters"
    >
      <template #extra>
        <button class="btn btn-secondary btn-sm" @click="exportar">
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
      :loading="loading"
      empty-title="No hay tickets registrados"
      empty-subtitle="Los tickets capturados en punto de venta aparecerán aquí."
      caption="Listado de tickets de venta"
      :card-title="row => `Ticket ${row.folio}`"
      :card-subtitle="row => row.conceptos.map(c => c.descripcion).join(', ')"
      :card-amount="row => formatMoney(row.total)"
      :card-icon="row => (row.conceptos[0]?.descripcion || 'T').charAt(0)"
      :card-meta-columns="['fecha', 'plazo', 'estado']"
      card-action-label="Ver detalle"
      @card-action="verDetalle"
    >
      <template #cell-folio="{ row }">
        <span class="cell-main mono">{{ row.folio }}</span>
        <div class="cell-sub">{{ row.conceptos.length }} concepto(s)</div>
      </template>
      <template #cell-fecha="{ row }"><span class="text-muted">{{ formatDate(row.fecha) }}</span></template>
      <template #cell-conceptos="{ row }">
        <span class="cell-main" style="font-weight:400">{{ row.conceptos[0]?.descripcion || '—' }}</span>
        <div v-if="row.conceptos.length > 1" class="cell-sub">+{{ row.conceptos.length - 1 }} más</div>
      </template>
      <template #cell-plazo="{ row }">
        <span v-if="row.evaluacion.estado === 'disponible'" class="text-muted" style="font-size:12px">
          {{ row.evaluacion.diasRestantes }} d. restantes
        </span>
        <span v-else class="text-muted" style="font-size:12px">Vence {{ formatDate(row.evaluacion.fechaLimite) }}</span>
      </template>
      <template #cell-estado="{ row }"><StatusBadge :status="row.evaluacion.estado" /></template>
      <template #cell-total="{ row }">
        <span style="font-weight:600;color:var(--text)">{{ formatMoney(row.total) }}</span>
      </template>
      <template #cell-acciones="{ row }">
        <ActionMenu :items="opcionesDe(row)" label="Opciones" @select="onAccion($event, row)" />
      </template>
      <template #emptyAction>
        <button class="btn btn-secondary btn-sm" @click="resetFilters">Limpiar filtros</button>
      </template>
    </ContentView>

    <div v-if="filtered.length" class="pagination card" style="margin-top:12px;border-top-left-radius:0;border-top-right-radius:0;border-top:none">
      <span>Mostrando {{ (page - 1) * pageSize + 1 }}-{{ Math.min(page * pageSize, filtered.length) }} de {{ filtered.length }} resultados</span>
      <div class="pagination-controls"><button class="page-btn" :disabled="page <= 1" @click="page--">Anterior</button><button class="page-btn" :disabled="page >= totalPages" @click="page++">Siguiente</button></div>
    </div>
  </AppLayout>
</template>
