import { uuidV4 } from '@/utils/formatters'

const base = (i, overrides) => ({
  id: `fac-${i}`,
  uuid: uuidV4(),
  serie: 'A',
  folio: 1000 + i,
  fecha: `2026-${String((i % 10) + 1).padStart(2, '0')}-${String((i % 27) + 1).padStart(2, '0')}T10:30:00`,
  fechaTimbrado: `2026-${String((i % 10) + 1).padStart(2, '0')}-${String((i % 27) + 1).padStart(2, '0')}T10:31:00`,
  tipo: 'INGRESO',
  tipoComprobante: 'I',
  estado: 'vigente',
  negocioId: 'neg-1',
  emisor: { rfc: 'CFA210101AA1', nombre: 'Negocio 1', regimen: '626', cp: '44100' },
  receptor: { rfc: 'PELJ8001019A1', nombre: 'Juan Pérez López', regimen: '612', cp: '44110' },
  usoCfdi: 'G03',
  formaPago: '03',
  metodoPago: 'PUE',
  moneda: 'MXN',
  tipoCambio: 1,
  conceptos: [{ claveProdServ: '50181906', claveUnidad: 'H87', unidad: 'Pieza', cantidad: 2, descripcion: 'Café americano', valorUnitario: 45, descuento: 0, iva: 16, objetoImp: '02' }],
  subtotal: 90, descuento: 0, impuestosTrasladados: 14.4, impuestosRetenidos: 0, total: 104.4,
  cancelacion: null,
  ...overrides
})

