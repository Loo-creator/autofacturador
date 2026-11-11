// Catálogo de tickets/ventas del punto de venta.
// Referencia de mercado: Walmart (30 días naturales), Coppel/Liverpool (mismo mes de compra).
// Las fechas se calculan de forma RELATIVA a la fecha actual para que el demo nunca caduque:
//   - `diasAtras`: días transcurridos desde la compra.
//   - `ancla: 'mesPrevio'`: último día del mes anterior (ticket del mes de compra ya cerrado).

import { calcTotales } from '@/utils/formatters'

const AHORA = new Date()

function fechaHaceDias(n) {
  const d = new Date(AHORA)
  d.setDate(d.getDate() - n)
  d.setHours(12, 30, 0, 0)
  return d.toISOString()
}

function fechaUltimoDiaMesPrevio() {
  const d = new Date(AHORA.getFullYear(), AHORA.getMonth(), 0, 12, 30, 0)
  return d.toISOString()
}

function concepto(claveProdServ, claveUnidad, unidad, cantidad, descripcion, valorUnitario, iva = 16, objetoImp = '02') {
  return { claveProdServ, claveUnidad, unidad, cantidad, descripcion, valorUnitario, descuento: 0, iva, ieps: 0, retIva: 0, retIsr: 0, objetoImp }
}

const definiciones = [
  // ── neg-1 · Negocio 1 ────────────────────────────────────────────
  {
    id: 'tkt-1', folio: '2001', negocioId: 'neg-1', diasAtras: 0,
    medioPago: 'tarjeta', formaPago: '04', metodoPago: 'PUE',
    conceptos: [concepto('50181906', 'H87', 'Pieza', 2, 'Café americano', 45)],
  },
  {
    id: 'tkt-2', folio: '2002', negocioId: 'neg-1', diasAtras: 4,
    medioPago: 'efectivo', formaPago: '01', metodoPago: 'PUE',
    conceptos: [concepto('50181906', 'H87', 'Pieza', 1, 'Café de olla', 55)],
  },
  {
    id: 'tkt-3', folio: '2003', negocioId: 'neg-1', diasAtras: 18,
    medioPago: 'transferencia', formaPago: '03', metodoPago: 'PUE',
    conceptos: [concepto('50181906', 'H87', 'Pieza', 5, 'Café espresso', 32)],
  },
  {
    id: 'tkt-4', folio: '2004', negocioId: 'neg-1', diasAtras: 45,
    medioPago: 'efectivo', formaPago: '01', metodoPago: 'PUE',
    conceptos: [concepto('50202306', 'H87', 'Pieza', 3, 'Refresco 600ml', 35)],
  },
  {
    id: 'tkt-5', folio: '2005', negocioId: 'neg-1', diasAtras: 2, estado: 'facturado', facturaId: 'fac-1',
    medioPago: 'tarjeta', formaPago: '04', metodoPago: 'PUE',
    conceptos: [concepto('50181906', 'H87', 'Pieza', 1, 'Café latte', 58)],
  },
  {
    id: 'tkt-6', folio: '2006', negocioId: 'neg-1', ancla: 'mesPrevio',
    medioPago: 'efectivo', formaPago: '01', metodoPago: 'PUE',
    conceptos: [concepto('50202306', 'H87', 'Pieza', 4, 'Bebida mineral 600ml', 33)],
  },

  // ── neg-2 · Negocio 2 ──────────────────────────────────────────
  {
    id: 'tkt-7', folio: '2101', negocioId: 'neg-2', diasAtras: 1,
    medioPago: 'tarjeta', formaPago: '04', metodoPago: 'PUE',
    conceptos: [concepto('14111506', 'H87', 'Pieza', 10, 'Cuaderno profesional', 55)],
  },
  {
    id: 'tkt-8', folio: '2102', negocioId: 'neg-2', ancla: 'mesPrevio',
    medioPago: 'transferencia', formaPago: '03', metodoPago: 'PUE',
    conceptos: [concepto('14111506', 'H87', 'Pieza', 20, 'Cuaderno profesional', 55), concepto('44121708', 'H87', 'Pieza', 10, 'Bolígrafo punto fino', 12)],
  },
  {
    id: 'tkt-9', folio: '2103', negocioId: 'neg-2', diasAtras: 40,
    medioPago: 'efectivo', formaPago: '01', metodoPago: 'PUE',
    conceptos: [concepto('14111506', 'H87', 'Pieza', 6, 'Cuaderno escolar', 45)],
  },
  {
    id: 'tkt-10', folio: '2104', negocioId: 'neg-2', diasAtras: 3, estado: 'facturado_global', facturaGlobalId: 'fac-11',
    medioPago: 'efectivo', formaPago: '01', metodoPago: 'PUE',
    conceptos: [concepto('44121708', 'H87', 'Pieza', 25, 'Bolígrafo punto fino', 12)],
  },

  // ── neg-3 · Negocio 3 ─────────────────────────────────────
  {
    id: 'tkt-11', folio: '2301', negocioId: 'neg-3', diasAtras: 0, usoCfdi: 'D01',
    medioPago: 'tarjeta', formaPago: '04', metodoPago: 'PUE',
    conceptos: [concepto('85121800', 'E48', 'Servicio', 1, 'Consulta general', 600, 0)],
  },
  {
    id: 'tkt-12', folio: '2302', negocioId: 'neg-3', diasAtras: 9, usoCfdi: 'D01',
    medioPago: 'transferencia', formaPago: '03', metodoPago: 'PUE',
    conceptos: [concepto('85121800', 'E48', 'Servicio', 1, 'Gastos médicos hospitalarios', 2500, 0)],
  },
]

export const ticketsSeed = definiciones.map((def) => {
  const fecha = def.ancla === 'mesPrevio' ? fechaUltimoDiaMesPrevio() : fechaHaceDias(def.diasAtras ?? 0)
  const conceptos = def.conceptos
  const totales = calcTotales(conceptos)
  return {
    id: def.id,
    folio: def.folio,
    negocioId: def.negocioId,
    fecha,
    fechaCompra: fecha.slice(0, 10),
    estado: def.estado || 'disponible',
    facturaId: def.facturaId || null,
    facturaGlobalId: def.facturaGlobalId || null,
    medioPago: def.medioPago,
    formaPago: def.formaPago,
    metodoPago: def.metodoPago,
    usoCfdi: def.usoCfdi || null,
    conceptos,
    subtotal: totales.subtotal,
    descuento: totales.descuento,
    impuestosTrasladados: totales.impuestosTrasladados,
    impuestosRetenidos: totales.impuestosRetenidos,
    total: totales.total,
  }
})

// Folios de demostración sugeridos en la interfaz (se muestran en el helper del input).
export const FOLIOS_DEMO = [
  { folio: '2001', etiqueta: 'Ticket válido · compra de hoy' },
  { folio: '2005', etiqueta: 'Ticket ya facturado' },
  { folio: '2004', etiqueta: 'Ticket expirado (45 días)' },
  { folio: '2102', etiqueta: 'Mes de compra cerrado' },
  { folio: '9999', etiqueta: 'Folio inexistente' },
]
