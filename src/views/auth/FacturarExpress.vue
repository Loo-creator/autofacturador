<script setup>
/**
 * Facturación sin registro — flujo express de una sola pantalla (inspirado en
 * Soriana "Facturación Express" y digiTicket): folio + datos fiscales en la misma
 * vista, vista previa del CFDI en vivo y un único CTA de emisión.
 */
import { ref, reactive, computed, watch, onMounted } from 'vue'
import SelectField from '@/components/ui/SelectField.vue'
import { timbrarFactura, descargarXML, descargarPDF } from '@/services/factura.service'
import { downloadBlob } from '@/utils/formatters'
import BrandMark from '@/components/ui/BrandMark.vue'
import { useToast } from '@/composables/useToast'
import { REGIMENES, USOS_CFDI } from '@/utils/satCatalogs'
import {
  validarReceptor, tipoPersona, regimenesPara, usosDisponibles as usosDisponiblesPorRegimen,
} from '@/utils/cfdiValidations'
import { useTicket } from '@/composables/useTicket'
import { useEmision } from '@/composables/useEmision'
import { FOLIOS_DEMO } from '@/mocks/tickets.mock'
import ValidacionRfcInput from '@/components/cfdi/ValidacionRfcInput.vue'
import TicketStatusCard from '@/components/cfdi/TicketStatusCard.vue'
import VistaPreviaCfdi from '@/components/cfdi/VistaPreviaCfdi.vue'

const toast = useToast()
const {
  folio, ticket, negocio, evaluacion, loading: buscandoTicket, error: ticketError, estado, limpiar,
  buscar: buscarTicketEnStore,
} = useTicket()
const step = ref(1) // 1 = captura | 2 = comprobante
const emitiendo = ref(false)
const factura = ref(null)
const csfValidez = ref(null)
const regimenManual = ref(false)
const recordar = ref(true)

const receptor = reactive({
  rfc: '', nombre: '', regimen: '616', cp: '', usoCfdi: 'G03', correo: '',
})

/* ── Validaciones fiscales del receptor (reglas del SAT) ───────────────── */
const validacion = computed(() => validarReceptor({
  rfc: receptor.rfc,
  nombre: receptor.nombre,
  regimen: receptor.regimen,
  usoCfdi: receptor.usoCfdi,
  cp: receptor.cp,
  correo: receptor.correo,
}))

/** Errores por campo, para mostrarlos junto al input. */
const errorDe = (campo) => validacion.value.errores.find(e => e.campo === campo)?.mensaje || ''
const avisoDe = (campo) => validacion.value.avisos.find(a => a.campo === campo)?.mensaje || ''

/** El RFC determina el tipo de persona → el régimen sólo ofrece los que aplican. */
const tipoRfc = computed(() => tipoPersona(receptor.rfc))
const regimenesDisponibles = computed(() => {
  const lista = REGIMENES.filter(r => !tipoRfc.value || regimenesPara(tipoRfc.value).includes(r.id))
  return lista.length ? lista : REGIMENES
})

/** El uso de CFDI se filtra por régimen fiscal. */
const usosDisponibles = computed(() => {
  const permitidos = usosDisponiblesPorRegimen(receptor.regimen)
  return USOS_CFDI.filter(u => permitidos.includes(u.id))
})

/** Al cambiar el RFC se reencuadra el régimen y el uso para no dejar combinaciones inválidas. */
watch(() => receptor.rfc, (rfc) => {
  const tipo = tipoPersona(rfc)
  if (!tipo) return
  const reg = regimenesPara(tipo)
  if (reg.length && !reg.includes(receptor.regimen)) {
    receptor.regimen = reg[0]
    regimenManual.value = false
  }
})

watch(() => receptor.regimen, () => {
  const permitidos = usosDisponiblesPorRegimen(receptor.regimen)
  if (permitidos.length && !permitidos.includes(receptor.usoCfdi)) {
    receptor.usoCfdi = permitidos.includes('G03') ? 'G03' : permitidos[0]
  }
})

const ticketCtx = computed(() => ({ ticket: ticket.value, evaluacion: evaluacion.value }))
const { validaciones: validacionesBase, motivoBloqueo: motivoBase } = useEmision(receptor, ticketCtx, csfValidez)

