<script setup>
/**
 * Vista previa del CFDI antes de timbrar (estilo Soriana).
 * Muestra exactamente lo que se enviará al PAC/SAT: emisor, receptor, uso CFDI,
 * forma/método de pago, conceptos y totales, más el semáforo de validaciones.
 */
import { computed } from 'vue'
import { calcTotales, formatMoney, formatDate } from '@/utils/formatters'
import { FORMAS_PAGO, METODOS_PAGO, USOS_CFDI, TIPOS_CFDI } from '@/utils/satCatalogs'

const props = defineProps({
  emisor: { type: Object, default: () => ({}) },
  receptor: { type: Object, default: () => ({}) },
  usoCfdi: { type: String, default: 'G03' },
  formaPago: { type: String, default: '01' },
  metodoPago: { type: String, default: 'PUE' },
  moneda: { type: String, default: 'MXN' },
  tipoCambio: { type: Number, default: 1 },
  conceptos: { type: Array, default: () => [] },
  tipoComprobante: { type: String, default: 'I' },
  folio: { type: String, default: '' },
  serie: { type: String, default: '' },
  fecha: { type: String, default: '' },
  validaciones: { type: Array, default: () => [] }
})

const totales = computed(() => calcTotales(props.conceptos))
const usoNombre = computed(() => USOS_CFDI.find(u => u.id === props.usoCfdi)?.nombre || props.usoCfdi)
const formaNombre = computed(() => FORMAS_PAGO.find(f => f.id === props.formaPago)?.nombre || props.formaPago)
const metodoNombre = computed(() => METODOS_PAGO.find(m => m.id === props.metodoPago)?.nombre || props.metodoPago)
const tipoNombre = computed(() => TIPOS_CFDI[props.tipoComprobante] || 'Ingreso')
const errores = computed(() => props.validaciones.filter(v => v.nivel === 'error'))
const avisos = computed(() => props.validaciones.filter(v => v.nivel === 'warning'))

function importe(c) {
  return Number(c.cantidad || 0) * Number(c.valorUnitario || 0) - Number(c.descuento || 0)
}
</script>

<template>
  <div class="preview">
    <div class="preview__paper">
      <header class="preview__head">
        <div class="preview__emisor">
          <span class="preview__logo">{{ (emisor.nombre || 'F').charAt(0) }}</span>
          <div>
            <p class="preview__emisor-nombre">{{ emisor.nombre || '—' }}</p>
            <p class="preview__emisor-rfc mono">RFC {{ emisor.rfc || '—' }} · CP {{ emisor.cp || '—' }} · Régimen {{ emisor.regimen || '—' }}</p>
          </div>
        </div>
        <div class="preview__tipo">
          <p class="preview__tipo-label">Tipo de comprobante</p>
          <p class="preview__tipo-valor">{{ tipoComprobante }} · {{ tipoNombre }}</p>
          <p v-if="serie || folio" class="preview__folio mono">Folio {{ serie ? `${serie}-` : '' }}{{ folio || '—' }}</p>
          <p class="preview__fecha">{{ fecha ? formatDate(fecha) : 'Fecha de emisión' }}</p>
        </div>
      </header>

      <section class="preview__receptor">
        <div class="preview__receptor-main">
          <p class="preview__label">Receptor</p>
          <p class="preview__receptor-nombre">{{ receptor.nombre || 'Nombre / Razón social' }}</p>
          <p class="preview__receptor-rfc mono">{{ receptor.rfc || 'RFC del receptor' }}</p>
        </div>
        <dl class="preview__grid">
          <div><dt>Régimen fiscal</dt><dd class="mono">{{ receptor.regimen || '—' }}</dd></div>
          <div><dt>Código postal</dt><dd class="mono">{{ receptor.cp || '—' }}</dd></div>
          <div><dt>Uso del CFDI</dt><dd>{{ props.usoCfdi }} · {{ usoNombre }}</dd></div>
          <div><dt>Forma de pago</dt><dd>{{ formaPago }} · {{ formaNombre }}</dd></div>
          <div><dt>Método de pago</dt><dd>{{ metodoPago }} · {{ metodoNombre }}</dd></div>
          <div><dt>Moneda</dt><dd class="mono">{{ moneda }} @ {{ tipoCambio }}</dd></div>
        </dl>
      </section>

      <section class="preview__conceptos">
        <table>
          <thead>
            <tr>
              <th>Cant.</th>
              <th>Descripción</th>
              <th class="right">Valor unitario</th>
              <th class="right">Importe</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(c, i) in conceptos" :key="i">
              <td class="mono">{{ Number(c.cantidad).toLocaleString('es-MX') }}</td>
              <td>
                <span class="c-desc">{{ c.descripcion }}</span>
                <span class="c-clave mono">ClaveProdServ {{ c.claveProdServ }} · {{ c.claveUnidad }}</span>
              </td>
              <td class="right mono">{{ formatMoney(c.valorUnitario, moneda) }}</td>
              <td class="right mono">{{ formatMoney(importe(c), moneda) }}</td>
            </tr>
            <tr v-if="!conceptos.length">
              <td colspan="4" class="preview__empty">Aún no hay conceptos en el comprobante.</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="preview__totales">
        <div class="preview__totales-row"><span>Subtotal</span><span class="mono">{{ formatMoney(totales.subtotal, moneda) }}</span></div>
        <div v-if="totales.descuento" class="preview__totales-row"><span>Descuento</span><span class="mono">−{{ formatMoney(totales.descuento, moneda) }}</span></div>
        <div class="preview__totales-row"><span>IVA trasladado</span><span class="mono">{{ formatMoney(totales.impuestosTrasladados, moneda) }}</span></div>
        <div v-if="totales.impuestosRetenidos" class="preview__totales-row"><span>IVA/ISR retenido</span><span class="mono">−{{ formatMoney(totales.impuestosRetenidos, moneda) }}</span></div>
        <div class="preview__totales-row is-total"><span>Total</span><span class="mono">{{ formatMoney(totales.total, moneda) }}</span></div>
      </section>

      <footer class="preview__foot">
        <p>Este documento es una representación impresa de un comprobante fiscal digital por Internet (CFDI 4.0).</p>
        <p class="preview__foot-note">Pendiente de timbrado · El XML y el PDF se generan al confirmar.</p>
      </footer>
    </div>

    <div v-if="errores.length || avisos.length" class="preview__checks">
      <p v-if="errores.length" class="check check--error">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M15 9l-6 6M9 9l6 6" /></svg>
        {{ errores.length }} validación(es) impiden emitir el comprobante
      </p>
      <p v-for="(v, i) in avisos" :key="`w-${i}`" class="check check--warning">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" /></svg>
        {{ v.mensaje }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.preview { display: flex; flex-direction: column; gap: 12px; }

.preview__paper {
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 14px;
  box-shadow: 0 10px 30px rgba(17,24,39,.06);
  overflow: hidden;
  font-family: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif;
}

.preview__head {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 16px;
  padding: 20px 22px; border-bottom: 1px solid var(--border); background: linear-gradient(180deg, #FAFAFC, #fff);
}
.preview__emisor { display: flex; align-items: center; gap: 12px; min-width: 0; }
.preview__logo {
  width: 42px; height: 42px; border-radius: 12px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  background: var(--brand-primary); color: #fff; font-weight: 800; font-size: 18px;
}
.preview__emisor-nombre { margin: 0; font-size: 15px; font-weight: 700; color: var(--text); }
.preview__emisor-rfc { margin: 3px 0 0; font-size: 11px; color: var(--muted); }
.preview__tipo { text-align: right; flex-shrink: 0; }
.preview__tipo-label { margin: 0; font-size: 10px; text-transform: uppercase; letter-spacing: .06em; color: var(--muted-2); font-weight: 600; }
.preview__tipo-valor { margin: 2px 0 0; font-size: 13px; font-weight: 700; color: var(--text); }
.preview__folio { margin: 4px 0 0; font-size: 12px; color: var(--brand-primary); font-weight: 600; }
.preview__fecha { margin: 2px 0 0; font-size: 11px; color: var(--muted); }

.preview__receptor { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr); gap: 18px; padding: 18px 22px; border-bottom: 1px solid var(--border); }
.preview__label { margin: 0; font-size: 10px; text-transform: uppercase; letter-spacing: .06em; color: var(--muted-2); font-weight: 600; }
.preview__receptor-nombre { margin: 5px 0 0; font-size: 14px; font-weight: 600; color: var(--text); }
.preview__receptor-rfc { margin: 2px 0 0; font-size: 13px; color: var(--text-soft); letter-spacing: .03em; }
.preview__grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px 16px; margin: 0; }
.preview__grid div { min-width: 0; }
.preview__grid dt { margin: 0; font-size: 10px; text-transform: uppercase; letter-spacing: .05em; color: var(--muted-2); font-weight: 600; }
.preview__grid dd { margin: 2px 0 0; font-size: 12.5px; color: var(--text-soft); }

