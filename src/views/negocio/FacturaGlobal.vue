<script setup>
/**
 * Factura global: tabla de las consolidaciones ya emitidas al público en general,
 * con filtros, y la opción de generar una nueva (rango de fechas + datos del periodo).
 */
import { ref, onMounted, computed } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import ScopeBanner from '@/components/ui/ScopeBanner.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import FilterBar from '@/components/ui/FilterBar.vue'
import ContentView from '@/components/ui/ContentView.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import StatCard from '@/components/ui/StatCard.vue'
import FacturaGlobalWizard from '@/components/cfdi/FacturaGlobalWizard.vue'
import { useAuthStore } from '@/stores/auth'
import { useNegociosStore } from '@/stores/negocios'
import { useFacturasStore } from '@/stores/facturas'
import { useToast } from '@/composables/useToast'
import { formatMoney, formatDate, downloadBlob } from '@/utils/formatters'
import { descargarXML, descargarPDF } from '@/services/factura.service'
import { bloquearTicketsPorGlobal } from '@/services/ticket.service'
import { PERIODICIDADES } from '@/utils/satCatalogs'

const auth = useAuthStore()
const negocios = useNegociosStore()
const facturas = useFacturasStore()
const toast = useToast()

const negId = computed(() => auth.user?.negocioId)
const miNegocio = computed(() => negocios.items.find(n => n.id === negId.value) || {})

/* ── Estado de la barra de filtros ──────────────────────────────────────── */
const search = ref('')
const periodicidadFilter = ref('')
const estadoFilter = ref('')
const desde = ref('')
const hasta = ref('')
const montoFilter = ref('')

const page = ref(1)
const pageSize = 10
const showWizard = ref(false)
const searching = ref(false)

const periodicidadOptions = PERIODICIDADES.map(p => ({ value: p.id, label: p.nombre }))
const estadoOptions = [
  { value: 'vigente', label: 'Vigente' },
  { value: 'cancelada', label: 'Cancelada' },
  { value: 'pendiente_cancelacion', label: 'Pendiente de cancelación' },
]
const montoOptions = [
  { value: '0-10000', label: '$0 – $10,000' },
  { value: '10000-50000', label: '$10,000 – $50,000' },
  { value: '50000-', label: '$50,000 +' },
]

const columns = [
  { key: 'folio', label: 'Folio' },
  { key: 'periodo', label: 'Periodo' },
  { key: 'periodicidad', label: 'Periodicidad' },
  { key: 'tickets', label: 'Tickets' },
  { key: 'fecha', label: 'Emisión' },
  { key: 'estado', label: 'Estado' },
  { key: 'total', label: 'Total', align: 'right' },
  { key: 'acciones', label: '', align: 'right', width: '150px' }
]

onMounted(async () => {
  await negocios.fetch()
  await facturas.fetch({ negocioId: negId.value })
})

const globales = computed(() => facturas.items.filter(f => f.tipo === 'GLOBAL' || f.tipoComprobante === 'GLOBAL'))

const filtered = computed(() => {
  let list = [...globales.value]
  if (periodicidadFilter.value) list = list.filter(f => f.periodicidad === periodicidadFilter.value)
  if (estadoFilter.value) list = list.filter(f => f.estado === estadoFilter.value)
  if (desde.value) list = list.filter(f => (f.fecha || '').slice(0, 10) >= desde.value)
  if (hasta.value) list = list.filter(f => (f.fecha || '').slice(0, 10) <= hasta.value)
  if (montoFilter.value) {
    const [minRaw, maxRaw] = montoFilter.value.split('-')
    const min = Number(minRaw || 0)
    const max = maxRaw ? Number(maxRaw) : Infinity
    list = list.filter(f => Number(f.total || 0) >= min && Number(f.total || 0) <= max)
  }
  const q = search.value.trim().toLowerCase()
  if (q) list = list.filter(f => `${f.serie}-${f.folio} ${f.uuid || ''} ${f.receptor?.rfc || ''}`.toLowerCase().includes(q))
  return list
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize)))
const paged = computed(() => filtered.value.slice((page.value - 1) * pageSize, page.value * pageSize))

const kpi = computed(() => ({
  total: globales.value.length,
  vigentes: globales.value.filter(f => f.estado === 'vigente').length,
  monto: globales.value.reduce((s, f) => s + Number(f.total || 0), 0),
  tickets: globales.value.reduce((s, f) => s + Number(f.ticketsConsolidados || 0), 0),
}))

function onSearch() { searching.value = true; setTimeout(() => { searching.value = false }, 400); page.value = 1 }
function resetFilters() {
  search.value = ''; periodicidadFilter.value = ''; estadoFilter.value = ''
  desde.value = ''; hasta.value = ''; montoFilter.value = ''
  page.value = 1
}
function nombrePeriodicidad(id) { return PERIODICIDADES.find(p => p.id === id)?.nombre || '—' }
function periodoTexto(f) { return `${f.meses || '—'}/${f.anio || '—'}` }

async function submitGlobal(payload) {
  const folios = payload.foliosConsolidados || []
  const r = await facturas.timbrarGlobal({ ...payload, negocioId: negId.value })
  if (!r.ok) return toast.error(r.error || 'No se pudo timbrar la factura global')

  // Los folios consolidados quedan bloqueados para facturación individual.
  if (folios.length) await bloquearTicketsPorGlobal(folios, r.data.id)

  showWizard.value = false
  toast.success({
    title: 'Factura global timbrada',
    message: `Folio ${r.data.serie}-${r.data.folio} · ${folios.length} ticket(s) consolidado(s)`,
  })
  await facturas.fetch({ negocioId: negId.value })
}

