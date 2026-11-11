<script setup>
/**
 * Vista principal de Facturas del negocio.
 * Layout: FilterBar full-width + ContentView (tabla ⇄ tarjetas) + paginación.
 */
import { ref, onMounted, computed } from 'vue'
import SelectField from '@/components/ui/SelectField.vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import ScopeBanner from '@/components/ui/ScopeBanner.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import FormFactura from '@/components/cfdi/FormFactura.vue'
import FilterBar from '@/components/ui/FilterBar.vue'
import FilterDrawer from '@/components/ui/FilterDrawer.vue'
import ContentView from '@/components/ui/ContentView.vue'
import FacturaAcciones from '@/components/ui/FacturaAcciones.vue'
import CancelacionModal from '@/components/cfdi/CancelacionModal.vue'
import InlineBanner from '@/components/ui/InlineBanner.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import { useAuthStore } from '@/stores/auth'
import { useFacturasStore } from '@/stores/facturas'
import { useNegociosStore } from '@/stores/negocios'
import { useToast } from '@/composables/useToast'
import { formatMoney, formatDate } from '@/utils/formatters'

const auth = useAuthStore()
const store = useFacturasStore()
const negocios = useNegociosStore()
const toast = useToast()

const open = ref(false)
const tipo = ref('INGRESO')
const modalCancelar = ref(false)
const facturaCancelar = ref(null)
const page = ref(1)
const pageSize = 10
const advanced = ref(null)
const chips = ref([])
const showFilters = ref(false)
const searching = ref(false)

/* ── Estado de la barra de filtros ──────────────────────────────────────── */
const search = ref('')
const tipoFilter = ref('')
const estatusFilter = ref('')
const desde = ref('')
const hasta = ref('')
const montoFilter = ref('')

const negId = computed(() => auth.user?.negocioId)
const miNegocio = computed(() => negocios.items.find(n => n.id === negId.value) || {})

const tipoOptions = [
  { value: 'INGRESO', label: 'Ingreso (I)' },
  { value: 'EGRESO', label: 'Egreso (E)' },
  { value: 'PAGO', label: 'Pago (P)' },
  { value: 'TRASLADO', label: 'Traslado (T)' },
  { value: 'NOMINA', label: 'Nómina (N)' },
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
  { key: 'receptor', label: 'Receptor' },
  { key: 'fecha', label: 'Fecha' },
  { key: 'tipo', label: 'Tipo' },
  { key: 'estado', label: 'Estado' },
  { key: 'total', label: 'Total', align: 'right' },
  { key: 'acciones', label: '', align: 'right', width: '56px' }
]

onMounted(async () => {
  await negocios.fetch()
  await store.fetch({ negocioId: negId.value })
})

const tipoMap = {
  'Ingreso (I)': ['INGRESO', 'I'],
  'Egreso (E)': ['EGRESO', 'E'],
  'Traslado (T)': ['TRASLADO', 'T'],
  'Pago (P)': ['PAGO', 'P'],
  'Nómina (N)': ['NOMINA', 'N']
}
const estatusMap = {
  'Vigente': ['vigente'],
  'Cancelado': ['cancelada'],
  'Pendiente': ['pendiente_cancelacion'],
  'En Proceso de Cancelación': ['pendiente_cancelacion']
}

