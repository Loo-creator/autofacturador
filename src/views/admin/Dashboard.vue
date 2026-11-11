<script setup>
import { ref, onMounted, computed } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import StatCard from '@/components/ui/StatCard.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import SelectField from '@/components/ui/SelectField.vue'
import FacturaGlobalWizard from '@/components/cfdi/FacturaGlobalWizard.vue'
import { useFacturasStore } from '@/stores/facturas'
import { useNegociosStore } from '@/stores/negocios'
import { useToast } from '@/composables/useToast'
import { formatMoney, formatDate, formatDateTime } from '@/utils/formatters'
import { REGIMENES, USOS_CFDI, FORMAS_PAGO, METODOS_PAGO } from '@/utils/satCatalogs'
import { listAuditoria } from '@/services/negocio.service'
import { bloquearTicketsPorGlobal } from '@/services/ticket.service'

const facturas = useFacturasStore(); const negocios = useNegociosStore()
const toast = useToast()
const tab = ref('globales')
const auditoria = ref([])
const showWizard = ref(false)
const negocioSel = ref('')

onMounted(async () => { facturas.fetch(); negocios.fetch(); const r = await listAuditoria(); if(r.ok) auditoria.value = r.data })

const globales = computed(() => facturas.items.filter(f => f.tipo === 'GLOBAL' || f.receptor?.rfc === 'XAXX010101000'))
const totalMonto = computed(() => facturas.items.reduce((s,f)=>s+Number(f.total||0),0))
const cats = [{name:'Regímenes', items:REGIMENES},{name:'Usos CFDI', items:USOS_CFDI},{name:'Formas de pago', items:FORMAS_PAGO},{name:'Métodos de pago', items:METODOS_PAGO}]
const negocioActivo = computed(() => negocios.items.find(n => n.id === negocioSel.value) || {})
const emisorActivo = computed(() => ({ rfc: negocioActivo.value.rfc, nombre: negocioActivo.value.nombre, regimen: negocioActivo.value.regimen, cp: negocioActivo.value.cp }))

function abrirWizard() {
  negocioSel.value = negocios.items[0]?.id || ''
  showWizard.value = true
}

async function submitGlobal(payload) {
  if (!negocioSel.value) return toast.error('Selecciona un negocio.')
  const folios = payload.foliosConsolidados || []
  const r = await facturas.timbrarGlobal({ ...payload, negocioId: negocioSel.value })
  if (!r.ok) return toast.error(r.error || 'No se pudo timbrar la factura global')
  if (folios.length) await bloquearTicketsPorGlobal(folios, r.data.id)
  showWizard.value = false
  toast.success({
    title: 'Factura global timbrada',
    message: `Folio ${r.data.serie}-${r.data.folio} · ${folios.length} ticket(s) consolidado(s)`,
  })
  await facturas.fetch()
}
</script>

<template>
  <AppLayout>
    <div class="page-header">
      <div><h1 class="page-title">Administración</h1><p class="page-subtitle">Métricas globales, facturas consolidadas y control de plataforma</p></div>
      <button class="btn btn-primary" @click="abrirWizard"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>Emitir factura global</button>
    </div>

    <div class="grid kpi-grid section-block">
      <StatCard label="Facturas emitidas" :value="facturas.items.length" tone="brand" />
      <StatCard label="Canceladas" :value="facturas.items.filter(f=>f.estado==='cancelada').length" tone="coral" />
      <StatCard label="Monto total" :value="formatMoney(totalMonto)" tone="cyan" />
      <StatCard label="Negocios activos" :value="negocios.items.filter(n=>n.activo).length" tone="purple" />
    </div>

    <div class="tabs">
      <button class="tab" :class="{active: tab==='globales'}" @click="tab='globales'">Facturas globales</button>
      <button class="tab" :class="{active: tab==='auditoria'}" @click="tab='auditoria'">Auditoría</button>
      <button class="tab" :class="{active: tab==='catalogos'}" @click="tab='catalogos'">Catálogos SAT</button>
    </div>

    <div v-if="tab==='globales'" class="tab-panel card">
      <div v-if="!globales.length"><EmptyState title="No hay facturas globales" description="Las facturas consolidadas por negocio o período se listarán aquí." /></div>
      <div v-else class="table-wrap" style="border:none;border-radius:0">
        <table class="table"><thead><tr><th>Folio</th><th>Negocio</th><th>Período</th><th>Fecha</th><th>Estado</th><th class="text-right">Total</th></tr></thead>
          <tbody><tr v-for="f in globales" :key="f.id"><td class="mono">{{ f.serie }}-{{ f.folio }}</td><td>{{ f.emisor?.nombre }}</td><td class="text-muted">{{ f.periodicidad || 'Mensual' }} {{ f.meses || '' }}/{{ f.anio || '' }}</td><td class="text-muted">{{ formatDate(f.fecha) }}</td><td><StatusBadge :status="f.estado" /></td><td class="text-right" style="font-weight:600">{{ formatMoney(f.total) }}</td></tr></tbody>
        </table>
      </div>
    </div>

    <div v-else-if="tab==='auditoria'" class="tab-panel card">
      <div v-if="!auditoria.length"><EmptyState title="Sin eventos registrados" description="Las acciones relevantes de la plataforma aparecerán en la bitácora." /></div>
      <div v-else class="table-wrap" style="border:none;border-radius:0">
        <table class="table"><thead><tr><th>Fecha</th><th>Usuario</th><th>Acción</th><th>Detalle</th></tr></thead>
          <tbody><tr v-for="a in auditoria" :key="a.id"><td class="text-muted">{{ formatDateTime(a.fecha) }}</td><td>{{ a.usuario }}</td><td><span class="badge badge-accent">{{ a.accion }}</span></td><td class="text-muted">{{ a.detalle }}</td></tr></tbody>
        </table>
      </div>
    </div>

    <div v-else class="tab-panel">
      <div class="grid" style="grid-template-columns:repeat(2,minmax(0,1fr));gap:20px">
        <div class="card" v-for="c in cats" :key="c.name">
          <div class="card-header"><h3 style="font-size:16px;font-weight:600">{{ c.name }}</h3></div>
          <div class="table-wrap" style="border:none;border-radius:0"><table class="table"><thead><tr><th>Clave</th><th>Descripción</th></tr></thead><tbody><tr v-for="i in c.items.slice(0,6)" :key="i.id"><td class="mono text-muted">{{ i.id }}</td><td>{{ i.nombre }}</td></tr></tbody></table></div>
        </div>
      </div>
    </div>
    <BaseModal :open="showWizard" title="Emitir factura global" size="lg" @close="showWizard = false">
      <div class="field" style="margin-bottom:16px">
        <label for="adm-negocio">Negocio emisor</label>
        <SelectField id="adm-negocio" v-model="negocioSel">
          <option v-for="n in negocios.items" :key="n.id" :value="n.id">{{ n.nombre }} ({{ n.rfc }})</option>
        </SelectField>
      </div>
      <FacturaGlobalWizard
        v-if="negocioSel"
        :emisor="emisorActivo"
        :negocio-id="negocioSel"
        @submit="submitGlobal"
        @cancel="showWizard = false"
      />
    </BaseModal>
  </AppLayout>
</template>