.preview__conceptos { padding: 4px 22px 0; }
.preview__conceptos table { width: 100%; border-collapse: collapse; font-size: 13px; }
.preview__conceptos th {
  text-align: left; padding: 12px 8px; font-size: 10px; font-weight: 700; color: var(--muted);
  text-transform: uppercase; letter-spacing: .05em; border-bottom: 1px solid var(--border);
}
.preview__conceptos td { padding: 12px 8px; border-bottom: 1px solid #F3F4F6; vertical-align: top; color: var(--text-soft); }
.preview__conceptos .right { text-align: right; }
.c-desc { display: block; color: var(--text); font-weight: 500; }
.c-clave { display: block; margin-top: 2px; font-size: 10.5px; color: var(--muted-2); }
.preview__empty { text-align: center; color: var(--muted); padding: 24px 8px !important; }

.preview__totales { margin: 14px 22px 0 auto; max-width: 320px; display: flex; flex-direction: column; gap: 7px; }
.preview__totales-row { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; font-size: 13px; color: var(--text-soft); }
.preview__totales-row.is-total {
  border-top: 1px solid var(--border); padding-top: 9px; margin-top: 2px;
  font-size: 15px; font-weight: 700; color: var(--text);
}

.preview__foot { margin-top: 18px; padding: 14px 22px; background: var(--bg-subtle); border-top: 1px solid var(--border); }
.preview__foot p { margin: 0; font-size: 10.5px; color: var(--muted); line-height: 1.5; }
.preview__foot-note { margin-top: 3px !important; font-weight: 600; color: var(--warning) !important; }

.preview__checks { display: flex; flex-direction: column; gap: 6px; }
.check {
  display: flex; align-items: flex-start; gap: 8px; margin: 0;
  padding: 9px 12px; border-radius: 10px; font-size: 12.5px; line-height: 1.45;
}
.check svg { width: 16px; height: 16px; flex-shrink: 0; margin-top: 1px; }
.check--error { background: var(--danger-soft); color: var(--danger); }
.check--warning { background: var(--warning-soft); color: var(--warning); }

@media (max-width: 720px) {
  .preview__head { flex-direction: column; }
  .preview__tipo { text-align: left; }
  .preview__receptor { grid-template-columns: 1fr; }
  .preview__grid { grid-template-columns: 1fr; }
}
</style>