const filtered = computed(() => {
  let list = [...store.items]

  // Filtros de la barra (full-width)
  if (tipoFilter.value) {
    list = list.filter(f => f.tipo === tipoFilter.value || f.tipoComprobante === tipoFilter.value)
  }
  if (estatusFilter.value) list = list.filter(f => f.estado === estatusFilter.value)
  if (desde.value) list = list.filter(f => (f.fecha || '').slice(0, 10) >= desde.value)
  if (hasta.value) list = list.filter(f => (f.fecha || '').slice(0, 10) <= hasta.value)
  if (montoFilter.value) {
    const [minRaw, maxRaw] = montoFilter.value.split('-')
    const min = Number(minRaw || 0)
    const max = maxRaw ? Number(maxRaw) : Infinity
    list = list.filter(f => Number(f.total || 0) >= min && Number(f.total || 0) <= max)
  }

  // Filtros avanzados (drawer)
  if (advanced.value) {
    const a = advanced.value
    if (a.uuid) list = list.filter(f => (f.uuid || '').toLowerCase().includes(a.uuid.toLowerCase()))
    if (a.operacion) list = list.filter(f => (f.operacion || f.noOperacion || '').toLowerCase().includes(a.operacion.toLowerCase()))
    if (a.llavePago) list = list.filter(f => (f.llavePago || '').toLowerCase().includes(a.llavePago.toLowerCase()))
    if (a.estatus && a.estatus !== 'Todos') {
      const allowed = estatusMap[a.estatus] || []
      if (allowed.length) list = list.filter(f => allowed.includes(f.estado))
    }
    if (a.tipo && a.tipo !== 'Todos') {
      const allowed = tipoMap[a.tipo] || []
      list = list.filter(f => allowed.includes(f.tipo) || allowed.includes(f.tipoComprobante))
    }
    if (a.fechaDesde) list = list.filter(f => (f.fecha || '').slice(0, 10) >= a.fechaDesde)
    if (a.fechaHasta) list = list.filter(f => (f.fecha || '').slice(0, 10) <= a.fechaHasta)
    const min = Math.min(a.montoMin ?? 0, a.montoMax ?? Infinity)
    const max = Math.max(a.montoMin ?? 0, a.montoMax ?? Infinity)
    list = list.filter(f => Number(f.total || 0) >= min && Number(f.total || 0) <= max)
  }

  const q = search.value.trim().toLowerCase()
  if (q) {
    list = list.filter(f =>
      `${f.serie}-${f.folio} ${f.receptor?.nombre || ''} ${f.receptor?.rfc || ''} ${f.uuid || ''}`.toLowerCase().includes(q)
    )
  }
  return list
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize)))
const paged = computed(() => filtered.value.slice((page.value - 1) * pageSize, page.value * pageSize))

function onSearch() { searching.value = true; setTimeout(() => { searching.value = false }, 400); page.value = 1 }
function resetFilters() {
  search.value = ''; tipoFilter.value = ''; estatusFilter.value = ''
  desde.value = ''; hasta.value = ''; montoFilter.value = ''
  onClearFilters()
}

function buildChips(a) {
  const c = []
  if (!a) return c
  if (a.uuid) c.push({ key: 'uuid', label: `UUID: ${a.uuid}` })
  if (a.operacion) c.push({ key: 'operacion', label: `Op: ${a.operacion}` })
  if (a.llavePago) c.push({ key: 'llavePago', label: `Llave: ${a.llavePago}` })
  if (a.estatus && a.estatus !== 'Todos') c.push({ key: 'estatus', label: a.estatus })
  if (a.tipo && a.tipo !== 'Todos') c.push({ key: 'tipo', label: a.tipo })
  if (a.fechaDesde || a.fechaHasta) c.push({ key: 'fecha', label: `Fecha: ${a.fechaDesde || '…'} a ${a.fechaHasta || '…'}` })
  if ((a.montoMin ?? 0) > 0 || (a.montoMax ?? 50000) < 100000) c.push({ key: 'monto', label: `Monto: $${a.montoMin} - $${a.montoMax}` })
  return c
}

function onApplyFilters(payload) {
  advanced.value = { ...payload }
  chips.value = buildChips(advanced.value)
  page.value = 1
  toast.success({ title: 'Filtros aplicados', message: 'La lista se actualizó con los criterios seleccionados.' })
}
function onClearFilters() {
  advanced.value = null
  chips.value = []
  page.value = 1
}
function removeChip(key) {
  if (!advanced.value) return
  const a = { ...advanced.value }
  if (key === 'fecha') { a.fechaDesde = ''; a.fechaHasta = '' }
  else if (key === 'monto') { a.montoMin = 0; a.montoMax = 50000 }
  else if (key === 'estatus' || key === 'tipo') { a[key] = 'Todos' }
  else { a[key] = '' }
  advanced.value = a
  chips.value = buildChips(a)
  page.value = 1
}

async function emitir(payload) {
  payload.negocioId = negId.value
  payload.emisor = { rfc: miNegocio.value.rfc, nombre: miNegocio.value.nombre, regimen: miNegocio.value.regimen, cp: miNegocio.value.cp }
  const r = await store.timbrar(payload)
  if (r.ok) { toast.success({ title: 'Factura timbrada', message: 'El CFDI se emitió correctamente.' }); open.value = false }
  else toast.error(r.error || 'Error al timbrar')
}
function abrirCancelar(factura) { facturaCancelar.value = factura; modalCancelar.value = true }
async function enviarCancelacion(data) {
  const r = await store.solicitarCancelacion(facturaCancelar.value.id, data)
  modalCancelar.value = false
  if (r.ok) toast.success({ title: 'Solicitud de cancelación enviada', message: 'Quedó registrada y el folio se bloqueó.' })
  else toast.error(r.error || 'No se pudo registrar la solicitud')
}
function verDetalle(row) { toast.info({ title: `Folio ${row.serie}-${row.folio}`, message: `UUID ${row.uuid}` }) }
</script>

