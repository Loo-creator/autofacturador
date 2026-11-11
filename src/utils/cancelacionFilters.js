/**
 * Filtros compartidos por las vistas de cancelaciones (negocio y cliente).
 */
import { MOTIVOS_CANCELACION } from '@/utils/satCatalogs'

export const ESTADOS_SOLICITUD = [
  { value: 'solicitada', label: 'Solicitada' },
  { value: 'aprobada', label: 'Aprobada' },
  { value: 'rechazada', label: 'Rechazada' },
]

export const ESTADOS_CFDI = [
  { value: 'vigente', label: 'Vigente' },
  { value: 'pendiente_cancelacion', label: 'Pendiente de cancelación' },
  { value: 'cancelada', label: 'Cancelada' },
]

export const MOTIVOS = MOTIVOS_CANCELACION.map(m => ({
  value: m.id,
  label: `${m.id} - ${m.nombre}`,
}))

export const RANGOS_MONTO_CANCELACION = [
  { value: '0-500', label: '$0 – $500' },
  { value: '500-2000', label: '$500 – $2,000' },
  { value: '2000-10000', label: '$2,000 – $10,000' },
  { value: '10000-', label: '$10,000 +' },
]

export function nombreMotivo(id) {
  return MOTIVOS_CANCELACION.find(m => m.id === id)?.nombre || '—'
}

/**
 * @param {Array} facturas
 * @param {object} f
 * @param {string} f.search      texto libre (folio, receptor, UUID)
 * @param {string} f.estado      estado del CFDI (vigente / pendiente / cancelada)
 * @param {string} f.estatus     estatus de la solicitud (solicitada / aprobada / rechazada)
 * @param {string} f.motivo      motivo SAT (01-04)
 * @param {string} f.desde       fecha mínima
 * @param {string} f.hasta       fecha máxima
 * @param {string} f.monto       rango de monto
 * @param {string} f.fechaCampo  'fecha' (emisión) o 'solicitud'
 */
export function filtrarCancelaciones(facturas = [], f = {}) {
  let list = [...facturas]

  if (f.estado) list = list.filter(x => x.estado === f.estado)
  if (f.estatus) list = list.filter(x => x.cancelacion?.estatus === f.estatus)
  if (f.motivo) list = list.filter(x => x.cancelacion?.motivo === f.motivo)

  if (f.desde || f.hasta) {
    const campo = f.fechaCampo === 'solicitud' ? 'cancelacion' : 'fecha'
    const getFecha = (x) => (campo === 'cancelacion' ? x.cancelacion?.fecha : x.fecha) || ''
    if (f.desde) list = list.filter(x => getFecha(x).slice(0, 10) >= f.desde)
    if (f.hasta) list = list.filter(x => getFecha(x).slice(0, 10) <= f.hasta)
  }

  if (f.monto) {
    const [minRaw, maxRaw] = String(f.monto).split('-')
    const min = Number(minRaw || 0)
    const max = maxRaw ? Number(maxRaw) : Infinity
    list = list.filter(x => Number(x.total || 0) >= min && Number(x.total || 0) <= max)
  }

  const q = String(f.search || '').trim().toLowerCase()
  if (q) {
    list = list.filter(x =>
      `${x.serie}-${x.folio} ${x.receptor?.nombre || ''} ${x.receptor?.rfc || ''} ${x.uuid || ''}`.toLowerCase().includes(q)
    )
  }

  return list
}

/** KPIs de la bandeja de cancelaciones. */
export function resumenCancelaciones(facturas = []) {
  const conSolicitud = facturas.filter(x => x.cancelacion)
  return {
    total: facturas.length,
    porCancelar: facturas.filter(x => x.estado === 'vigente').length,
    pendientes: facturas.filter(x => x.estado === 'pendiente_cancelacion').length,
    canceladas: facturas.filter(x => x.estado === 'cancelada').length,
    solicitudes: conSolicitud.length,
    montoCancelable: facturas
      .filter(x => x.estado === 'vigente')
      .reduce((s, x) => s + Number(x.total || 0), 0),
  }
}
