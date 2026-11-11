<script setup>
/**
 * Usuarios globales (admin): usuarios, clientes, roles y accesos a la plataforma.
 */
import { ref, onMounted, computed } from 'vue'
import SelectField from '@/components/ui/SelectField.vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import FilterBar from '@/components/ui/FilterBar.vue'
import ContentView from '@/components/ui/ContentView.vue'
import StatCard from '@/components/ui/StatCard.vue'
import { useClientesStore } from '@/stores/clientes'
import ActionMenu from '@/components/ui/ActionMenu.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import { useToast } from '@/composables/useToast'
import { useNegociosStore } from '@/stores/negocios'
import { formatMoney } from '@/utils/formatters'

const store = useClientesStore()
const toast = useToast()
const editando = ref(null)
const modal = ref(false)
const negocios = useNegociosStore()

const page = ref(1)
const pageSize = 10
const searching = ref(false)

/* ── Estado de la barra de filtros ──────────────────────────────────────── */
const search = ref('')
const rolFilter = ref('')
const negocioFilter = ref('')
const conRfcFilter = ref('')

const rolOptions = [
  { value: 'admin', label: 'Administrador' },
  { value: 'negocio', label: 'Negocio' },
  { value: 'cliente', label: 'Cliente' },
]

const columns = [
  { key: 'nombre', label: 'Usuario' },
  { key: 'email', label: 'Correo' },
  { key: 'rol', label: 'Rol' },
  { key: 'rfc', label: 'RFC' },
  { key: 'negocioId', label: 'Negocio' },
  { key: 'estado', label: 'Estado' },
  { key: 'acciones', label: 'Acciones', align: 'right', width: '130px' }
]

const ROLES = [
  { value: 'admin', label: 'Administrador' },
  { value: 'negocio', label: 'Negocio' },
  { value: 'cliente', label: 'Cliente' },
]

/** Opciones del menú por usuario. */
function opcionesDe(u) {
  return [
    { key: 'editar', label: 'Editar usuario', hint: 'Nombre, correo, rol y RFC', icon: 'xml' },
    { key: 'toggle', label: u.activo === false ? 'Reactivar acceso' : 'Suspender acceso', hint: 'Bloquea el inicio de sesión', icon: 'cancel', danger: u.activo !== false },
    { key: 'detalle', label: 'Ver detalle', hint: 'Datos completos del usuario', icon: 'pdf' },
  ]
}

function onAccion(item, u) {
  if (item.key === 'editar') { editando.value = { ...u }; modal.value = true }
  else if (item.key === 'toggle') toggleActivo(u)
  else if (item.key === 'detalle') verDetalle(u)
}

async function toggleActivo(u) {
  const r = await store.toggleActivo(u.id)
  if (r.ok) toast.success({ title: u.activo === false ? 'Acceso reactivado' : 'Acceso suspendido', message: `${u.nombre} · ${u.email}` })
  else toast.error(r.error || 'No se pudo actualizar el usuario')
}

function verDetalle(u) {
  toast.info({ title: u.nombre, message: `${u.email} · ${u.rol}${u.rfc ? ' · ' + u.rfc : ''}${u.negocioId ? ' · ' + nombreNegocio(u.negocioId) : ''}` })
}

async function guardar() {
  const r = await store.update(editando.value)
  modal.value = false
  if (r.ok) toast.success({ title: 'Usuario actualizado', message: 'Los cambios se guardaron.' })
  else toast.error(r.error || 'No se pudo guardar')
}

onMounted(async () => {
  await store.fetchUsuarios()
  await negocios.fetch()
})

const negocioOptions = computed(() => negocios.items.map(n => ({ value: n.id, label: n.nombre })))

function nombreNegocio(id) {
  return negocios.items.find(n => n.id === id)?.nombre || '—'
}

const filtered = computed(() => {
  let list = [...store.usuarios]
  if (rolFilter.value) list = list.filter(u => u.rol === rolFilter.value)
  if (negocioFilter.value) list = list.filter(u => u.negocioId === negocioFilter.value)
  if (conRfcFilter.value === 'si') list = list.filter(u => !!u.rfc)
  if (conRfcFilter.value === 'no') list = list.filter(u => !u.rfc)
  const q = search.value.trim().toLowerCase()
  if (q) list = list.filter(u => `${u.nombre} ${u.email} ${u.rfc || ''}`.toLowerCase().includes(q))
  return list
})

const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize)))
const paged = computed(() => filtered.value.slice((page.value - 1) * pageSize, page.value * pageSize))

const kpi = computed(() => ({
  total: store.usuarios.length,
  admin: store.usuarios.filter(u => u.rol === 'admin').length,
  negocio: store.usuarios.filter(u => u.rol === 'negocio').length,
  cliente: store.usuarios.filter(u => u.rol === 'cliente').length,
}))

function onSearch() { searching.value = true; setTimeout(() => { searching.value = false }, 400); page.value = 1 }
function resetFilters() {
  search.value = ''; rolFilter.value = ''; negocioFilter.value = ''; conRfcFilter.value = ''
  page.value = 1
}
</script>

