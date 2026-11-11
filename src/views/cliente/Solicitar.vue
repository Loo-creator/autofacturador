<script setup>
/**
 * Solicitar factura (cliente registrado). Mismo dominio que el flujo express, pero
 * reutilizando los datos fiscales guardados en la cuenta y validando el ticket
 * contra la política de plazo del negocio.
 */
import { ref, reactive, computed } from 'vue'
import SelectField from '@/components/ui/SelectField.vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { timbrarFactura } from '@/services/factura.service'
import { useTicket } from '@/composables/useTicket'
import { useEmision } from '@/composables/useEmision'
import { REGIMENES, USOS_CFDI } from '@/utils/satCatalogs'
import ValidacionRfcInput from '@/components/cfdi/ValidacionRfcInput.vue'
import TicketStatusCard from '@/components/cfdi/TicketStatusCard.vue'
import VistaPreviaCfdi from '@/components/cfdi/VistaPreviaCfdi.vue'

const auth = useAuthStore()
const toast = useToast()
const { folio, ticket, negocio, evaluacion, loading, error: ticketError, estado, limpiar, buscar: buscarTicketEnStore } = useTicket()
const emitiendo = ref(false)
const csfValidez = ref(null)

const receptor = reactive({
  rfc: auth.user?.rfc || '',
  nombre: auth.user?.nombre || '',
  regimen: auth.user?.regimen || '616',
  cp: auth.user?.cp || '',
  usoCfdi: 'G03',
})

const ticketCtx = computed(() => ({ ticket: ticket.value, evaluacion: evaluacion.value }))
const { validaciones, puedeEmitir, motivoBloqueo } = useEmision(receptor, ticketCtx, csfValidez)

const emisor = computed(() => ({
  rfc: negocio.value?.rfc || '',
  nombre: negocio.value?.nombre || '',
  regimen: negocio.value?.regimen || '',
  cp: negocio.value?.cp || '',
  serie: negocio.value?.serie || '',
}))

async function buscarTicket() {
  const res = await buscarTicketEnStore()
  if (!res.ok) {
    toast.error({ title: 'No pudimos localizar el ticket', message: ticketError.value })
    return
  }
  if (ticket.value?.usoCfdi) receptor.usoCfdi = ticket.value.usoCfdi
  toast.success({ title: 'Ticket localizado', message: evaluacion.value?.mensaje || '' })
}

async function emitir() {
  if (!puedeEmitir.value) {
    toast.error({ title: 'No podemos emitir todavía', message: motivoBloqueo.value })
    return
  }
  emitiendo.value = true
  const res = await timbrarFactura({
    tipo: 'INGRESO',
    tipoComprobante: 'I',
    negocioId: negocio.value?.id,
    emisor: {
      rfc: emisor.value.rfc, nombre: emisor.value.nombre,
      regimen: emisor.value.regimen, cp: emisor.value.cp, serie: emisor.value.serie,
    },
    receptor: {
      rfc: receptor.rfc.toUpperCase(), nombre: receptor.nombre,
      regimen: receptor.regimen, cp: receptor.cp,
    },
    usoCfdi: receptor.usoCfdi,
    formaPago: ticket.value.formaPago || '01',
    metodoPago: ticket.value.metodoPago || 'PUE',
    moneda: 'MXN',
    tipoCambio: 1,
    conceptos: ticket.value.conceptos,
    ticketId: ticket.value.id,
  })
  emitiendo.value = false

  if (!res.ok) return toast.error({ title: 'No se pudo timbrar', message: res.error })

  toast.success({ title: 'Factura emitida', message: `Folio ${res.data.serie}-${res.data.folio}` })
  limpiar()
}
</script>

