import { escapeXml, formatDate } from './formatters'

/**
 * Genera un XML CFDI 4.0 simulado (estructura real SAT simplificada) para descarga.
 * @param {Object} factura
 * @returns {string}
 */
export function generarXML(factura) {
  const f = factura
  const e = f.emisor || {}
  const r = f.receptor || {}
  const conceptos = (f.conceptos || []).map(c => `
    <cfdi:Concepto ClaveProdServ="${escapeXml(c.claveProdServ)}" ClaveUnidad="${escapeXml(c.claveUnidad)}"
      Cantidad="${c.cantidad}" Unidad="${escapeXml(c.unidad || '')}" Descripcion="${escapeXml(c.descripcion)}"
      ValorUnitario="${Number(c.valorUnitario).toFixed(2)}" Importe="${(Number(c.cantidad)*Number(c.valorUnitario)).toFixed(2)}"
      Descuento="${Number(c.descuento||0).toFixed(2)}" ObjetoImp="${escapeXml(c.objetoImp || '02')}">
      <cfdi:Impuestos>
        <cfdi:Traslados>
          <cfdi:Traslado Base="${(Number(c.cantidad)*Number(c.valorUnitario)-Number(c.descuento||0)).toFixed(2)}" Impuesto="002" TipoFactor="Tasa" TasaOCuota="${(Number(c.iva||16)/100).toFixed(6)}" Importe="${(((Number(c.cantidad)*Number(c.valorUnitario)-Number(c.descuento||0))*Number(c.iva||16)/100)).toFixed(2)}" />
        </cfdi:Traslados>
      </cfdi:Impuestos>
    </cfdi:Concepto>`).join('')

  const relacionados = (f.cfdiRelacionados || []).length ? `
  <cfdi:CfdiRelacionados TipoRelacion="${escapeXml(f.tipoRelacion || '04')}">
    ${f.cfdiRelacionados.map(u => `<cfdi:CfdiRelacionado UUID="${escapeXml(u)}" />`).join('\n    ')}
  </cfdi:CfdiRelacionados>` : ''

  const infoGlobal = f.tipo === 'GLOBAL' ? `
  <cfdi:InformacionGlobal Periodicidad="${escapeXml(f.periodicidad || '04')}" Meses="${escapeXml(f.meses || '01')}" Anio="${escapeXml(f.anio || new Date().getFullYear())}" />` : ''

  return `<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  Version="4.0" Serie="${escapeXml(f.serie || 'A')}" Folio="${escapeXml(f.folio || '')}"
  Fecha="${escapeXml(f.fecha || new Date().toISOString())}" FormaPago="${escapeXml(f.formaPago || '03')}"
  SubTotal="${Number(f.subtotal||0).toFixed(2)}" Descuento="${Number(f.descuento||0).toFixed(2)}"
  Moneda="${escapeXml(f.moneda || 'MXN')}" TipoCambio="${Number(f.tipoCambio||1).toFixed(2)}"
  Total="${Number(f.total||0).toFixed(2)}" TipoDeComprobante="${escapeXml(f.tipoComprobante || 'I')}"
  Exportacion="${escapeXml(f.exportacion || '01')}" MetodoPago="${escapeXml(f.metodoPago || 'PUE')}"
  LugarExpedicion="${escapeXml(e.cp || '00000')}" Sello="MOCK_SELLO" NoCertificado="00001000000500000000" Certificado="MOCK_CERT">
  ${infoGlobal}${relacionados}
  <cfdi:Emisor Rfc="${escapeXml(e.rfc || '')}" Nombre="${escapeXml(e.nombre || '')}" RegimenFiscal="${escapeXml(e.regimen || '601')}" />
  <cfdi:Receptor Rfc="${escapeXml(r.rfc || '')}" Nombre="${escapeXml(r.nombre || '')}" DomicilioFiscalReceptor="${escapeXml(r.cp || '')}" RegimenFiscalReceptor="${escapeXml(r.regimen || '616')}" UsoCFDI="${escapeXml(f.usoCfdi || 'G03')}" />
  <cfdi:Conceptos>${conceptos}
  </cfdi:Conceptos>
  <cfdi:Impuestos TotalImpuestosTrasladados="${Number(f.impuestosTrasladados||0).toFixed(2)}" TotalImpuestosRetenidos="${Number(f.impuestosRetenidos||0).toFixed(2)}">
    <cfdi:Traslados>
      <cfdi:Traslado Base="${(Number(f.subtotal||0)-Number(f.descuento||0)).toFixed(2)}" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="${Number(f.impuestosTrasladados||0).toFixed(2)}" />
    </cfdi:Traslados>
  </cfdi:Impuestos>
  <cfdi:Complemento>
    <tfd:TimbreFiscalDigital xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital" Version="1.1"
      UUID="${escapeXml(f.uuid || '00000000-0000-4000-8000-000000000000')}"
      FechaTimbrado="${escapeXml(f.fechaTimbrado || f.fecha || new Date().toISOString())}"
      RfcProvCertif="AAA010101AAA" SelloCFD="MOCK" SelloSAT="MOCK" NoCertificadoSAT="00001000000500000000" />
  </cfdi:Complemento>
</cfdi:Comprobante>`
}

/**
 * Genera un PDF simulado (texto plano formateado) como Blob descargable.
 * Se usa contenido de texto legible para cumplir con la descarga sin dependencias.
 */
export function generarPDF(factura) {
  const f = factura
  const e = f.emisor || {}
  const r = f.receptor || {}
  const lines = [
    'Autofacturación - REPRESENTACIÓN IMPRESA CFDI 4.0 (SIMULADA)',
    '='.repeat(64),
    `UUID: ${f.uuid || 'N/A'}`,
    `Folio: ${f.serie || ''}-${f.folio || ''}   Tipo: ${f.tipoComprobante || 'I'}   Fecha: ${formatDate(f.fecha)}`,
    `Estado: ${f.estado || 'vigente'}`,
    '',
    'EMISOR',
    `  RFC: ${e.rfc || ''}  Nombre: ${e.nombre || ''}`,
    `  Régimen: ${e.regimen || ''}  CP: ${e.cp || ''}`,
    '',
    'RECEPTOR',
    `  RFC: ${r.rfc || ''}  Nombre: ${r.nombre || ''}`,
    `  Régimen: ${r.regimen || ''}  CP: ${r.cp || ''}  Uso CFDI: ${f.usoCfdi || ''}`,
    '',
    'CONCEPTOS',
    ...((f.conceptos || []).map((c, i) =>
      `  ${i + 1}. [${c.claveProdServ}] ${c.descripcion}  Cant: ${c.cantidad} ${c.claveUnidad}  P.Unit: $${Number(c.valorUnitario).toFixed(2)}  Importe: $${(Number(c.cantidad)*Number(c.valorUnitario)).toFixed(2)}`
    )),
    '',
    'TOTALES',
    `  Subtotal:  $${Number(f.subtotal||0).toFixed(2)}`,
    `  Descuento: $${Number(f.descuento||0).toFixed(2)}`,
    `  IVA Trasl: $${Number(f.impuestosTrasladados||0).toFixed(2)}`,
    `  Retenc.:   $${Number(f.impuestosRetenidos||0).toFixed(2)}`,
    `  TOTAL:     $${Number(f.total||0).toFixed(2)} ${f.moneda || 'MXN'}`,
    '',
    `Forma pago: ${f.formaPago || ''}  Método: ${f.metodoPago || ''}`,
    '',
    'Documento simulado para fines de demostración. No tiene validez fiscal.',
  ]
  return new Blob([lines.join('\n')], { type: 'application/pdf' })
}
