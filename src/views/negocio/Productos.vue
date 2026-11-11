<script setup>
/**
 * Productos y servicios: catálogo con claves SAT, impuestos y precios.
 */
import { ref, onMounted, computed } from 'vue'
import SelectField from '@/components/ui/SelectField.vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import FilterBar from '@/components/ui/FilterBar.vue'
import ContentView from '@/components/ui/ContentView.vue'
import StatCard from '@/components/ui/StatCard.vue'
import { useAuthStore } from '@/stores/auth'
import { useProductosStore } from '@/stores/productos'
import { useToast } from '@/composables/useToast'
import ActionMenu from '@/components/ui/ActionMenu.vue'
import { CLAVES_PRODSERV, CLAVES_UNIDAD } from '@/utils/satCatalogs'
import { formatMoney } from '@/utils/formatters'

const auth = useAuthStore()
const store = useProductosStore()
const toast = useToast()
const negId = computed(() => auth.user?.negocioId)

const open = ref(false)
const page = ref(1)
const pageSize = 10
const searching = ref(false)

/* ── Estado de la barra de filtros ──────────────────────────────────────── */
const search = ref('')
const claveFilter = ref('')
const unidadFilter = ref('')
const ivaFilter = ref('')
const precioFilter = ref('')

const form = ref({ nombre: '', claveProdServ: '01010101', claveUnidad: 'H87', unidad: 'Pieza', precio: 0, iva: 16, ieps: 0, activo: true })

const precioOptions = [
  { value: '0-100', label: '$0 – $100' },
  { value: '100-500', label: '$100 – $500' },
  { value: '500-2000', label: '$500 – $2,000' },
  { value: '2000-', label: '$2,000 +' },
]
const ivaOptions = [
  { value: '0', label: 'Tasa 0%' },
  { value: '16', label: 'Tasa 16%' },
]

const columns = [
  { key: 'nombre', label: 'Producto' },
  { key: 'claveProdServ', label: 'Clave SAT' },
  { key: 'claveUnidad', label: 'Unidad' },
  { key: 'precio', label: 'Precio', align: 'right' },
  { key: 'iva', label: 'IVA' },
  { key: 'ieps', label: 'IEPS' },
  { key: 'estado', label: 'Estado' },
  { key: 'acciones', label: '', align: 'right', width: '170px' }
]

onMounted(() => store.fetch(negId.value))

/** Opciones de clave SAT y unidad derivadas del propio catálogo (no del catálogo genérico). */
const claveOptions = computed(() => {
  const ids = [...new Set(store.items.map(p => p.claveProdServ).filter(Boolean))]
  return ids.map(id => ({
    value: id,
    label: `${id} · ${CLAVES_PRODSERV.find(c => c.id === id)?.nombre || 'Sin catálogo'}`,
  }))
})
const unidadOptions = computed(() => {
  const ids = [...new Set(store.items.map(p => p.claveUnidad).filter(Boolean))]
  return ids.map(id => ({
    value: id,
    label: `${id} · ${CLAVES_UNIDAD.find(c => c.id === id)?.nombre || id}`,
  }))
})

const filtered = computed(() => {
  let list = [...store.items]
  if (claveFilter.value) list = list.filter(p => p.claveProdServ === claveFilter.value)
  if (unidadFilter.value) list = list.filter(p => p.claveUnidad === unidadFilter.value)
  if (ivaFilter.value) list = list.filter(p => String(p.iva) === ivaFilter.value)
  if (precioFilter.value) {
    const [minRaw, maxRaw] = precioFilter.value.split('-')
    const min = Number(minRaw || 0)
    const max = maxRaw ? Number(maxRaw) : Infinity
    list = list.filter(p => Number(p.precio || 0) >= min && Number(p.precio || 0) <= max)
  }
  const q = search.value.trim().toLowerCase()
  if (q) list = list.filter(p => `${p.nombre} ${p.claveProdServ} ${p.descripcion || ''}`.toLowerCase().includes(q))
  return list
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize)))
const paged = computed(() => filtered.value.slice((page.value - 1) * pageSize, page.value * pageSize))

const kpi = computed(() => ({
  total: store.items.length,
  activos: store.items.filter(p => p.activo).length,
  conIeps: store.items.filter(p => Number(p.ieps) > 0).length,
  valor: store.items.reduce((s, p) => s + Number(p.precio || 0), 0),
}))

function opcionesDe(p) {
  return [
    { key: 'editar', label: 'Editar producto', hint: 'Clave SAT, precio e impuestos', icon: 'xml' },
    { key: 'toggle', label: p.activo ? 'Desactivar' : 'Activar', hint: 'Aparece en el catálogo al facturar', icon: 'cancel', danger: p.activo },
    { key: 'eliminar', label: 'Eliminar', hint: 'Se quita del catálogo', icon: 'cancel', danger: true },
  ]
}
function onAccion(item, p) {
  if (item.key === 'editar') edit(p)
  else if (item.key === 'toggle') toggleActivo(p)
  else if (item.key === 'eliminar') remove(p.id)
}
async function toggleActivo(p) {
  const r = await store.save({ ...p, activo: !p.activo })
  if (r.ok) toast.success({ title: p.activo ? 'Producto desactivado' : 'Producto activado', message: p.nombre })
  else toast.error(r.error || 'No se pudo actualizar')
}
function nuevo() { form.value = { negocioId: negId.value, nombre: '', claveProdServ: '01010101', claveUnidad: 'H87', unidad: 'Pieza', precio: 0, iva: 16, ieps: 0, activo: true }; open.value = true }
function edit(p) { form.value = { ...p }; open.value = true }
async function save() {
  const r = await store.save({ ...form.value, negocioId: negId.value })
  if (r.ok) { toast.success({ title: 'Producto guardado', message: 'El catálogo se actualizó correctamente.' }); open.value = false }
  else toast.error(r.error)
}
async function remove(id) {
  if (confirm('¿Eliminar producto?')) { await store.remove(id, negId.value); toast.success({ title: 'Producto eliminado', message: 'El elemento fue eliminado del catálogo.' }) }
}
function onSearch() { searching.value = true; setTimeout(() => { searching.value = false }, 400); page.value = 1 }
function resetFilters() {
  search.value = ''; claveFilter.value = ''; unidadFilter.value = ''; ivaFilter.value = ''; precioFilter.value = ''
  page.value = 1
}
function exportar() { toast.info({ title: 'Exportación lista', message: 'Archivo CSV generado (mock).' }) }
</script>

