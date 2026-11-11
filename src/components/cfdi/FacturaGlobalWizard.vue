<script setup>
/**
 * Wizard de factura global (CFDI de consolidate al público en general).
 *
 * Paso 1 → Periodo: **rango de fechas** (desde/hasta) + periodicidad + mes/año del CFDI.
 * Paso 2 → Consolidación: tickets reales del periodo seleccionado (sólo los facturables).
 * Paso 3 → Timbrado: FormFactura con el CFDI global listo para enviar.
 */
import { ref, computed, watch } from 'vue'
import SelectField from '@/components/ui/SelectField.vue'
import FormFactura from './FormFactura.vue'
import { PERIODICIDADES } from '@/utils/satCatalogs'
import { listTickets } from '@/services/ticket.service'
import { filtrarTickets } from '@/utils/ticketFilters'
import { formatMoney, formatDate } from '@/utils/formatters'

const props = defineProps({
  emisor: { type: Object, default: () => ({}) },
  negocioId: { type: String, default: '' },
  tickets: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false }
})
const emit = defineEmits(['submit', 'cancel'])

const step = ref(1)

function primerDiaDelMes(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}
function ultimoDiaDelMes(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10)
}

const config = ref({
  desde: primerDiaDelMes(),
  hasta: ultimoDiaDelMes(),
  periodicidad: '04',
  meses: String(new Date().getMonth() + 1).padStart(2, '0'),
  anio: String(new Date().getFullYear()),
})

const todosTickets = ref([])
const cargando = ref(false)

async function cargarTickets() {
  cargando.value = true
  const res = await listTickets(props.negocioId)
  cargando.value = false
  todosTickets.value = res.ok ? res.data : props.tickets
}

// Al abrir el wizard se cargan los tickets del negocio.
watch(() => props.negocioId, cargarTickets, { immediate: true })

/** Tickets del periodo: sólo los que aún se pueden facturar de forma individual. */
const ticketsPeriodo = computed(() => filtrarTickets(todosTickets.value, {
  desde: config.value.desde,
  hasta: config.value.hasta,
  estado: 'disponible',
}))

/** Tickets ya consolidados dentro del rango (informativo). */
const ticketsConsolidados = computed(() => todosTickets.value.filter(t =>
  (t.fecha || '').slice(0, 10) >= config.value.desde &&
  (t.fecha || '').slice(0, 10) <= config.value.hasta &&
  ['facturado_global', 'facturado'].includes(t.estado)
))

const totalPeriodo = computed(() => ticketsPeriodo.value.reduce((s, t) => s + Number(t.total || 0), 0))
const subtotalPeriodo = computed(() => ticketsPeriodo.value.reduce((s, t) => s + Number(t.subtotal || 0), 0))
const ivaPeriodo = computed(() => totalPeriodo.value - subtotalPeriodo.value)

const conceptosConsolidados = computed(() => {
  const total = totalPeriodo.value
  const subtotal = subtotalPeriodo.value
  const descripcion = ticketsPeriodo.value.length
    ? `Venta al público en general - ${ticketsPeriodo.value.length} ticket(s) del ${config.value.desde} al ${config.value.hasta}`
    : `Venta al público en general - ${config.value.desde} al ${config.value.hasta}`
  return [{
    claveProdServ: '01010101', claveUnidad: 'ACT', unidad: 'Actividad', cantidad: 1,
    descripcion, valorUnitario: Number(subtotal.toFixed(2)), descuento: 0,
    iva: subtotal > 0 ? 16 : 0, objetoImp: '02',
  }]
})

const initial = computed(() => ({
  emisor: props.emisor,
  receptor: { rfc: 'XAXX010101000', nombre: 'PÚBLICO EN GENERAL', regimen: '616', cp: props.emisor?.cp || '' },
  usoCfdi: 'S01',
  formaPago: '01',
  metodoPago: 'PUE',
  moneda: 'MXN',
  tipoCambio: 1,
  conceptos: conceptosConsolidados.value,
  periodicidad: config.value.periodicidad,
  meses: config.value.meses,
  anio: config.value.anio,
  ticketsConsolidados: ticketsPeriodo.value.length,
  foliosConsolidados: ticketsPeriodo.value.map(t => t.folio),
  totalConsolidado: totalPeriodo.value,
}))

const nombrePeriodicidad = computed(() => PERIODICIDADES.find(p => p.id === config.value.periodicidad)?.nombre || '')

function validarPeriodo() {
  if (!config.value.desde || !config.value.hasta) return 'Selecciona el rango de fechas del periodo.'
  if (config.value.desde > config.value.hasta) return 'La fecha "desde" no puede ser posterior a "hasta".'
  if (!config.value.meses || !config.value.anio) return 'Indica el mes y el año que se informarán en el CFDI global.'
  return ''
}

function submit(payload) {
  emit('submit', { ...payload, foliosConsolidados: ticketsPeriodo.value.map(t => t.folio) })
}
</script>

