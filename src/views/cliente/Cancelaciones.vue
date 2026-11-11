<script setup>
/**
 * Cancelaciones (cliente): comprobantes por cancelar, solicitudes en trámite y canceladas.
 */
import { ref, onMounted, computed } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import FilterBar from '@/components/ui/FilterBar.vue'
import ContentView from '@/components/ui/ContentView.vue'
import StatCard from '@/components/ui/StatCard.vue'
import CancelacionModal from '@/components/cfdi/CancelacionModal.vue'
import { useAuthStore } from '@/stores/auth'
import { useFacturasStore } from '@/stores/facturas'
import { useToast } from '@/composables/useToast'
import { formatMoney, formatDate } from '@/utils/formatters'
import {
  filtrarCancelaciones, resumenCancelaciones,
  MOTIVOS, ESTADOS_CFDI, RANGOS_MONTO_CANCELACION,
} from '@/utils/cancelacionFilters'

const auth = useAuthStore()
const store = useFacturasStore()
const toast = useToast()
const open = ref(false)
const selected = ref(null)

/* ── Estado de la barra de filtros ──────────────────────────────────────── */
const search = ref('')
const motivoFilter = ref('')
const estadoFilter = ref('')
const desde = ref('')
const hasta = ref('')
const montoFilter = ref('')

const searching = ref(false)

const columns = [
  { key: 'folio', label: 'Folio' },
  { key: 'emisor', label: 'Emisor' },
  { key: 'fecha', label: 'Emisión' },
  { key: 'motivo', label: 'Motivo' },
  { key: 'estatus', label: 'Solicitud' },
  { key: 'estado', label: 'Estado CFDI' },
  { key: 'total', label: 'Total', align: 'right' },
  { key: 'acciones', label: '', align: 'right', width: '190px' }
]

onMounted(() => store.fetch())

// El admin ve todos los comprobantes (sin filtro por RFC).
const mias = computed(() => store.items.filter(f => !auth.rfcPropio || f.receptor?.rfc === auth.rfcPropio))

const filtered = computed(() => filtrarCancelaciones(mias.value, {
  search: search.value,
  estado: estadoFilter.value,
  motivo: motivoFilter.value,
  desde: desde.value,
  hasta: hasta.value,
  monto: montoFilter.value,
  fechaCampo: 'emision',
}))

const kpi = computed(() => resumenCancelaciones(mias.value))

function onSearch() { searching.value = true; setTimeout(() => { searching.value = false }, 400) }
function resetFilters() {
  search.value = ''; motivoFilter.value = ''; estadoFilter.value = ''
  desde.value = ''; hasta.value = ''; montoFilter.value = ''
}
function pedir(f) { selected.value = f; open.value = true }
async function submit(data) {
  const r = await store.solicitarCancelacion(selected.value.id, data)
  open.value = false
  if (r.ok) toast.success({ title: 'Solicitud enviada', message: 'El negocio revisará tu solicitud de cancelación.' })
  else toast.error(r.error || 'No se pudo enviar la solicitud')
}
function verDetalle(row) {
  toast.info({
    title: `Comprobante ${row.serie}-${row.folio}`,
    message: row.cancelacion ? `Motivo ${row.cancelacion.motivo} · ${row.cancelacion.estatus}` : 'Sin solicitud registrada',
  })
}
</script>