<template>
  <AppLayout>
    <div class="page-header">
      <div>
        <h1 class="page-title">Productos y servicios</h1>
        <p class="page-subtitle">Catálogo con claves SAT, impuestos y precios</p>
      </div>
      <button class="btn btn-primary" @click="nuevo">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
        Crear producto
      </button>
    </div>

    <div class="grid kpi-grid section-block">
      <StatCard label="Productos" :value="kpi.total" tone="brand" />
      <StatCard label="Activos" :value="kpi.activos" tone="cyan" />
      <StatCard label="Con IEPS" :value="kpi.conIeps" tone="coral" />
      <StatCard label="Valor del catálogo" :value="formatMoney(kpi.valor)" tone="purple" />
    </div>

    <FilterBar
      v-model:search="search"
      v-model:tipo="claveFilter"
      v-model:estatus="unidadFilter"
      v-model:monto="precioFilter"
      :tipos="claveOptions"
      :estatuses="unidadOptions"
      :montos="precioOptions"
      :show-fechas="false"
      :loading="searching"
      :total="filtered.length"
      :shown="paged.length"
      placeholder="Buscar producto o clave SAT..."
      search-label="Búsqueda / Producto"
      tipo-label="Clave SAT"
      estatus-label="Unidad"
      monto-label="Precio"
      @search="onSearch"
      @reset="resetFilters"
    >
      <template #extra>
        <SelectField size="sm" v-model="ivaFilter">
          <option value="">Cualquier IVA</option>
          <option v-for="o in ivaOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
        </SelectField>
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
      :loading="store.loading"
      empty-title="No hay productos"
      empty-subtitle="Crea tu primer producto o servicio para usarlo en tus comprobantes CFDI."
      caption="Catálogo de productos y servicios"
      :card-title="row => row.nombre"
      :card-subtitle="row => `${row.claveProdServ} · ${row.claveUnidad}`"
      :card-amount="row => formatMoney(row.precio)"
      :card-icon="row => (row.nombre || 'P').charAt(0)"
      :card-meta-columns="['iva', 'ieps', 'estado']"
      card-action-label="Editar"
      @card-action="edit"
    >
      <template #cell-nombre="{ row }">
        <div class="cell-main">{{ row.nombre }}</div>
        <div class="cell-sub">{{ row.activo ? 'Activo' : 'Inactivo' }}</div>
      </template>
      <template #cell-claveProdServ="{ row }"><span class="mono text-muted">{{ row.claveProdServ }}</span></template>
      <template #cell-claveUnidad="{ row }"><span class="text-muted">{{ row.claveUnidad }}</span></template>
      <template #cell-precio="{ row }"><span style="font-weight:600;color:var(--text)">{{ formatMoney(row.precio) }}</span></template>
      <template #cell-iva="{ row }"><span class="badge badge-muted">{{ row.iva }}%</span></template>
      <template #cell-ieps="{ row }"><span class="badge badge-muted">{{ row.ieps }}%</span></template>
      <template #cell-estado="{ row }">
        <span class="badge" :class="row.activo ? 'badge-success' : 'badge-muted'">{{ row.activo ? 'Activo' : 'Inactivo' }}</span>
      </template>
      <template #cell-acciones="{ row }">
        <ActionMenu :items="opcionesDe(row)" label="Opciones" @select="onAccion($event, row)" />
      </template>
      <template #emptyAction>
        <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center">
          <button class="btn btn-secondary btn-sm" @click="resetFilters">Limpiar filtros</button>
          <button class="btn btn-primary btn-sm" @click="nuevo">Crear producto</button>
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

    <BaseModal :open="open" title="Producto / servicio" size="md" @close="open = false">
      <div class="form-grid">
        <div class="field span-2"><label>Nombre</label><input class="input" v-model="form.nombre" placeholder="Ej. Café americano" /></div>
        <div class="field"><label>Clave Prod/Serv</label><SelectField v-model="form.claveProdServ"><option v-for="c in CLAVES_PRODSERV" :key="c.id" :value="c.id">{{ c.id }} - {{ c.nombre }}</option></SelectField></div>
        <div class="field"><label>Clave unidad</label><SelectField v-model="form.claveUnidad"><option v-for="c in CLAVES_UNIDAD" :key="c.id" :value="c.id">{{ c.id }} - {{ c.nombre }}</option></SelectField></div>
        <div class="field"><label>Precio</label><input class="input" type="number" step="0.01" v-model.number="form.precio" /></div>
        <div class="field"><label>IVA %</label><input class="input" type="number" v-model.number="form.iva" /></div>
        <div class="field"><label>IEPS %</label><input class="input" type="number" v-model.number="form.ieps" /></div>
      </div>
      <template #footer><button class="btn btn-secondary" @click="open = false">Cancelar</button><button class="btn btn-primary" @click="save">Guardar producto</button></template>
    </BaseModal>
  </AppLayout>
</template>