/** El botón sólo se habilita si NO hay errores fiscales ni del ticket. */
const validaciones = computed(() => [
  ...validacion.value.errores.map(e => ({ nivel: 'error', mensaje: e.mensaje })),
  ...validacion.value.avisos.map(a => ({ nivel: 'warning', mensaje: a.mensaje })),
  ...validacionesBase.value,
])
const puedeEmitir = computed(() => validacion.value.ok && validacionesBase.value.length === 0)
const motivoBloqueo = computed(() => {
  if (!validacion.value.ok) return validacion.value.errores[0].mensaje
  return motivoBase.value
})

const emisor = computed(() => ({
  rfc: negocio.value?.rfc || '',
  nombre: negocio.value?.nombre || '',
  regimen: negocio.value?.regimen || '',
  cp: negocio.value?.cp || '',
  serie: negocio.value?.serie || '',
}))

const fechaCompraTexto = computed(() => {
  if (!ticket.value?.fecha) return '—'
  return new Date(ticket.value.fecha).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: '2-digit' })
})

onMounted(() => {
  // Datos fiscales guardados en una compra anterior (Liverpool/Fiscalify guardan una sola vez).
  try {
    const guardados = JSON.parse(localStorage.getItem('ff_datos_fiscales') || 'null')
    if (guardados?.rfc) {
      Object.assign(receptor, guardados)
      regimenManual.value = true
    }
  } catch { /* ignore */ }
})

function onRegimenManual() { regimenManual.value = true }

function onCsfValidity(v) {
  csfValidez.value = v
  const csf = v?.csf
  // RFC fuera del catálogo de demostración: se sugiere el régimen según el tipo de persona
  if (!csf) {
    if (v?.sugerenciaRegimen && !regimenManual.value) receptor.regimen = v.sugerenciaRegimen
    return
  }
  if (!receptor.nombre.trim()) receptor.nombre = csf.razonSocial
  if (!receptor.cp.trim()) receptor.cp = csf.cp
  if (!regimenManual.value) receptor.regimen = csf.regimen
}

async function buscarTicket() {
  const res = await buscarTicketEnStore()
  if (!res.ok) {
    toast.error({ title: 'No pudimos localizar el ticket', message: ticketError.value })
    return
  }
  const t = ticket.value
  if (t?.usoCfdi) receptor.usoCfdi = t.usoCfdi
  toast.success({ title: 'Ticket localizado', message: evaluacion.value?.mensaje || '' })
}

function usarFolio(f) {
  folio.value = f
  buscarTicket()
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
      rfc: emisor.value.rfc,
      nombre: emisor.value.nombre,
      regimen: emisor.value.regimen,
      cp: emisor.value.cp,
      serie: emisor.value.serie,
    },
    receptor: {
      rfc: receptor.rfc.toUpperCase(),
      nombre: receptor.nombre,
      regimen: receptor.regimen,
      cp: receptor.cp,
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

  if (!res.ok) {
    ticketError.value = res.error
    toast.error({ title: 'No se pudo timbrar', message: res.error })
    return
  }

  factura.value = res.data
  if (recordar.value) {
    localStorage.setItem('ff_datos_fiscales', JSON.stringify({
      rfc: receptor.rfc.toUpperCase(), nombre: receptor.nombre,
      regimen: receptor.regimen, cp: receptor.cp, usoCfdi: receptor.usoCfdi,
    }))
  }
  toast.success({ title: 'CFDI emitido', message: `Folio ${res.data.serie}-${res.data.folio}` })
  step.value = 2
}

async function bajarXML() {
  const r = await descargarXML(factura.value.id)
  if (r.ok) downloadBlob(r.data.content, r.data.filename, 'application/xml')
}
async function bajarPDF() {
  const r = await descargarPDF(factura.value.id)
  if (r.ok) downloadBlob(r.data.blob, r.data.filename, 'application/pdf')
}
function enviarCorreo() {
  toast.info({ title: 'Envío por correo', message: 'El CFDI se enviaría al correo registrado del cliente (mock).' })
}
function otroTicket() {
  step.value = 1
  factura.value = null
  limpiar()
  csfValidez.value = null
}
</script>