<template>
  <AppLayout>

    <div class="page-header">
      <div>
        <h1 class="page-title">Cancelaciones</h1>
        <p class="page-subtitle">Solicita la cancelación de tus CFDI y consulta su estatus</p>
      </div>
      <router-link to="/cliente/facturas" class="btn btn-secondary">Ver mis facturas</router-link>
    </div>

    <div class="grid kpi-grid section-block">
      <StatCard label="Por cancelar" :value="kpi.porCancelar" tone="brand" />
      <StatCard label="En trámite" :value="kpi.pendientes" tone="coral" />
      <StatCard label="Canceladas" :value="kpi.canceladas" tone="cyan" />
      <StatCard label="Monto por cancelar" :value="formatMoney(kpi.montoCancelable)" tone="purple" />
    </div>

    <FilterBar
      v-model:search="search"
      v-model:tipo="motivoFilter"
      v-model:estatus="estadoFilter"
      v-model:desde="desde"
      v-model:hasta="hasta"
      v-model:monto="montoFilter"
      :tipos="MOTIVOS"
      :estatuses="ESTADOS_CFDI"
      :montos="RANGOS_MONTO_CANCELACION"
      :loading="searching"
      :total="filtered.length"
      :shown="filtered.length"
      placeholder="Buscar por folio, emisor o UUID..."
      search-label="Búsqueda / Folio"
      tipo-label="Motivo de la solicitud"
      estatus-label="Estado del comprobante"
      fecha-label="Fecha de emisión"
      monto-label="Monto"
      @search="onSearch"
      @reset="resetFilters"
    />

    <ContentView
      view="auto"
      :columns="columns"
      :rows="filtered"
      row-key="id"
      :loading="store.loading"
      empty-title="Sin comprobantes"
      empty-subtitle="No tienes facturas que coincidan con los filtros seleccionados."
      caption="Listado de comprobantes para cancelación"
      :card-title="row => `${row.serie}-${row.folio}`"
      :card-subtitle="row => row.emisor?.nombre || '—'"
      :card-amount="row => formatMoney(row.total)"
      :card-icon="row => (row.emisor?.nombre || 'F').charAt(0)"
      :card-meta-columns="['fecha', 'motivo', 'estado']"
      card-action-label="Ver detalle"
      @card-action="verDetalle"
    >
      <template #cell-folio="{ row }">
        <span class="cell-main mono">{{ row.serie }}-{{ row.folio }}</span>
        <div class="cell-sub mono">UUID {{ (row.uuid || '').slice(0, 8) }}…</div>
      </template>
      <template #cell-emisor="{ row }">
        <div class="cell-main">{{ row.emisor?.nombre || '—' }}</div>
        <div class="cell-sub mono">{{ row.receptor?.rfc || '' }}</div>
      </template>
      <template #cell-fecha="{ row }"><span class="text-muted">{{ formatDate(row.fecha) }}</span></template>
      <template #cell-motivo="{ row }">
        <span v-if="row.cancelacion" class="badge badge-muted">Motivo {{ row.cancelacion.motivo }}</span>
        <span v-else class="text-muted">—</span>
      </template>
      <template #cell-estatus="{ row }">
        <StatusBadge v-if="row.cancelacion" :status="row.cancelacion.estatus" />
        <span v-else class="text-muted">—</span>
      </template>
      <template #cell-estado="{ row }"><StatusBadge :status="row.estado" /></template>
      <template #cell-total="{ row }"><span style="font-weight:600;color:var(--text)">{{ formatMoney(row.total) }}</span></template>
      <template #cell-acciones="{ row }">
        <div style="display:flex;gap:6px;justify-content:flex-end">
          <button v-if="row.estado === 'vigente'" class="btn btn-primary btn-sm" @click="pedir(row)">Solicitar cancelación</button>
          <button v-else-if="row.estado === 'pendiente_cancelacion'" class="btn btn-ghost btn-sm" disabled>En trámite</button>
          <span v-else class="text-muted" style="font-size:12px">{{ row.cancelacion?.acuse ? 'Acuse: ' + row.cancelacion.acuse : 'Cancelada' }}</span>
        </div>
      </template>
      <template #emptyAction>
        <button class="btn btn-secondary btn-sm" @click="resetFilters">Limpiar filtros</button>
      </template>
    </ContentView>

    <CancelacionModal :open="open" :factura="selected" @close="open = false" @submit="submit" />
  </AppLayout>
</template>