export const facturasSeed = [
  base(1),
  base(2, { folio: 1002, total: 75.4, subtotal: 65, impuestosTrasladados: 10.4, receptor: { rfc: 'GARM850215AB2', nombre: 'María García Ruiz', regimen: '605', cp: '64010' } }),
  base(3, { folio: 1003, estado: 'cancelada', cancelacion: { motivo: '02', fecha: '2026-02-10', acuse: 'ACUSE-MOCK-3', estatus: 'aprobada' } }),
  base(4, { folio: 1004, estado: 'pendiente_cancelacion', cancelacion: { motivo: '03', fecha: '2026-03-05', estatus: 'solicitada' } }),
  base(5, { folio: 1005, metodoPago: 'PPD', formaPago: '99' }),
  base(6, { folio: 1006, negocioId: 'neg-2', serie: 'PAP', emisor: { rfc: 'PEL190615BB2', nombre: 'Negocio 2', regimen: '612', cp: '64000' }, receptor: { rfc: 'CNO150101XY3', nombre: 'Comercializadora Norte SA de CV', regimen: '601', cp: '01010' }, conceptos: [{ claveProdServ: '14111506', claveUnidad: 'H87', unidad: 'Pieza', cantidad: 10, descripcion: 'Cuaderno profesional', valorUnitario: 55, descuento: 0, iva: 16, objetoImp: '02' }], subtotal: 550, impuestosTrasladados: 88, total: 638 }),
  base(7, { folio: 1007, negocioId: 'neg-2', serie: 'PAP', emisor: { rfc: 'PEL190615BB2', nombre: 'Negocio 2', regimen: '612', cp: '64000' } }),
  base(8, { folio: 1008, negocioId: 'neg-2', estado: 'cancelada', cancelacion: { motivo: '01', uuidRelacionado: uuidV4(), fecha: '2026-04-01', acuse: 'ACUSE-MOCK-8', estatus: 'aprobada' } }),
  base(9, { folio: 1009, negocioId: 'neg-3', serie: 'MED', emisor: { rfc: 'SMS180320CC3', nombre: 'Negocio 3', regimen: '601', cp: '01000' }, usoCfdi: 'D01', conceptos: [{ claveProdServ: '85121800', claveUnidad: 'E48', unidad: 'Servicio', cantidad: 1, descripcion: 'Consulta general', valorUnitario: 600, descuento: 0, iva: 0, objetoImp: '02' }], subtotal: 600, impuestosTrasladados: 0, total: 600 }),
  base(10, { folio: 1010, negocioId: 'neg-3', serie: 'MED', emisor: { rfc: 'SMS180320CC3', nombre: 'Negocio 3', regimen: '601', cp: '01000' }, usoCfdi: 'D01', estado: 'pendiente_cancelacion', cancelacion: { motivo: '03', fecha: '2026-05-12', estatus: 'solicitada' } }),
  base(11, { folio: 1011, tipo: 'GLOBAL', tipoComprobante: 'I', periodicidad: '04', meses: '01', anio: '2026', ticketsConsolidados: 31, foliosConsolidados: ['1010'], receptor: { rfc: 'XAXX010101000', nombre: 'PÚBLICO EN GENERAL', regimen: '616', cp: '44100' }, usoCfdi: 'S01' }),
  base(12, { folio: 1012, tipo: 'EGRESO', tipoComprobante: 'E', usoCfdi: 'G02', tipoRelacion: '01', cfdiRelacionados: [uuidV4()], subtotal: 45, impuestosTrasladados: 7.2, total: 52.2 }),
  base(13, { folio: 1013, tipo: 'PAGO', tipoComprobante: 'P', usoCfdi: 'CP01', metodoPago: 'PPD', formaPago: '99', subtotal: 0, impuestosTrasladados: 0, total: 0, complementoPago: { fechaPago: '2026-03-15', formaPago: '03', monto: 104.4, doctoRelacionado: uuidV4() } }),
  base(14, { folio: 1014, tipo: 'TRASLADO', tipoComprobante: 'T', usoCfdi: 'S01', subtotal: 0, impuestosTrasladados: 0, total: 0 }),
  base(15, { folio: 1015, tipo: 'NOMINA', tipoComprobante: 'N', usoCfdi: 'CN01', receptor: { rfc: 'PELJ8001019A1', nombre: 'Juan Pérez López', regimen: '605', cp: '44110' }, conceptos: [{ claveProdServ: '84111505', claveUnidad: 'ACT', unidad: 'Actividad', cantidad: 1, descripcion: 'Pago de nómina quincenal', valorUnitario: 8000, descuento: 1200, iva: 0, objetoImp: '01' }], subtotal: 8000, descuento: 1200, impuestosTrasladados: 0, impuestosRetenidos: 960, total: 5840, nomina: { percepciones: 8000, deducciones: 2160 } }),
  base(16, { folio: 1016, usoCfdi: 'D10', conceptos: [{ claveProdServ: '86121500', claveUnidad: 'E48', unidad: 'Servicio', cantidad: 1, descripcion: 'Colegiatura mensual', valorUnitario: 3500, descuento: 0, iva: 0, objetoImp: '02' }], subtotal: 3500, impuestosTrasladados: 0, total: 3500, complementoEducativo: { curp: 'PELJ080101HJCRRN09', nivel: 'Primaria', rvoe: 'RVOE-123' } }),
  base(17, { folio: 1017, usoCfdi: 'G03', conceptos: [{ claveProdServ: '80131500', claveUnidad: 'E48', unidad: 'Servicio', cantidad: 1, descripcion: 'Renta mensual local', valorUnitario: 12000, descuento: 0, iva: 16, objetoImp: '02' }], subtotal: 12000, impuestosTrasladados: 1920, total: 13920 }),
  base(18, { folio: 1018, usoCfdi: 'D01', conceptos: [{ claveProdServ: '80121600', claveUnidad: 'E48', unidad: 'Servicio', cantidad: 1, descripcion: 'Honorarios profesionales asesoría', valorUnitario: 5000, descuento: 0, iva: 16, retIsr: 10, retIva: 10.6667, objetoImp: '02' }], subtotal: 5000, impuestosTrasladados: 800, impuestosRetenidos: 1033.33, total: 4766.67 }),
  base(19, { folio: 1019, negocioId: 'neg-3', serie: 'MED', emisor: { rfc: 'SMS180320CC3', nombre: 'Negocio 3', regimen: '601', cp: '01000' }, usoCfdi: 'D01', conceptos: [{ claveProdServ: '85121800', claveUnidad: 'E48', unidad: 'Servicio', cantidad: 1, descripcion: 'Gastos médicos hospitalarios', valorUnitario: 2500, descuento: 0, iva: 0, objetoImp: '02' }], subtotal: 2500, impuestosTrasladados: 0, total: 2500 }),
  base(20, { folio: 1020, usoCfdi: 'G03', conceptos: [{ claveProdServ: '78101800', claveUnidad: 'E48', unidad: 'Servicio', cantidad: 1, descripcion: 'Servicio de flete nacional', valorUnitario: 4200, descuento: 0, iva: 16, objetoImp: '02' }], subtotal: 4200, impuestosTrasladados: 672, total: 4872, cartaPorte: { origen: 'GDL', destino: 'MTY', distancia: 780 } }),
  base(21, { folio: 1021, estado: 'vigente' }),
  base(22, { folio: 1022, estado: 'vigente' }),
  base(23, { folio: 1023, estado: 'cancelada', cancelacion: { motivo: '04', fecha: '2026-06-01', acuse: 'ACUSE-MOCK-23', estatus: 'aprobada' } }),
  base(24, { folio: 1024, negocioId: 'neg-2', serie: 'PAP', emisor: { rfc: 'PEL190615BB2', nombre: 'Negocio 2', regimen: '612', cp: '64000' } }),
  base(25, { folio: 1025, negocioId: 'neg-2', serie: 'PAP', estado: 'pendiente_cancelacion', cancelacion: { motivo: '01', uuidRelacionado: uuidV4(), fecha: '2026-06-15', estatus: 'solicitada' } }),
  base(26, { folio: 1026, negocioId: 'neg-3', serie: 'MED', emisor: { rfc: 'SMS180320CC3', nombre: 'Negocio 3', regimen: '601', cp: '01000' } }),
  base(27, { folio: 1027 }),
  base(28, { folio: 1028, tipoRelacion: '04', cfdiRelacionados: [uuidV4()] }),
  base(29, { folio: 1029, estado: 'vigente' }),
  base(30, { folio: 1030, negocioId: 'neg-2', serie: 'PAP', emisor: { rfc: 'PEL190615BB2', nombre: 'Negocio 2', regimen: '612', cp: '64000' }, estado: 'vigente' })
]