<template>
  <AppLayout>

    <div class="page-header">
      <div>
        <h1 class="page-title">Solicitar factura</h1>
        <p class="page-subtitle">Ingresa el folio de tu ticket de compra</p>
      </div>
      <router-link to="/cliente/facturas" class="btn btn-secondary">Ver mis facturas</router-link>
    </div>

    <div class="grid" style="grid-template-columns:minmax(0,1fr) minmax(0,1.05fr);align-items:start;gap:20px">
      <div class="card">
        <div class="card-body grid" style="gap:16px">
          <div class="field">
            <label for="cli-folio">Folio de ticket</label>
            <div style="display:flex;gap:8px">
              <input id="cli-folio" v-model="folio" class="input mono" placeholder="Ej. 2001" @keyup.enter="buscarTicket" />
              <button class="btn btn-primary" :disabled="loading" @click="buscarTicket">{{ loading ? 'Buscando…' : 'Buscar' }}</button>
            </div>
            <div class="hint">El folio viene impreso en tu comprobante de compra.</div>
          </div>

          <TicketStatusCard
            v-if="evaluacion"
            :estado="estado"
            :ticket="ticket"
            :evaluacion="evaluacion"
            @reintentar="limpiar"
          />

          <div v-if="ticket" class="card" style="background:var(--bg-subtle)">
            <div class="card-body" style="font-size:var(--fs-sm)">
              <strong>{{ emisor.nombre }}</strong>
              <div class="text-muted" style="margin-top:4px">Folio {{ ticket.folio }} · {{ ticket.conceptos.length }} concepto(s)</div>
              <ul style="margin-top:8px">
                <li v-for="(c, i) in ticket.conceptos" :key="i" style="display:flex;justify-content:space-between;padding:2px 0">
                  <span>{{ c.cantidad }} × {{ c.descripcion }}</span>
                  <span class="mono">${{ Number(c.valorUnitario).toFixed(2) }}</span>
                </li>
              </ul>
            </div>
          </div>

          <hr class="divider" />

          <div class="form-grid">
            <div class="field span-2">
              <ValidacionRfcInput
                v-model="receptor.rfc"
                :razon-social="receptor.nombre"
                :regimen="receptor.regimen"
                :cp="receptor.cp"
                input-id="cli-rfc"
                hint="Usamos los datos de tu cuenta; puedes corregirlos si tu CSF cambió."
                @update:validity="csfValidez = $event"
              />
            </div>
            <div class="field span-2">
              <label for="cli-nombre">Nombre / Razón social</label>
              <input id="cli-nombre" v-model="receptor.nombre" class="input" />
            </div>
            <div class="field">
              <label for="cli-regimen">Régimen fiscal</label>
              <SelectField id="cli-regimen" v-model="receptor.regimen">
                <option v-for="r in REGIMENES" :key="r.id" :value="r.id">{{ r.id }} - {{ r.nombre }}</option>
              </SelectField>
            </div>
            <div class="field">
              <label for="cli-cp">Código postal</label>
              <input id="cli-cp" v-model="receptor.cp" class="input mono" maxlength="5" />
            </div>
            <div class="field span-2">
              <label for="cli-uso">Uso del CFDI</label>
              <SelectField id="cli-uso" v-model="receptor.usoCfdi">
                <option v-for="u in USOS_CFDI" :key="u.id" :value="u.id">{{ u.id }} - {{ u.nombre }}</option>
              </SelectField>
            </div>
          </div>

          <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap">
            <p v-if="motivoBloqueo" class="text-muted" style="font-size:var(--fs-xs);margin:0">{{ motivoBloqueo }}</p>
            <span v-else class="text-success" style="font-size:var(--fs-xs)">Todo listo para emitir.</span>
            <button class="btn btn-primary" :disabled="!puedeEmitir || emitiendo" @click="emitir">
              {{ emitiendo ? 'Timbrando…' : 'Emitir factura' }}
            </button>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><h3 style="font-size:16px;font-weight:600">Vista previa del comprobante</h3></div>
        <div class="card-body">
          <VistaPreviaCfdi
            :emisor="emisor"
            :receptor="receptor"
            :uso-cfdi="receptor.usoCfdi"
            :forma-pago="ticket?.formaPago || '01'"
            :metodo-pago="ticket?.metodoPago || 'PUE'"
            :moneda="'MXN'"
            :tipo-cambio="1"
            :conceptos="ticket?.conceptos || []"
            :folio="ticket?.folio || ''"
            :serie="emisor.serie"
            :validaciones="validaciones"
          />
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
@media (max-width: 1024px) {
  .grid { grid-template-columns: 1fr !important; }
}
</style>
