// Política de facturación de tickets: ventanas, plazos y estados.
// Reglas de mercado implementadas:
//   - Walmart: 30 días naturales para facturar un ticket.
//   - Coppel / Liverpool: el CFDI debe emitirse dentro del mes de compra.
//   - Al cerrar el mes, las ventas se consolidan en factura global y el folio se bloquea.

export const ESTADO_TICKET = {
  DISPONIBLE: 'disponible',
  FACTURADO: 'facturado',
  EXPIRADO: 'expirado',
  MES_CERRADO: 'mes_cerrado',
  NO_ENCONTRADO: 'no_encontrado',
  FACTURADO_GLOBAL: 'facturado_global',
}

export const CODIGO_ERROR = {
  TICKET_REQUERIDO: 'TICKET_REQUERIDO',
  TICKET_NOT_FOUND: 'TICKET_NOT_FOUND',
  TICKET_ALREADY_INVOICED: 'TICKET_ALREADY_INVOICED',
  TICKET_EXPIRED: 'TICKET_EXPIRED',
  MONTH_CLOSED: 'MONTH_CLOSED',
  TICKET_BLOCKED: 'TICKET_BLOCKED',
}

export const VENTANA_DEFAULT = { dias: 30, exigeMismoMes: false }

/** Política vigente del negocio (si no la define, aplica la de 30 días naturales). */
export function politicaDe(negocio = {}) {
  const p = negocio?.politicaFacturacion
  return {
    dias: Number(p?.dias ?? VENTANA_DEFAULT.dias),
    exigeMismoMes: Boolean(p?.exigeMismoMes ?? VENTANA_DEFAULT.exigeMismoMes),
  }
}

function inicioDia(d) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

/** Días naturales transcurridos entre dos fechas (a - b). */
export function diasTranscurridos(fecha, hoy = new Date()) {
  return Math.round((inicioDia(hoy) - inicioDia(fecha)) / 86400000)
}

export function mismoMes(fecha, hoy = new Date()) {
  const a = new Date(fecha)
  const b = new Date(hoy)
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

export function fechaLimite(ticket, politica = VENTANA_DEFAULT, hoy = new Date()) {
  const d = inicioDia(ticket.fecha)
  d.setDate(d.getDate() + politica.dias)
  return d
}

/**
 * Evalúa si un ticket puede facturarse y por qué no.
 * @returns {{estado:string, codigo:string|null, facturable:boolean, mensaje:string,
 *            diasRestantes:number, fechaLimite:string, politica:object}}
 */
export function evaluarTicket(ticket, negocio = {}, hoy = new Date()) {
  const politica = politicaDe(negocio)

  if (!ticket) {
    return {
      estado: ESTADO_TICKET.NO_ENCONTRADO,
      codigo: CODIGO_ERROR.TICKET_NOT_FOUND,
      facturable: false,
      mensaje: 'Ticket no encontrado. Verifica el folio impreso en tu comprobante de compra.',
      diasRestantes: 0,
      diasTranscurridos: 0,
      fechaLimite: null,
      politica,
    }
  }

  const transcurridos = Math.max(0, diasTranscurridos(ticket.fecha, hoy))
  const limite = fechaLimite(ticket, politica, hoy)
  const diasRestantes = politica.dias - transcurridos
  const base = {
    diasRestantes,
    diasTranscurridos: transcurridos,
    fechaLimite: limite.toISOString(),
    politica,
    facturaId: ticket.facturaId || null,
    facturaGlobalId: ticket.facturaGlobalId || null,
  }

  if (ticket.estado === 'facturado') {
    return {
      ...base,
      estado: ESTADO_TICKET.FACTURADO,
      codigo: CODIGO_ERROR.TICKET_ALREADY_INVOICED,
      facturable: false,
      mensaje: 'Este ticket ya fue facturado. Puedes descargar el comprobante o solicitar su cancelación.',
    }
  }

  if (ticket.estado === 'facturado_global') {
    return {
      ...base,
      estado: ESTADO_TICKET.FACTURADO_GLOBAL,
      codigo: CODIGO_ERROR.TICKET_BLOCKED,
      facturable: false,
      mensaje: 'Este folio se consolidó en una factura global y su folio quedó bloqueado.',
    }
  }

  if (transcurridos > politica.dias) {
    return {
      ...base,
      estado: ESTADO_TICKET.EXPIRADO,
      codigo: CODIGO_ERROR.TICKET_EXPIRED,
      facturable: false,
      mensaje: `La ventana de facturación de ${politica.dias} días naturales venció. Solicita el comprobante con el negocio.`,
    }
  }

  if (politica.exigeMismoMes && !mismoMes(ticket.fecha, hoy)) {
    return {
      ...base,
      estado: ESTADO_TICKET.MES_CERRADO,
      codigo: CODIGO_ERROR.MONTH_CLOSED,
      facturable: false,
      mensaje: 'El mes de compra está cerrado. Solo las ventas de este mes pueden facturarse de forma individual.',
    }
  }

  return {
    ...base,
    estado: ESTADO_TICKET.DISPONIBLE,
    codigo: null,
    facturable: true,
    mensaje: 'Ticket verificado, listo para facturar.',
  }
}
