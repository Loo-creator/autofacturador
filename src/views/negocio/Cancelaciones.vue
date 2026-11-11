<script setup>
/**
 * Cancelaciones (negocio): solicitudes de cancelación de los clientes.
 * Filtros por motivo SAT, estatus de la solicitud, fecha y monto.
 */
import { ref, onMounted, computed } from 'vue'
import SelectField from '@/components/ui/SelectField.vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import ScopeBanner from '@/components/ui/ScopeBanner.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import FilterBar from '@/components/ui/FilterBar.vue'
import ContentView from '@/components/ui/ContentView.vue'
import StatCard from '@/components/ui/StatCard.vue'
import { useAuthStore } from '@/stores/auth'
import { useFacturasStore } from '@/stores/facturas'
import { useToast } from '@/composables/useToast'
import { formatMoney, formatDate } from '@/utils/formatters'
import {
  filtrarCancelaciones, resumenCancelaciones,
  MOTIVOS, ESTADOS_SOLICITUD, ESTADOS_CFDI, RANGOS_MONTO_CANCELACION, nombreMotivo,
} from '@/utils/cancelacionFilters'

const auth = useAuthStore()
const store = useFacturasStore()
const toast = useToast()
const negId = computed(() => auth.user?.negocioId)

/* ── Estado de la barra de filtros ──────────────────────────────────────── */
const search = ref('')
const motivoFilter = ref('')
const estatusFilter = ref('')
const estadoFilter = ref('')
const desde = ref('')
const hasta = ref('')
const montoFilter = ref('')

const page = ref(1)
const pageSize = 10
const searching = ref(false)

const columns = [
  { key: 'folio', label: 'Folio' },
  { key: 'receptor', label: 'Receptor' },
  { key: 'motivo', label: 'Motivo SAT' },
  { key: 'fecha', label: 'Fecha solicitud' },
  { key: 'estatus', label: 'Estatus' },
  { key: 'total', label: 'Total', align: 'right' },
  { key: 'acciones', label: '', align: 'right', width: '200px' }
]

onMounted(() => store.fetch({ negocioId: negId.value }))

/** Todas las facturas del negocio (con o sin solicitud) para poder filtrar por estado CFDI. */
const todas = computed(() => store.items)

const filtered = computed(() => filtrarCancelaciones(todas.value, {
  search: search.value,
  estado: estadoFilter.value,
  estatus: estatusFilter.value,
  motivo: motivoFilter.value,
  desde: desde.value,
  hasta: hasta.value,
  monto: montoFilter.value,
  fechaCampo: 'solicitud',
}))

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize)))
const paged = computed(() => filtered.value.slice((page.value - 1) * pageSize, page.value * pageSize))

const kpi = computed(() => resumenCancelaciones(todas.value))

function onSearch() { searching.value = true; setTimeout(() => { searching.value = false }, 400); page.value = 1 }
function resetFilters() {
  search.value = ''; motivoFilter.value = ''; estatusFilter.value = ''; estadoFilter.value = ''
  desde.value = ''; hasta.value = ''; montoFilter.value = ''
  page.value = 1
}
async function resolver(id, aprobar) {
  const r = await store.resolverCancelacion(id, aprobar)
  if (r.ok) toast.success({ title: aprobar ? 'Cancelación aprobada' : 'Solicitud rechazada', message: 'El estatus se actualizó correctamente.' })
  else toast.error(r.error || 'No se pudo actualizar la solicitud')
}
function verDetalle(row) {
  toast.info({
    title: `Solicitud ${row.serie}-${row.folio}`,
    message: `Motivo ${row.cancelacion?.motivo} · ${row.cancelacion?.estatus || 'sin estatus'}`,
  })
}
</script>