/**
 * Facturas globales ya emitidas (consolidaciones al público en general).
 * Cada una trae la información global del período (periodicidad / mes / año)
 * y el detalle de los tickets que consolidó.
 */
export const facturasGlobalesSeed = [
  {
    id: 'glob-1', serie: 'GLO', folio: 9001, negocioId: 'neg-1',
    tipo: 'GLOBAL', tipoComprobante: 'I',
    fecha: '2026-10-01T09:15:00', fechaTimbrado: '2026-10-01T09:15:00',
    periodicidad: '04', meses: '10', anio: '2026',
    ticketsConsolidados: 42, foliosConsolidados: ['1001', '1002', '1003'],
    total: 18240.00, subtotal: 15724.14, impuestosTrasladados: 2515.86,
    receptor: { rfc: 'XAXX010101000', nombre: 'PÚBLICO EN GENERAL', regimen: '616', cp: '44100' },
    usoCfdi: 'S01', formaPago: '01', metodoPago: 'PUE', estado: 'vigente',
  },
  {
    id: 'glob-2', serie: 'GLO', folio: 9002, negocioId: 'neg-1',
    tipo: 'GLOBAL', tipoComprobante: 'I',
    fecha: '2026-09-01T09:20:00', fechaTimbrado: '2026-09-01T09:20:00',
    periodicidad: '04', meses: '09', anio: '2026',
    ticketsConsolidados: 38, foliosConsolidados: ['1004', '1005'],
    total: 15480.50, subtotal: 13345.26, impuestosTrasladados: 2135.24,
    receptor: { rfc: 'XAXX010101000', nombre: 'PÚBLICO EN GENERAL', regimen: '616', cp: '44100' },
    usoCfdi: 'S01', formaPago: '01', metodoPago: 'PUE', estado: 'vigente',
  },
  {
    id: 'glob-3', serie: 'GLO', folio: 9003, negocioId: 'neg-2',
    tipo: 'GLOBAL', tipoComprobante: 'I',
    fecha: '2026-10-01T10:05:00', fechaTimbrado: '2026-10-01T10:05:00',
    periodicidad: '04', meses: '10', anio: '2026',
    ticketsConsolidados: 27, foliosConsolidados: ['2101', '2102'],
    total: 9875.25, subtotal: 8513.16, impuestosTrasladados: 1362.09,
    receptor: { rfc: 'XAXX010101000', nombre: 'PÚBLICO EN GENERAL', regimen: '616', cp: '64000' },
    usoCfdi: 'S01', formaPago: '01', metodoPago: 'PUE', estado: 'vigente',
  },
  {
    id: 'glob-4', serie: 'GLO', folio: 9004, negocioId: 'neg-3',
    tipo: 'GLOBAL', tipoComprobante: 'I',
    fecha: '2026-10-01T11:40:00', fechaTimbrado: '2026-10-01T11:40:00',
    periodicidad: '04', meses: '10', anio: '2026',
    ticketsConsolidados: 15, foliosConsolidados: ['2301', '2302'],
    total: 41200.00, subtotal: 41200.00, impuestosTrasladados: 0,
    receptor: { rfc: 'XAXX010101000', nombre: 'PÚBLICO EN GENERAL', regimen: '616', cp: '01000' },
    usoCfdi: 'S01', formaPago: '01', metodoPago: 'PUE', estado: 'cancelada',
    cancelacion: { motivo: '02', fecha: '2026-10-20', acuse: 'ACUSE-MOCK-GLOB4', estatus: 'aprobada' },
  },
]

// Se inyectan en la semilla global de la base mock.
export const facturasGlobalesExtra = facturasGlobalesSeed