<template>
  <AppLayout>
    <ScopeBanner />
    <div class="page-header">
      <div>
        <h1 class="page-title">Facturas</h1>
        <p class="page-subtitle">Emite, consulta y gestiona tus comprobantes CFDI 4.0</p>
      </div>
      <button class="btn btn-primary" @click="open = true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
        Nueva factura
      </button>
    </div>

    <InlineBanner
      v-if="chips.length"
      type="info"
      title="Filtros avanzados activos"
      message="Se están aplicando criterios adicionales a la búsqueda."
      actionLabel="Limpiar filtros"
      @action="onClearFilters"
    />

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
      :loading="searching"
      :total="filtered.length"
      :shown="paged.length"
      placeholder="Buscar por folio, receptor, RFC o UUID..."
      search-label="Búsqueda / UUID"
      @search="onSearch"
      @reset="resetFilters"
    >
      <template #extra>
        <button class="btn btn-secondary btn-sm" @click="showFilters = true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M7 12h10M10 18h4"/></svg>
          Filtros avanzados
        </button>
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
      empty-title="No se encontraron facturas"
      empty-subtitle="Ajusta los filtros o emite un nuevo comprobante para comenzar."
      caption="Listado de facturas CFDI"
      :card-title="row => `${row.serie}-${row.folio}`"
      :card-subtitle="row => row.receptor?.nombre || '—'"
      :card-amount="row => formatMoney(row.total)"
      :card-icon="row => (row.receptor?.nombre || 'F').charAt(0)"
      card-action-label="Ver detalle"
      @card-action="verDetalle"
    >
      <template #cell-folio="{ row }">
        <div class="cell-main mono">{{ row.serie }}-{{ row.folio }}</div>
        <div class="cell-sub mono">UUID {{ (row.uuid || '').slice(0, 8) }}…</div>
      </template>
      <template #cell-receptor="{ row }">
        <div class="cell-main">{{ row.receptor?.nombre || '—' }}</div>
        <div class="cell-sub mono">{{ row.receptor?.rfc || '' }}</div>
      </template>
      <template #cell-fecha="{ row }">
        <span class="text-muted">{{ formatDate(row.fecha) }}</span>
      </template>
      <template #cell-tipo="{ row }">
        <span class="badge badge-muted">{{ row.tipo || row.tipoComprobante }}</span>
      </template>
      <template #cell-total="{ row }">
        <span style="font-weight:600;color:var(--text)">{{ formatMoney(row.total) }}</span>
      </template>
      <template #cell-estado="{ row }">
        <StatusBadge :status="row.estado" />
      </template>
      <template #cell-acciones="{ row }">
        <FacturaAcciones :factura="row" mostrar-cancelar @cancelar="abrirCancelar" />
      </template>
      <template #emptyAction>
        <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
          <button class="btn btn-secondary btn-sm" @click="resetFilters">Limpiar filtros</button>
          <button class="btn btn-primary btn-sm" @click="open = true">Nueva factura</button>
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

    <FilterDrawer :open="showFilters" @close="showFilters = false" @apply="onApplyFilters" @clear="onClearFilters" />

    <CancelacionModal
      :open="modalCancelar"
      :factura="facturaCancelar"
      @close="modalCancelar = false"
      @submit="enviarCancelacion"
    />

    <BaseModal :open="open" title="Emitir CFDI" size="lg" @close="open = false">
      <div class="field" style="margin-bottom:20px;max-width:320px"><label>Tipo de comprobante</label><SelectField v-model="tipo"><option v-for="t in ['INGRESO','EGRESO','PAGO','TRASLADO','NOMINA']" :key="t" :value="t">{{ t }}</option></SelectField></div>
      <FormFactura :tipo="tipo" :readonly-emisor="true" :initial="{ emisor: { rfc: miNegocio.rfc, nombre: miNegocio.nombre, regimen: miNegocio.regimen, cp: miNegocio.cp } }" @submit="emitir">
        <template #actions><button type="button" class="btn btn-secondary" @click="open = false">Cancelar</button></template>
      </FormFactura>
    </BaseModal>
  </AppLayout>
</template>

<style scoped>
</style>