<template>
  <div class="gw">
    <div class="stepper">
      <div class="step" :class="{ active: step === 1, done: step > 1 }"><span class="step-num">1</span> Periodo</div>
      <div class="step" :class="{ active: step === 2, done: step > 2 }"><span class="step-num">2</span> Consolidación</div>
      <div class="step" :class="{ active: step === 3 }"><span class="step-num">3</span> Timbrado</div>
    </div>

    <!-- ── Paso 1: rango de fechas + periodicidad ───────────────────────── -->
    <div v-if="step === 1" class="card">
      <div class="card-header">
        <h3>Selecciona el periodo que se va a consolidar</h3>
        <p class="text-muted" style="font-size:var(--fs-sm);margin-top:2px">
          Se emitirá un CFDI global con RFC genérico XAXX010101000 por todas las ventas del rango.
        </p>
      </div>
      <div class="card-body">
        <div class="form-grid">
          <div class="field">
            <label for="gw-desde">Desde</label>
            <input id="gw-desde" v-model="config.desde" class="input" type="date" />
          </div>
          <div class="field">
            <label for="gw-hasta">Hasta</label>
            <input id="gw-hasta" v-model="config.hasta" class="input" type="date" />
          </div>
          <div class="field span-2">
            <label for="gw-periodicidad">Periodicidad del CFDI global</label>
            <SelectField id="gw-periodicidad" v-model="config.periodicidad">
              <option v-for="p in PERIODICIDADES" :key="p.id" :value="p.id">{{ p.id }} - {{ p.nombre }}</option>
            </SelectField>
          </div>
          <div class="field">
            <label for="gw-mes">Mes que se informa</label>
            <input id="gw-mes" v-model="config.meses" class="input" maxlength="2" placeholder="01 - 12" />
          </div>
          <div class="field">
            <label for="gw-anio">Año</label>
            <input id="gw-anio" v-model="config.anio" class="input" maxlength="4" placeholder="2026" />
          </div>
          <div class="field span-2">
            <div class="hint">
              Periodo a consolidar: <strong>{{ config.desde || '—' }}</strong> a <strong>{{ config.hasta || '—' }}</strong>
              · {{ nombrePeriodicidad }}
            </div>
          </div>
        </div>

        <p v-if="validarPeriodo()" class="gw-error">{{ validarPeriodo() }}</p>
      </div>
      <div class="card-footer" style="display:flex;justify-content:space-between">
        <button class="btn btn-secondary" @click="emit('cancel')">Cancelar</button>
        <button class="btn btn-primary" :disabled="!!validarPeriodo()" @click="step = 2">Continuar</button>
      </div>
    </div>

    <!-- ── Paso 2: consolidación ────────────────────────────────────────── -->
    <div v-if="step === 2" class="card">
      <div class="card-header">
        <h3>Tickets a consolidar</h3>
        <p class="text-muted" style="font-size:var(--fs-sm);margin-top:2px">
          Sólo se consolidan los tickets <strong>disponibles</strong> del rango. Los folios consolidados quedan bloqueados.
        </p>
      </div>
      <div class="card-body">
        <div class="gw-summary">
          <div><span>Tickets a consolidar</span><strong>{{ ticketsPeriodo.length }}</strong></div>
          <div><span>Subtotal</span><strong>{{ formatMoney(subtotalPeriodo) }}</strong></div>
          <div><span>IVA</span><strong>{{ formatMoney(ivaPeriodo) }}</strong></div>
          <div class="is-total"><span>Total</span><strong>{{ formatMoney(totalPeriodo) }}</strong></div>
        </div>

        <div v-if="cargando" class="gw-loading">Cargando tickets del periodo…</div>

        <div v-else-if="ticketsPeriodo.length" class="table-wrap" style="margin-top:16px">
          <table class="table">
            <thead><tr><th>Folio</th><th>Fecha</th><th>Conceptos</th><th class="text-right">Total</th></tr></thead>
            <tbody>
              <tr v-for="t in ticketsPeriodo" :key="t.id">
                <td class="mono">{{ t.folio }}</td>
                <td class="text-muted">{{ formatDate(t.fecha) }}</td>
                <td class="text-muted">{{ t.conceptos.map(c => c.descripcion).join(', ') }}</td>
                <td class="text-right" style="font-weight:600">{{ formatMoney(t.total) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-else class="empty">
          No hay tickets disponibles en el rango seleccionado.<br />
          <span style="font-size:var(--fs-sm)">Amplía el rango o crea tickets de venta desde el punto de venta.</span>
        </div>

        <div v-if="ticketsConsolidados.length" class="gw-note">
          <strong>{{ ticketsConsolidados.length }}</strong> ticket(s) del rango ya están facturados y no se volverán a consolidar.
        </div>
      </div>
      <div class="card-footer" style="display:flex;justify-content:space-between">
        <button class="btn btn-secondary" @click="step = 1">Atrás</button>
        <button class="btn btn-primary" :disabled="!ticketsPeriodo.length" @click="step = 3">
          Revisar comprobante
        </button>
      </div>
    </div>

    <!-- ── Paso 3: timbrado ─────────────────────────────────────────────── -->
    <div v-if="step === 3">
      <FormFactura tipo="GLOBAL" :initial="initial" :readonly-emisor="true" @submit="submit">
        <template #actions>
          <button type="button" class="btn btn-secondary" @click="step = 2">Atrás</button>
        </template>
      </FormFactura>
    </div>
  </div>
</template>

<style scoped>
.gw { display: flex; flex-direction: column; gap: 16px; }

.gw-summary {
  display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px;
  padding: 14px 16px; border-radius: 12px; background: var(--bg-subtle);
}
.gw-summary div { display: flex; flex-direction: column; gap: 3px; }
.gw-summary span { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; color: var(--muted); }
.gw-summary strong { font-size: 15px; color: var(--text); }
.gw-summary .is-total strong { font-size: 17px; color: var(--brand-primary); }

.gw-error { margin: 12px 0 0; font-size: var(--fs-sm); color: var(--danger); }
.gw-loading { padding: 28px; text-align: center; color: var(--muted); font-size: var(--fs-sm); }
.gw-note {
  margin-top: 14px; padding: 10px 14px; border-radius: 10px;
  background: var(--warning-soft); color: var(--warning); font-size: var(--fs-sm);
}

@media (max-width: 768px) {
  .gw-summary { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>
