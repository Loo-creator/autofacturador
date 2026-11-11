import { ensureDb } from '@/mocks/dbSeed'
import { delay, saveDB, response } from '@/mocks/api.mock'
import { uid, uuidV4, calcTotales } from '@/utils/formatters'
import { generarXML, generarPDF } from '@/utils/cfdiGenerator'
import { CODIGO_ERROR } from '@/utils/ticketPolicy'

function ensure() {
  return ensureDb()
}

/** @future GET /api/v1/facturas?negocioId=&clienteRfc= */
export async function listFacturas(filters = {}) {
  await delay()
  let items = ensure().facturas || []
  if (filters.negocioId) items = items.filter(f => f.negocioId === filters.negocioId)
  if (filters.clienteRfc) items = items.filter(f => f.receptor?.rfc === filters.clienteRfc)
  if (filters.estado) items = items.filter(f => f.estado === filters.estado)
  return response(true, items)
}

/** @future GET /api/v1/facturas/:id */
export async function getFactura(id) {
  await delay()
  const f = (ensure().facturas || []).find(x => x.id === id || x.uuid === id)
  return f ? response(true, f) : response(false, null, 'Factura no encontrada')
}

/** @future POST /api/v1/facturas/timbrar */
export async function timbrarFactura(payload) {
  await delay(500)
  const db = ensure()

  // Idempotencia de ticket: un folio no puede generar dos CFDI (Walmart/Soriana).
  if (payload.ticketId) {
    const ticket = (db.tickets || []).find(t => t.id === payload.ticketId)
    if (ticket && ticket.estado === 'facturado') {
      return response(false, null, 'Este ticket ya fue facturado.', { codigo: CODIGO_ERROR.TICKET_ALREADY_INVOICED })
    }
  }

  const negocio = (db.negocios || []).find(n => n.id === payload.negocioId) || db.negocios[0]
  const tot = calcTotales(payload.conceptos || [])
  const folio = (negocio?.folio || 1000) + 1
  if (negocio) negocio.folio = folio
  const factura = {
    id: uid('fac'),
    uuid: uuidV4(),
    serie: negocio?.serie || 'A',
    folio,
    fecha: new Date().toISOString(),
    fechaTimbrado: new Date().toISOString(),
    estado: 'vigente',
    tipo: payload.tipo || 'INGRESO',
    tipoComprobante: payload.tipoComprobante || 'I',
    emisor: payload.emisor || { rfc: negocio?.rfc, nombre: negocio?.nombre, regimen: negocio?.regimen, cp: negocio?.cp },
    cancelacion: null,
    ...payload,
    ...tot
  }
  db.facturas.unshift(factura)

  // El ticket queda consumido: ya no puede volver a facturarse.
  // Se muta la MISMA instancia de db y se guarda una sola vez (evita perder la
  // actualización de otro servicio que hubiera guardado en paralelo).
  if (payload.ticketId) {
    const ticket = (db.tickets || []).find(t => t.id === payload.ticketId)
    if (ticket) {
      ticket.estado = 'facturado'
      ticket.facturaId = factura.id
      ticket.facturadoEn = new Date().toISOString()
    }
  }

  db.auditoria = db.auditoria || []
  db.auditoria.unshift({
    id: uid('aud'),
    fecha: new Date().toISOString(),
    accion: 'timbrado',
    entidad: 'factura',
    entidadId: factura.id,
    folio: `${factura.serie}-${factura.folio}`,
    total: factura.total,
    receptor: factura.receptor?.rfc,
    ticketId: payload.ticketId || null,
    negocioId: factura.negocioId || negocio?.id || null,
  })

  saveDB(db)
  return response(true, factura)
}

/** @future POST /api/v1/facturas/:id/cancelacion */
export async function solicitarCancelacion(id, { motivo, uuidRelacionado }) {
  await delay()
  const db = ensure()
  const f = (db.facturas || []).find(x => x.id === id)
  if (!f) return response(false, null, 'Factura no encontrada')
  f.estado = 'pendiente_cancelacion'
  f.cancelacion = { motivo, uuidRelacionado, fecha: new Date().toISOString(), estatus: 'solicitada' }
  saveDB(db)
  return response(true, f)
}

/** @future PUT /api/v1/facturas/:id/cancelacion/aprobar */
export async function resolverCancelacion(id, aprobar) {
  await delay()
  const db = ensure()
  const f = (db.facturas || []).find(x => x.id === id)
  if (!f) return response(false, null, 'Factura no encontrada')
  if (aprobar) {
    f.estado = 'cancelada'
    f.cancelacion = { ...(f.cancelacion || {}), estatus: 'aprobada', acuse: uid('ACUSE'), fechaResolucion: new Date().toISOString() }
  } else {
    f.estado = 'vigente'
    f.cancelacion = { ...(f.cancelacion || {}), estatus: 'rechazada', fechaResolucion: new Date().toISOString() }
  }
  saveDB(db)
  return response(true, f)
}

/** @future POST /api/v1/facturas/global */
export async function timbrarGlobal(payload) {
  return timbrarFactura({ ...payload, tipo: 'GLOBAL', tipoComprobante: 'I', usoCfdi: 'S01', receptor: { rfc: 'XAXX010101000', nombre: 'PÚBLICO EN GENERAL', regimen: '616', cp: payload.emisor?.cp || '00000' } })
}

/** @future GET /api/v1/facturas/:id/xml */
export async function descargarXML(id) {
  await delay(200)
  const db = ensure()
  const f = (db.facturas || []).find(x => x.id === id)
  if (!f) return response(false, null, 'Factura no encontrada')
  return response(true, { filename: `${f.serie || 'A'}-${f.folio}.xml`, content: generarXML(f) })
}

/** @future GET /api/v1/facturas/:id/pdf */
export async function descargarPDF(id) {
  await delay(200)
  const db = ensure()
  const f = (db.facturas || []).find(x => x.id === id)
  if (!f) return response(false, null, 'Factura no encontrada')
  return response(true, { filename: `${f.serie || 'A'}-${f.folio}.pdf`, blob: generarPDF(f) })
}