<template>
  <div class="express">
    <header class="express__top">
      <router-link to="/login" class="brand">
        <BrandMark :size="42" />
        <span>
          <span class="brand__name">Autofacturación</span>
          <span class="brand__sub">Facturación sin registro · CFDI 4.0</span>
        </span>
      </router-link>
      <router-link to="/login" class="btn btn-ghost btn-sm">Volver al inicio</router-link>
    </header>

    <!-- ── Paso 1 · Captura ───────────────────────────────────────────────── -->
    <main v-if="step === 1" class="express__grid">
      <section class="panel">
        <div class="panel__head">
          <span class="panel__step">1</span>
          <div>
            <h1>Datos de tu compra</h1>
            <p class="text-muted">Localiza tu ticket y captura tus datos fiscales en la misma pantalla.</p>
          </div>
        </div>

        <div class="field">
          <label for="folio">Folio del ticket</label>
          <div class="folio-row">
            <input
              id="folio"
              v-model="folio"
              class="input mono"
              placeholder="Ej. 2001"
              inputmode="numeric"
              @keyup.enter="buscarTicket"
            />
            <button class="btn btn-primary" :disabled="buscandoTicket" @click="buscarTicket">
              {{ buscandoTicket ? 'Buscando…' : 'Buscar' }}
            </button>
          </div>
          <div class="hint">El folio viene impreso en tu comprobante de compra.</div>
          <div class="demos">
            <span class="demos__label">Prueba con:</span>
            <button v-for="d in FOLIOS_DEMO" :key="d.folio" type="button" class="demos__chip" :title="d.etiqueta" @click="usarFolio(d.folio)">
              {{ d.folio }}
            </button>
          </div>
        </div>

        <TicketStatusCard
          v-if="evaluacion"
          :estado="estado"
          :ticket="ticket"
          :evaluacion="evaluacion"
          @reintentar="limpiar"
        />

        <div v-if="ticket" class="ticket-summary">
          <div class="ticket-summary__row">
            <span class="text-muted">Establecimiento</span>
            <span class="cell-main">{{ emisor.nombre }}</span>
          </div>
          <div class="ticket-summary__row">
            <span class="text-muted">Fecha de compra</span>
            <span>{{ fechaCompraTexto }}</span>
          </div>
          <div class="ticket-summary__row">
            <span class="text-muted">Conceptos</span>
            <span>{{ ticket.conceptos.length }} concepto(s)</span>
          </div>
          <ul class="ticket-summary__items">
            <li v-for="(c, i) in ticket.conceptos" :key="i">
              {{ c.cantidad }} × {{ c.descripcion }}
              <span class="mono">— ${{ Number(c.valorUnitario).toFixed(2) }}</span>
            </li>
          </ul>
        </div>

        <hr class="divider" />

        <div class="panel__head">
          <span class="panel__step">2</span>
          <div>
            <h2>Tus datos fiscales</h2>
            <p class="text-muted">Se validan contra tu Constancia de Situación Fiscal antes de emitir.</p>
          </div>
        </div>

        <div class="form-grid">
          <div class="field span-2">
            <ValidacionRfcInput
              v-model="receptor.rfc"
              :razon-social="receptor.nombre"
              :regimen="receptor.regimen"
              :cp="receptor.cp"
              input-id="express-rfc"
              @update:validity="onCsfValidity"
            />
          </div>

          <div class="field span-2">
            <label for="express-nombre">Nombre / Razón social</label>
            <input id="express-nombre" v-model="receptor.nombre" class="input" placeholder="Como aparece en tu CSF" />
          </div>

          <div class="field">
            <label for="express-regimen">Régimen fiscal</label>
            <SelectField id="express-regimen" v-model="receptor.regimen" @change="onRegimenManual">
              <option v-for="r in regimenesDisponibles" :key="r.id" :value="r.id">{{ r.id }} - {{ r.nombre }}</option>
            </SelectField>
            <p v-if="errorDe('regimen')" class="field-error">{{ errorDe('regimen') }}</p>
            <div v-else-if="tipoRfc" class="hint">
              Tu RFC es de persona {{ tipoRfc === 'moral' ? 'moral' : 'física' }}: sólo se ofrecen los regímenes correspondientes.
            </div>
          </div>

          <div class="field">
            <label for="express-cp">Código postal</label>
            <input id="express-cp" v-model="receptor.cp" class="input mono" maxlength="5" inputmode="numeric" placeholder="5 dígitos" />
          </div>

          <div class="field span-2">
            <label for="express-uso">Uso del CFDI</label>
            <SelectField id="express-uso" v-model="receptor.usoCfdi">
              <option v-for="u in usosDisponibles" :key="u.id" :value="u.id">{{ u.id }} - {{ u.nombre }}</option>
            </SelectField>
            <p v-if="errorDe('usoCfdi')" class="field-error">{{ errorDe('usoCfdi') }}</p>
            <p v-else-if="avisoDe('usoCfdi')" class="field-warning">{{ avisoDe('usoCfdi') }}</p>
            <div v-else class="hint">Se muestran sólo los usos permitidos para el régimen {{ receptor.regimen }}.</div>
          </div>

          <div class="field span-2">
            <label for="express-correo">Correo para recibir el comprobante</label>
            <input id="express-correo" v-model="receptor.correo" class="input" type="email" placeholder="tu@correo.mx" autocomplete="email" />
            <p v-if="errorDe('correo')" class="field-error">{{ errorDe('correo') }}</p>
            <div v-else class="hint">Te enviaremos el XML y el PDF por este correo.</div>
          </div>
        </div>

        <label class="remember">
          <input v-model="recordar" type="checkbox" />
          <span>Recordar mis datos fiscales para la próxima compra</span>
        </label>
      </section>

      <aside class="preview-col">
        <div class="preview-col__head">
          <h2>Vista previa del comprobante</h2>
          <p class="text-muted">Así se emitirá tu CFDI 4.0.</p>
        </div>

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

        <div class="cta">
          <p v-if="motivoBloqueo" class="cta__reason">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></svg>
            {{ motivoBloqueo }}
          </p>
          <p v-else class="cta__reason cta__reason--ok">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5" /></svg>
            Todo listo para emitir tu comprobante.
          </p>
          <button class="btn btn-primary btn-lg" :disabled="!puedeEmitir || emitiendo" @click="emitir">
            {{ emitiendo ? 'Timbrando…' : 'Emitir CFDI' }}
          </button>
          <p class="cta__note">El timbrado es FREE: no requiere cuenta ni tarjeta.</p>
        </div>
      </aside>
    </main>

    <!-- ── Paso 2 · Comprobante emitido ──────────────────────────────────── -->
    <main v-else class="done">
      <div class="done__card">
        <span class="done__icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
        </span>
        <h1>¡Comprobante emitido!</h1>
        <p class="text-muted">Conserva el UUID y descarga el XML para presentarlo ante el SAT.</p>

        <dl class="done__grid">
          <div><dt>Folio</dt><dd class="mono">{{ factura.serie }}-{{ factura.folio }}</dd></div>
          <div><dt>Total</dt><dd class="mono">${{ Number(factura.total).toFixed(2) }} {{ factura.moneda }}</dd></div>
          <div><dt>UUID</dt><dd class="mono done__uuid">{{ factura.uuid }}</dd></div>
          <div><dt>Tipo CFDI</dt><dd>{{ factura.tipoComprobante }} · Ingreso</dd></div>
        </dl>

        <div class="done__actions">
          <button class="btn btn-primary" @click="bajarXML">Descargar XML</button>
          <button class="btn btn-secondary" @click="bajarPDF">Descargar PDF</button>
          <button class="btn btn-ghost" @click="enviarCorreo">Enviar por correo</button>
        </div>

        <div class="done__foot">
          <button class="btn btn-ghost btn-sm" @click="otroTicket">Facturar otro ticket</button>
          <router-link to="/registro" class="btn btn-ghost btn-sm">Crear cuenta para guardar mi historial</router-link>
          <router-link to="/login" class="btn btn-ghost btn-sm">Ir al inicio</router-link>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.express {
  min-height: 100vh;
  padding: 20px 24px 48px;
  background: var(--grad-app), var(--bg);
  transition: background .35s ease;
  font-family: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif;
}

