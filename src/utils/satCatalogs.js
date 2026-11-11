export const REGIMENES = [
  { id: '601', nombre: 'General de Ley Personas Morales' },
  { id: '603', nombre: 'Personas Morales con Fines no Lucrativos' },
  { id: '605', nombre: 'Sueldos y Salarios e Ingresos Asimilados a Salarios' },
  { id: '606', nombre: 'Arrendamiento' },
  { id: '612', nombre: 'Personas Físicas con Actividades Empresariales y Profesionales' },
  { id: '616', nombre: 'Sin obligaciones fiscales' },
  { id: '621', nombre: 'Incorporación Fiscal' },
  { id: '626', nombre: 'Régimen Simplificado de Confianza' }
]

export const USOS_CFDI = [
  { id: 'G01', nombre: 'Adquisición de mercancías' },
  { id: 'G03', nombre: 'Gastos en general' },
  { id: 'D01', nombre: 'Honorarios médicos, dentales y gastos hospitalarios' },
  { id: 'D10', nombre: 'Pagos por servicios educativos (colegiaturas)' },
  { id: 'P01', nombre: 'Por definir' },
  { id: 'S01', nombre: 'Sin efectos fiscales' },
  { id: 'CP01', nombre: 'Pagos' },
  { id: 'CN01', nombre: 'Nómina' }
]

export const FORMAS_PAGO = [
  { id: '01', nombre: 'Efectivo' },
  { id: '02', nombre: 'Cheque nominativo' },
  { id: '03', nombre: 'Transferencia electrónica de fondos' },
  { id: '04', nombre: 'Tarjeta de crédito' },
  { id: '28', nombre: 'Tarjeta de débito' },
  { id: '99', nombre: 'Por definir' }
]

export const METODOS_PAGO = [
  { id: 'PUE', nombre: 'Pago en una sola exhibición' },
  { id: 'PPD', nombre: 'Pago en parcialidades o diferido' }
]

export const MONEDAS = [
  { id: 'MXN', nombre: 'Peso Mexicano', tipoCambio: 1 },
  { id: 'USD', nombre: 'Dólar Americano', tipoCambio: 17.2 },
  { id: 'EUR', nombre: 'Euro', tipoCambio: 18.6 }
]

export const CLAVES_UNIDAD = [
  { id: 'H87', nombre: 'Pieza' },
  { id: 'E48', nombre: 'Servicio' },
  { id: 'ACT', nombre: 'Actividad' },
  { id: 'KGM', nombre: 'Kilogramo' },
  { id: 'LTR', nombre: 'Litro' }
]

export const TIPOS_CFDI = {
  I: 'Ingreso', E: 'Egreso', P: 'Pago', T: 'Traslado', N: 'Nómina'
}

export const MOTIVOS_CANCELACION = [
  { id: '01', nombre: 'Comprobante emitido con errores con relación' },
  { id: '02', nombre: 'Comprobante emitido con errores sin relación' },
  { id: '03', nombre: 'No se llevó a cabo la operación' },
  { id: '04', nombre: 'Operación nominativa relacionada en factura global' }
]

export const TIPOS_RELACION = [
  { id: '01', nombre: 'Nota de crédito de los documentos relacionados' },
  { id: '02', nombre: 'Nota de débito de los documentos relacionados' },
  { id: '03', nombre: 'Devolución de mercancía sobre facturas' },
  { id: '04', nombre: 'Sustitución de los CFDI previos' }
]

export const CLAVES_PRODSERV = [
  { id: '01010101', nombre: 'No existe en el catálogo' },
  { id: '50202306', nombre: 'Refrescos' },
  { id: '50181906', nombre: 'Café' },
  { id: '14111506', nombre: 'Cuadernos' },
  { id: '44121708', nombre: 'Bolígrafos' },
  { id: '85121800', nombre: 'Servicios médicos' },
  { id: '86121500', nombre: 'Servicios educativos' },
  { id: '80131500', nombre: 'Servicios de arrendamiento de bienes inmuebles' },
  { id: '80121600', nombre: 'Servicios de derecho comercial' },
  { id: '78101800', nombre: 'Transporte de carga por carretera' }
]

export const PERIODICIDADES = [
  { id: '01', nombre: 'Diaria' },
  { id: '02', nombre: 'Semanal' },
  { id: '03', nombre: 'Quincenal' },
  { id: '04', nombre: 'Mensual' },
  { id: '05', nombre: 'Bimestral' }
]