<template>
  <AppLayout>
    <div class="page-header">
      <div>
        <h1 class="page-title">Usuarios globales</h1>
        <p class="page-subtitle">Gestión de usuarios, roles y accesos a la plataforma</p>
      </div>
    </div>

    <div class="grid kpi-grid section-block">
      <StatCard label="Usuarios" :value="kpi.total" tone="brand" />
      <StatCard label="Administradores" :value="kpi.admin" tone="cyan" />
      <StatCard label="Negocios" :value="kpi.negocio" tone="coral" />
      <StatCard label="Clientes" :value="kpi.cliente" tone="purple" />
    </div>

    <FilterBar
      v-model:search="search"
      v-model:tipo="rolFilter"
      v-model:estatus="negocioFilter"
      v-model:monto="conRfcFilter"
      :tipos="rolOptions"
      :estatuses="negocioOptions"
      :show-fechas="false"
      :loading="searching"
      :total="filtered.length"
      :shown="paged.length"
      placeholder="Buscar por nombre, correo o RFC..."
      search-label="Búsqueda / Usuario"
      tipo-label="Rol"
      estatus-label="Negocio"
      monto-label="Datos fiscales"
      @search="onSearch"
      @reset="resetFilters"
    >
      <template #extra>
        <SelectField size="sm" v-model="conRfcFilter">
          <option value="">Con o sin RFC</option>
          <option value="si">Con RFC</option>
          <option value="no">Sin RFC</option>
        </SelectField>
      </template>
    </FilterBar>

    <ContentView
      view="auto"
      :columns="columns"
      :rows="paged"
      row-key="id"
      :loading="store.loading"
      empty-title="No se encontraron usuarios"
      empty-subtitle="Ajusta los filtros de búsqueda."
      caption="Listado de usuarios de la plataforma"
      :card-title="row => row.nombre"
      :card-subtitle="row => row.email"
      :card-amount="row => (row.rol || '').toUpperCase()"
      :card-icon="row => (row.nombre || 'U').charAt(0)"
      :card-meta-columns="['rfc', 'negocioId']"
      card-action-label="Ver detalle"
      @card-action="() => {}"
    >
      <template #cell-nombre="{ row }">
        <div class="cell-main">{{ row.nombre }}</div>
        <div class="cell-sub mono">{{ row.id }}</div>
      </template>
      <template #cell-email="{ row }"><span class="text-muted">{{ row.email }}</span></template>
      <template #cell-rol="{ row }">
        <span class="badge" :class="row.rol === 'admin' ? 'badge-accent' : row.rol === 'negocio' ? 'badge-info' : 'badge-muted'">{{ row.rol }}</span>
      </template>
      <template #cell-rfc="{ row }"><span class="mono text-muted">{{ row.rfc || '—' }}</span></template>
      <template #cell-negocioId="{ row }"><span class="text-muted">{{ nombreNegocio(row.negocioId) }}</span></template>
      <template #cell-estado="{ row }">
        <span class="badge" :class="row.activo === false ? 'badge-danger' : 'badge-success'">{{ row.activo === false ? 'Suspendido' : 'Activo' }}</span>
      </template>
      <template #cell-acciones="{ row }">
        <ActionMenu :items="opcionesDe(row)" label="Opciones" @select="onAccion($event, row)" />
      </template>
      <template #emptyAction><button class="btn btn-secondary btn-sm" @click="resetFilters">Limpiar filtros</button></template>
    </ContentView>

    <BaseModal :open="modal" title="Editar usuario" @close="modal = false">
      <div class="form-grid">
        <div class="field span-2"><label>Nombre</label><input class="input" v-model="editando.nombre" /></div>
        <div class="field span-2"><label>Correo</label><input class="input" type="email" v-model="editando.email" /></div>
        <div class="field">
          <label>Rol</label>
          <SelectField v-model="editando.rol">
            <option v-for="r in ROLES" :key="r.value" :value="r.value">{{ r.label }}</option>
          </SelectField>
        </div>
        <div class="field"><label>RFC</label><input class="input mono" v-model="editando.rfc" maxlength="13" /></div>
        <div class="field span-2">
          <label>Negocio</label>
          <SelectField v-model="editando.negocioId">
            <option value="">Sin negocio</option>
            <option v-for="n in negocios.items" :key="n.id" :value="n.id">{{ n.nombre }}</option>
          </SelectField>
        </div>
      </div>
      <template #footer><button class="btn btn-secondary" @click="modal = false">Cancelar</button><button class="btn btn-primary" @click="guardar">Guardar cambios</button></template>
    </BaseModal>

    <div v-if="filtered.length" class="pagination card" style="margin-top:12px">
      <span>Mostrando {{ (page - 1) * pageSize + 1 }}-{{ Math.min(page * pageSize, filtered.length) }} de {{ filtered.length }} resultados</span>
      <div class="pagination-controls">
        <button class="page-btn" :disabled="page <= 1" @click="page--">Anterior</button>
        <button class="page-btn" :disabled="page >= totalPages" @click="page++">Siguiente</button>
      </div>
    </div>
  </AppLayout>
</template>