.express__top {
  max-width: 1240px; margin: 0 auto 22px;
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
}
.brand { display: flex; align-items: center; gap: 12px; text-decoration: none; }
.brand__name { display: block; font-size: 15px; font-weight: 700; color: var(--text); }
.brand__sub { display: block; font-size: 12px; color: var(--muted); }

.express__grid {
  max-width: 1240px; margin: 0 auto;
  display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.05fr); gap: 22px; align-items: start;
}

.panel, .preview-col {
  background: var(--glass-panel);
  border: 1px solid var(--glass-line);
  border-radius: 20px;
  box-shadow: 0 18px 44px rgba(17,24,39,.07);
}
.panel { padding: 24px; display: flex; flex-direction: column; gap: 18px; }
.preview-col { padding: 22px; display: flex; flex-direction: column; gap: 14px; position: sticky; top: 20px; }

.panel__head { display: flex; align-items: flex-start; gap: 12px; }
.panel__head h1 { margin: 0; font-size: 19px; font-weight: 700; }
.panel__head h2 { margin: 0; font-size: 17px; font-weight: 700; }
.panel__head p { margin: 3px 0 0; font-size: 13px; }
.panel__step {
  width: 28px; height: 28px; flex-shrink: 0; border-radius: 9px;
  display: inline-flex; align-items: center; justify-content: center;
  background: var(--brand-primary); color: #fff; font-size: 13px; font-weight: 700;
}

