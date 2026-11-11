import { ensureDb } from '@/mocks/dbSeed'
import { ticketsSeed } from '@/mocks/tickets.mock'
import { delay, saveDB, response } from '@/mocks/api.mock'
import { evaluarTicket, CODIGO_ERROR } from '@/utils/ticketPolicy'

function ensure() {
  const db = ensureDb()
  if (!Array.isArray(db.tickets) || !db.tickets.length) {
    db.tickets = ticketsSeed
    saveDB(db)
  }
  return db
}

function negocioDe(db, negocioId) {
  return (db.negocios || []).find(n => n.id === negocioId) || null
}

/**
 * Busca un ticket por folio y evalúa si es facturable.
 * @future GET /api/v1/tickets/:folio?negocioId=
 * @returns {{ok:boolean, data:{ticket,evaluacion,negocio}|null, error:string|null,
 *            codigo:string|null, contexto:object}}
 */
export async function getTicketByFolio(folio, opciones = {}) {
  await delay(320)
  const db = ensure()
  const f = String(folio || '').trim()

  if (!f) {
    const evaluacion = evaluarTicket(null, null)
    return response(false, null, 'Ingresa el folio del ticket de compra.', { codigo: CODIGO_ERROR.TICKET_REQUERIDO }, { contexto: { evaluacion } })
  }

  const ticket = (db.tickets || []).find(t => String(t.folio) === f && (!opciones.negocioId || t.negocioId === opciones.negocioId))

  if (!ticket) {
    const evaluacion = evaluarTicket(null, null)
    return response(false, null, evaluacion.mensaje, { codigo: CODIGO_ERROR.TICKET_NOT_FOUND }, { contexto: { evaluacion } })
  }

  const negocio = negocioDe(db, ticket.negocioId)
  const evaluacion = evaluarTicket(ticket, negocio)

  if (!evaluacion.facturable) {
    return response(false, null, evaluacion.mensaje, { codigo: evaluacion.codigo }, { contexto: { ticket, evaluacion, negocio } })
  }

  return response(true, { ticket, evaluacion, negocio }, null, { contexto: { ticket, evaluacion, negocio } })
}

/**
 * Tickets del negocio con su evaluación de plazo/estado (bandeja del negocio).
 * @future GET /api/v1/negocios/:id/tickets
 */
export async function listTickets(negocioId) {
  await delay()
  const db = ensure()
  const items = (db.tickets || [])
    .filter(t => !negocioId || t.negocioId === negocioId)
    .map(t => {
      const negocio = negocioDe(db, t.negocioId)
      const evaluacion = evaluarTicket(t, negocio)
      return { ...t, evaluacion, negocioNombre: negocio?.nombre || '' }
    })
    .sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)))
  return response(true, items)
}

/** Bloquea folios consumidos por una factura global (cierre de mes). */
export async function bloquearTicketsPorGlobal(folios = [], facturaGlobalId) {
  await delay(150)
  const db = ensure()
  const set = new Set(folios.map(String))
  let n = 0
  for (const t of db.tickets || []) {
    if (set.has(String(t.folio)) && t.estado !== 'facturado') {
      t.estado = 'facturado_global'
      t.facturaGlobalId = facturaGlobalId
      n++
    }
  }
  saveDB(db)
  return response(true, { bloqueados: n })
}