async function xml(id) { const r = await descargarXML(id); if (r.ok) downloadBlob(r.data.content, r.data.filename, 'application/xml') }
async function pdf(id) { const r = await descargarPDF(id); if (r.ok) downloadBlob(r.data.blob, r.data.filename, 'application/pdf') }
function verDetalle(f) {
  toast.info({
    title: `Factura global ${f.serie}-${f.folio}`,
    message: `${f.ticketsConsolidados || 0} ticket(s) · ${formatMoney(f.total)}`,
  })
}
</script>

<template>
  <AppLayout>
    <ScopeBanner />
    <div class="page-header">
      <div>
        <h1 class="page-title">Factura global</h1>
        <p class="page-subtitle">Consolidación de ventas al público en general</p>
      </div>
      <button class="btn btn-primary" @click="showWizard = true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
        Nueva factura global
      </button>
    </div>

    <div class="grid kpi-grid section-block">
      <StatCard label="Facturas globales" :value="kpi.total" tone="brand" />
      <StatCard label="Vigentes" :value="kpi.vigentes" tone="cyan" />
      <StatCard label="Tickets consolidados" :value="kpi.tickets" tone="coral" />
      <StatCard label="Monto consolidado" :value="formatMoney(kpi.monto)" tone="purple" />
    </div>

    <FilterBar
      v-model:search="search"
      v-model:tipo="periodicidadFilter"
      v-model:estatus="estadoFilter"
      v-model:desde="desde"
      v-model:hasta="hasta"
      v-model:monto="montoFilter"
      :tipos="periodicidadOptions"
      :estatuses="estadoOptions"
      :montos="montoOptions"
      :loading="searching"
      :total="filtered.length"
      :shown="paged.length"
      placeholder="Buscar por folio, UUID o RFC genérico..."
      search-label="Búsqueda / Folio"
      tipo-label="Periodicidad"
      estatus-label="Estado del CFDI"
      fecha-label="Fecha de emisión"
      monto-label="Monto consolidado"
      @search="onSearch"
      @reset="resetFilters"
    />

    <ContentView
      view="auto"
      :columns="columns"
      :rows="paged"
      row-key="id"
      :loading="facturas.loading"
      empty-title="No hay facturas globales"
      empty-subtitle="Genera una consolidación por un rango de fechas para las ventas al público en general."
      caption="Listado de facturas globales"
      :card-title="row => `${row.serie}-${row.folio}`"
      :card-subtitle="row => `Periodo ${periodoTexto(row)} · ${nombrePeriodicidad(row.periodicidad)}`"
      :card-amount="row => formatMoney(row.total)"
      :card-icon="row => 'G'"
      :card-meta-columns="['tickets', 'fecha', 'estado']"
      card-action-label="Ver detalle"
      @card-action="verDetalle"
    >
      <template #cell-folio="{ row }">
        <span class="cell-main mono">{{ row.serie }}-{{ row.folio }}</span>
        <div class="cell-sub mono">UUID {{ (row.uuid || '').slice(0, 8) }}…</div>
      </template>
      <template #cell-periodo="{ row }">
        <span class="cell-main">{{ periodoTexto(row) }}</span>
      </template>
      <template #cell-periodicidad="{ row }">
        <span class="badge badge-muted">{{ nombrePeriodicidad(row.periodicidad) }}</span>
      </template>
      <template #cell-tickets="{ row }">
        <span class="text-muted">{{ row.ticketsConsolidados || 0 }} ticket(s)</span>
      </template>
      <template #cell-fecha="{ row }"><span class="text-muted">{{ formatDate(row.fecha) }}</span></template>
      <template #cell-estado="{ row }"><StatusBadge :status="row.estado" /></template>
      <template #cell-total="{ row }"><span style="font-weight:600;color:var(--text)">{{ formatMoney(row.total) }}</span></template>
      <template #cell-acciones="{ row }">
        <div style="display:flex;gap:4px;justify-content:flex-end">
          <button class="btn btn-ghost btn-sm" @click="xml(row.id)">XML</button>
          <button class="btn btn-ghost btn-sm" @click="pdf(row.id)">PDF</button>
        </div>
      </template>
      <template #emptyAction>
        <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
          <button class="btn btn-secondary btn-sm" @click="resetFilters">Limpiar filtros</button>
          <button class="btn btn-primary btn-sm" @click="showWizard = true">Nueva factura global</button>
        </div>
      </template>
    </ContentView>

    <div v-if="filtered.length" class="pagination card" style="margin-top:12px;border-top-left-radius:0;border-top-right-radius:0;border-top:none">
      <span>Mostrando {{ (page - 1) * pageSize + 1 }}-{{ Math.min(page * pageSize, filtered.length) }} de {{ filtered.length }} resultados</span>
      <div class="pagination-controls"><button class="page-btn" :disabled="page <= 1" @click="page--">Anterior</button><button class="page-btn" :disabled="page >= totalPages" @click="page++">Siguiente</button></div>
    </div>

    <BaseModal :open="showWizard" title="Nueva factura global" size="lg" @close="showWizard = false">
      <FacturaGlobalWizard
        :emisor="{ rfc: miNegocio.rfc, nombre: miNegocio.nombre, regimen: miNegocio.regimen, cp: miNegocio.cp }"
        :negocio-id="negId"
        @submit="submitGlobal"
        @cancel="showWizard = false"
      />
    </BaseModal>
  </AppLayout>
</template>