.folio-row { display: flex; gap: 8px; }
.folio-row .input { flex: 1; }

.demos { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-top: 4px; }
.demos__label { font-size: 11px; color: var(--muted-2); font-weight: 600; text-transform: uppercase; letter-spacing: .05em; }
.demos__chip {
  border: 1px solid var(--border); background: var(--control-bg); color: var(--text-soft);
  border-radius: 999px; padding: 3px 10px; font-size: 11px; font-family: var(--font-mono); cursor: pointer;
  transition: all var(--t-fast);
}
.demos__chip:hover { border-color: var(--brand-primary); color: var(--brand-primary); }

.ticket-summary {
  background: var(--bg-subtle); border: 1px solid var(--border); border-radius: 14px; padding: 14px 16px;
}
.ticket-summary__row { display: flex; justify-content: space-between; gap: 12px; font-size: 13px; padding: 3px 0; }
.ticket-summary__items { margin-top: 10px; border-top: 1px solid var(--border); padding-top: 8px; }
.ticket-summary__items li {
  display: flex; justify-content: space-between; gap: 12px;
  font-size: 12.5px; color: var(--text-soft); padding: 3px 0;
}

.remember { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-soft); cursor: pointer; }
.remember input { accent-color: var(--brand-primary); width: 15px; height: 15px; }

.preview-col__head h2 { margin: 0; font-size: 16px; font-weight: 700; }
.preview-col__head p { margin: 3px 0 0; font-size: 13px; }

.cta { display: flex; flex-direction: column; gap: 10px; margin-top: 2px; }
.cta__reason {
  display: flex; align-items: flex-start; gap: 8px; margin: 0;
  font-size: 12.5px; line-height: 1.45; color: var(--warning);
}
.cta__reason svg { width: 16px; height: 16px; flex-shrink: 0; margin-top: 1px; }
.cta__reason--ok { color: var(--success); }
.cta .btn-lg { width: 100%; height: 50px; font-size: 15px; border-radius: 12px; }
.cta__note { margin: 0; text-align: center; font-size: 11.5px; color: var(--muted-2); }

.done { max-width: 720px; margin: 40px auto; }
.done__card {
  background: var(--glass-panel-strong);
  border: 1px solid var(--glass-line); border-radius: 22px; padding: 34px 30px; text-align: center;
  box-shadow: 0 20px 50px rgba(17,24,39,.08);
}
.done__icon {
  width: 60px; height: 60px; margin: 0 auto 16px; border-radius: 18px;
  background: var(--success-soft); color: var(--success);
  display: inline-flex; align-items: center; justify-content: center;
}
.done__icon svg { width: 30px; height: 30px; }
.done__card h1 { margin: 0 0 6px; font-size: 22px; }
.done__card > p { margin: 0; font-size: 14px; }
.done__grid {
  display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px;
  margin: 24px 0; text-align: left;
  background: var(--bg-subtle); border-radius: 14px; padding: 16px;
}
.done__grid dt { margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: var(--muted); font-weight: 600; }
.done__grid dd { margin: 3px 0 0; font-size: 14px; color: var(--text); font-weight: 500; word-break: break-all; }
.done__uuid { font-size: 11.5px !important; }
.done__actions { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
.done__foot { margin-top: 22px; padding-top: 18px; border-top: 1px solid var(--border); display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }

@media (max-width: 980px) {
  .express__grid { grid-template-columns: 1fr; }
  .preview-col { position: static; }
}
@media (max-width: 560px) {
  .express { padding: 16px 14px 36px; }
  .panel, .preview-col { padding: 18px 16px; border-radius: 16px; }
  .done__grid { grid-template-columns: 1fr; }
}
</style>