<template>
  <AppLayout>
    <ScopeBanner />
    <div class="page-header">
      <div>
        <h1 class="page-title">Cancelaciones</h1>
        <p class="page-subtitle">Gestiona las solicitudes de cancelación de tus clientes</p>
      </div>
    </div>

    <div class="grid kpi-grid section-block">
      <StatCard label="Solicitudes abiertas" :value="kpi.pendientes" tone="coral" />
      <StatCard label="Por cancelar" :value="kpi.porCancelar" tone="brand" />
      <StatCard label="Canceladas" :value="kpi.canceladas" tone="cyan" />
      <StatCard label="Monto por facturar" :value="formatMoney(kpi.montoCancelable)" tone="purple" />
    </div>

    <FilterBar
      v-model:search="search"
      v-model:tipo="motivoFilter"
      v-model:estatus="estatusFilter"
      v-model:desde="desde"
      v-model:hasta="hasta"
      v-model:monto="montoFilter"
      :tipos="MOTIVOS"
      :estatuses="ESTADOS_SOLICITUD"
      :montos="RANGOS_MONTO_CANCELACION"
      :loading="searching"
      :total="filtered.length"
      :shown="paged.length"
      placeholder="Buscar por folio, receptor o UUID..."
      search-label="Búsqueda / Folio"
      tipo-label="Motivo SAT"
      estatus-label="Estatus de la solicitud"
      fecha-label="Fecha de solicitud"
      monto-label="Monto"
      @search="onSearch"
      @reset="resetFilters"
    >
      <template #extra>
        <SelectField v-model="estadoFilter">
          <option value="">Todo estado CFDI</option>
          <option v-for="e in ESTADOS_CFDI" :key="e.value" :value="e.value">{{ e.label }}</option>
        </SelectField>
      </template>
    </FilterBar>

    <ContentView
      view="auto"
      :columns="columns"
      :rows="paged"
      row-key="id"
      :loading="store.loading"
      empty-title="No hay solicitudes"
      empty-subtitle="Las solicitudes de cancelación enviadas por tus clientes aparecerán aquí."
      caption="Listado de solicitudes de cancelación"
      :card-title="row => `${row.serie}-${row.folio}`"
      :card-subtitle="row => row.receptor?.nombre || '—'"
      :card-amount="row => formatMoney(row.total)"
      :card-icon="row => (row.receptor?.nombre || 'F').charAt(0)"
      :card-meta-columns="['motivo', 'fecha', 'estatus']"
      card-action-label="Ver detalle"
      @card-action="verDetalle"
    >
      <template #cell-folio="{ row }">
        <span class="cell-main mono">{{ row.serie }}-{{ row.folio }}</span>
        <div class="cell-sub mono">UUID {{ (row.uuid || '').slice(0, 8) }}…</div>
      </template>
      <template #cell-receptor="{ row }">
        <div class="cell-main">{{ row.receptor?.nombre || '—' }}</div>
        <div class="cell-sub mono">{{ row.receptor?.rfc || '' }}</div>
      </template>
      <template #cell-motivo="{ row }">
        <span v-if="row.cancelacion" class="badge badge-muted">Motivo {{ row.cancelacion.motivo }}</span>
        <span v-else class="text-muted">—</span>
      </template>
      <template #cell-fecha="{ row }"><span class="text-muted">{{ formatDate(row.cancelacion?.fecha) }}</span></template>
      <template #cell-estatus="{ row }">
        <StatusBadge v-if="row.cancelacion" :status="row.cancelacion.estatus" />
        <span v-else class="text-muted">—</span>
      </template>
      <template #cell-total="{ row }"><span style="font-weight:600;color:var(--text)">{{ formatMoney(row.total) }}</span></template>
      <template #cell-acciones="{ row }">
        <div v-if="row.estado === 'pendiente_cancelacion'" style="display:flex;gap:8px;justify-content:flex-end">
          <button class="btn btn-primary btn-sm" @click="resolver(row.id, true)">Aprobar</button>
          <button class="btn btn-secondary btn-sm" @click="resolver(row.id, false)">Rechazar</button>
        </div>
        <span v-else class="text-muted" style="font-size:13px">{{ row.cancelacion?.acuse ? 'Acuse: ' + row.cancelacion.acuse : '—' }}</span>
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
