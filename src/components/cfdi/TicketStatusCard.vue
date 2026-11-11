<script setup>
/**
 * Estados del ticket de compra: disponible, ya facturado, expirado, mes cerrado,
 * consolidado en factura global y no encontrado.
 * Inspirado en los mensajes de Soriana/Walmart: cada estado explica qué pasó y qué hacer.
 */
import { computed } from 'vue'
import { ESTADO_TICKET } from '@/utils/ticketPolicy'
import { formatDate } from '@/utils/formatters'

const props = defineProps({
  estado: { type: String, default: ESTADO_TICKET.DISPONIBLE },
  ticket: { type: Object, default: null },
  evaluacion: { type: Object, default: null },
  factura: { type: Object, default: null }
})

const emit = defineEmits(['reintentar', 'ver-factura'])

const config = computed(() => {
  const ev = props.evaluacion
  const factura = props.factura
  const fechaLimite = ev?.fechaLimite ? formatDate(ev.fechaLimite) : '—'
  const compra = props.ticket?.fecha ? formatDate(props.ticket.fecha) : '—'
  const folioFactura = factura ? `${factura.serie}-${factura.folio}` : null

  switch (props.estado) {
    case ESTADO_TICKET.DISPONIBLE:
      return {
        tone: 'ok',
        icono: 'check',
        titulo: 'Ticket verificado',
        mensaje: ev?.diasRestantes != null
          ? `Compra del ${compra}. Te quedan ${ev.diasRestantes} día(s) para facturarlo (ventana de ${ev.politica?.dias ?? 30} días naturales).`
          : `Compra del ${compra}. Listo para facturar.`,
      }
    case ESTADO_TICKET.FACTURADO:
      return {
        tone: 'warning',
        icono: 'alert',
        titulo: 'Ticket ya facturado',
        mensaje: folioFactura
          ? `Este folio ya tiene el comprobante ${folioFactura}. Solo puedes descargarlo o solicitar su cancelación.`
          : 'Este folio ya tiene un comprobante emitido. Solo puedes descargarlo o solicitar su cancelación.',
        accion: folioFactura ? 'Ver comprobante' : '',
      }
    case ESTADO_TICKET.FACTURADO_GLOBAL:
      return {
        tone: 'warning',
        icono: 'alert',
        titulo: 'Folio consolidado en factura global',
        mensaje: 'Al cierre del mes, este folio se consolidó en una factura global. Ya no puede facturarse de forma individual.',
      }
    case ESTADO_TICKET.EXPIRADO:
      return {
        tone: 'error',
        icono: 'clock',
        titulo: 'Ticket expirado',
        mensaje: `La ventana de facturación de ${ev?.politica?.dias ?? 30} días naturales venció el ${fechaLimite}. Pide el comprobante directamente en el negocio.`,
      }
    case ESTADO_TICKET.MES_CERRADO:
      return {
        tone: 'error',
        icono: 'clock',
        titulo: 'Mes de compra cerrado',
        mensaje: `Este ticket es del mes de compra anterior y ese mes ya está cerrado (vence el ${fechaLimite}). Solicita el comprobante en el negocio.`,
      }
    case ESTADO_TICKET.NO_ENCONTRADO:
    default:
      return {
        tone: 'error',
        icono: 'search',
        titulo: 'Ticket no encontrado',
        mensaje: 'Verifica el folio impreso en tu comprobante de compra. Si el ticket es de otro negocio, regresa a esa tienda.',
      }
  }
})
</script>

<template>
  <div class="ticket-state" :class="`tone-${config.tone}`" role="status" aria-live="polite">
    <span class="ticket-state__bar" aria-hidden="true"></span>

    <span class="ticket-state__icon" aria-hidden="true">
      <svg v-if="config.icono === 'check'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
      <svg v-else-if="config.icono === 'alert'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" /></svg>
      <svg v-else-if="config.icono === 'clock'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
      <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
    </span>

    <div class="ticket-state__body">
      <p class="ticket-state__title">{{ config.titulo }}</p>
      <p class="ticket-state__msg">{{ config.mensaje }}</p>
    </div>

    <div v-if="config.accion || estado === ESTADO_TICKET.NO_ENCONTRADO" class="ticket-state__actions">
      <button v-if="config.accion" type="button" class="btn btn-sm btn-secondary" @click="emit('ver-factura', factura)">
        {{ config.accion }}
      </button>
      <button v-if="estado === ESTADO_TICKET.NO_ENCONTRADO" type="button" class="btn btn-sm btn-secondary" @click="emit('reintentar')">
        Capturar otro folio
      </button>
    </div>
  </div>
</template>

<style scoped>
.ticket-state {
  position: relative;
  display: flex; align-items: flex-start; gap: 12px;
  padding: 14px 16px 14px 18px;
  border-radius: 12px;
  background: var(--glass-panel);
  border: 1px solid var(--glass-line);
  box-shadow: 0 4px 16px rgba(17,24,39,.05);
  overflow: hidden;
}
.ticket-state__bar { position: absolute; left: 0; top: 0; bottom: 0; width: 4px; border-radius: 12px 0 0 12px; }
.ticket-state__icon { width: 22px; height: 22px; flex-shrink: 0; margin-top: 1px; }
.ticket-state__icon svg { width: 22px; height: 22px; }
.ticket-state__body { flex: 1; min-width: 0; }
.ticket-state__title { margin: 0; font-size: 14px; font-weight: 700; color: var(--text); }
.ticket-state__msg { margin: 3px 0 0; font-size: 13px; line-height: 1.5; color: var(--muted); }
.ticket-state__actions { display: flex; gap: 8px; align-items: center; flex-shrink: 0; }

.tone-ok { background: var(--success-soft); border-color: rgba(22,163,74,.18); }
.tone-ok .ticket-state__bar { background: var(--success); }
.tone-ok .ticket-state__icon { color: var(--success); }

.tone-warning { background: var(--warning-soft); border-color: rgba(217,119,6,.18); }
.tone-warning .ticket-state__bar { background: var(--warning); }
.tone-warning .ticket-state__icon { color: var(--warning); }

.tone-error { background: var(--danger-soft); border-color: rgba(220,38,38,.18); }
.tone-error .ticket-state__bar { background: var(--danger); }
.tone-error .ticket-state__icon { color: var(--danger); }

@media (max-width: 640px) {
  .ticket-state { flex-wrap: wrap; }
  .ticket-state__actions { width: 100%; justify-content: flex-end; padding-left: 34px; }
}
</style>
