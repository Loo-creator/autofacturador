/**
 * Filtrado de tickets de venta.
 * Función pura y testeable: la vista sólo la invoca con el estado de la barra de filtros.
 */

/** Rangos de monto predefinidos (mismo formato que el <select> del FilterBar). */
export const RANGOS_MONTO = [
  { value: '0-500', label: '$0 – $500' },
  { value: '500-2000', label: '$500 – $2,000' },
  { value: '2000-10000', label: '$2,000 – $10,000' },
  { value: '10000-', label: '$10,000 +' },
]

import { FORMAS_PAGO as FORMAS_PAGO_SAT } from './satCatalogs'

/** Formas de pago que se usan en tickets de venta (subset del catálogo SAT). */
const CLAVES_FORMA_PAGO_TICKET = ['01', '03', '04']
const ETIQUETAS_CORTAS = { '01': 'Efectivo', '03': 'Transferencia', '04': 'Tarjeta' }

export const FORMAS_PAGO = FORMAS_PAGO_SAT
  .filter(f => CLAVES_FORMA_PAGO_TICKET.includes(f.id))
  .map(f => ({ value: f.id, label: ETIQUETAS_CORTAS[f.id] || f.nombre }))

export const ESTADOS_TICKET = [
  { value: 'disponible', label: 'Por facturar' },
  { value: 'facturado', label: 'Facturados' },
  { value: 'expirado', label: 'Expirados' },
  { value: 'mes_cerrado', label: 'Mes cerrado' },
  { value: 'facturado_global', label: 'Factura global' },
]

/**
 * @param {Array} rows  tickets (con `evaluacion`)
 * @param {object} f
 * @param {string} f.search     texto libre (folio, concepto, negocio)
 * @param {string} f.estado     estado del ticket
 * @param {string} f.formaPago  clave de forma de pago
 * @param {string} f.desde      fecha mínima (YYYY-MM-DD)
 * @param {string} f.hasta      fecha máxima (YYYY-MM-DD)
 * @param {string} f.monto      rango de monto
 */
export function filtrarTickets(rows = [], f = {}) {
  let list = [...rows]

  if (f.estado) list = list.filter(r => r.evaluacion?.estado === f.estado)
  if (f.formaPago) list = list.filter(r => String(r.formaPago) === String(f.formaPago))
  if (f.desde) list = list.filter(r => (r.fecha || '').slice(0, 10) >= f.desde)
  if (f.hasta) list = list.filter(r => (r.fecha || '').slice(0, 10) <= f.hasta)

  if (f.monto) {
    const [minRaw, maxRaw] = String(f.monto).split('-')
    const min = Number(minRaw || 0)
    const max = maxRaw ? Number(maxRaw) : Infinity
    list = list.filter(r => Number(r.total || 0) >= min && Number(r.total || 0) <= max)
  }

  const q = String(f.search || '').trim().toLowerCase()
  if (q) {
    list = list.filter(r => {
      const conceptos = (r.conceptos || []).map(c => c.descripcion).join(' ')
      return `${r.folio} ${conceptos} ${r.negocioNombre || ''}`.toLowerCase().includes(q)
    })
  }

  return list
}

/** Resumen para los KPI de la bandeja. */
export function resumenTickets(rows = []) {
  const pendientes = rows.filter(r => r.evaluacion?.estado === 'disponible')
  return {
    total: rows.length,
    pendientes: pendientes.length,
    montoPendiente: pendientes.reduce((s, r) => s + Number(r.total || 0), 0),
    expirados: rows.filter(r => r.evaluacion?.estado === 'expirado').length,
    facturados: rows.filter(r => r.evaluacion?.estado === 'facturado').length,
  }
}
