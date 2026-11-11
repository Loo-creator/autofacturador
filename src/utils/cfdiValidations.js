/**
 * Validaciones fiscales del CFDI 4.0 (catálogo del SAT).
 *
 * Lo que el SAT (y el PAC) revisa al timbrar, y que aquí se replica:
 *
 * 1. El **RFC determina el tipo de persona** (física 13 caracteres / moral 12).
 * 2. El **régimen fiscal debe corresponder** al tipo de persona del RFC.
 * 3. El **uso de CFDI debe estar permitido** para ese régimen fiscal.
 *    - D01–D10 (honorarios médicos, educativos) → sólo regímenes de persona física sin
 *      obligaciones (616/620).
 *    - I01–I04 (ingresos por presentación de servicios) → sólo personas morales.
 *    - S01 (sin efectos fiscales) → no aplica a personas físicas con actividad
 *      empresarial (612).
 *    - CN01 (nómina) → sólo régimen 605.
 *    - P01 → comodín.
 * 4. El **RFC genérico/estanjero** sólo se acepta en factura global, nunca en una factura
 *    normal.
 * 5. La **razón social** debe ser coherente con el tipo de persona (una moral termina en
 *    "SA de CV", "S.A.", etc.; una física no).
 * 6. El **código postal** y el **correo** del receptor son obligatorios y con formato válido.
 */

import { RFC_GENERICO, RFC_EXTRANJERO, RFC_MORAL, RFC_FISICA } from './rfcValidator'

export const TIPO_PERSONA = {
  FISICA: 'fisica',
  MORAL: 'moral',
  GENERICO: 'generico',
  EXTRANJERO: 'extranjero',
}

/** Regímenes fiscales válidos por tipo de persona. */
export const REGIMENES_POR_TIPO = {
  [TIPO_PERSONA.MORAL]: ['601', '603'],
  [TIPO_PERSONA.FISICA]: ['605', '612', '616', '620', '626'],
  [TIPO_PERSONA.GENERICO]: ['616'],
  [TIPO_PERSONA.EXTRANJERO]: ['616'],
}

export const REGIMENES_FISCALES = {
  '601': { nombre: 'Persona Moral', tipo: TIPO_PERSONA.MORAL },
  '603': { nombre: 'Persona Moral sin fines lucrativos', tipo: TIPO_PERSONA.MORAL },
  '605': { nombre: 'Arrendamiento', tipo: TIPO_PERSONA.FISICA },
  '612': { nombre: 'Persona Física con actividades empresariales', tipo: TIPO_PERSONA.FISICA },
  '616': { nombre: 'Sin obligaciones fiscales', tipo: TIPO_PERSONA.FISICA },
  '620': { nombre: 'Actividad empresarial con régimen simplificado', tipo: TIPO_PERSONA.FISICA },
  '626': { nombre: 'Régimen Simplificado de Confianza', tipo: TIPO_PERSONA.FISICA },
}

/**
 * Usos de CFDI permitidos por régimen fiscal.
 * P01 (por definir) y CP01 (pagos) se gestionan aparte por sus reglas específicas.
 */
export const USOS_POR_REGIMEN = {
  '601': ['G01', 'G02', 'G03', 'I01', 'I02', 'I03', 'I04'],
  '603': ['G01', 'G02', 'G03', 'I01', 'I02', 'I03', 'I04'],
  '605': ['G01', 'G02', 'G03'],
  '612': ['G01', 'G02', 'G03'],
  '616': ['G01', 'G02', 'G03', 'D01', 'D02', 'D03', 'D04', 'D05', 'D06', 'D07', 'D08', 'D09', 'D10'],
  '620': ['G01', 'G02', 'G03', 'D01', 'D02', 'D03', 'D04', 'D05', 'D06', 'D07', 'D08', 'D09', 'D10'],
  '626': ['G01', 'G02', 'G03'],
}

/** Usos de CFDI con reglas particulares (no dependen del régimen). */
export const USOS_ESPECIALES = {
  P01: { nombre: 'Por definir', aplica: 'cualquiera' },
  S01: { nombre: 'Sin efectos fiscales', aplica: 'cualquiera salvo persona física con actividad empresarial (612)' },
  CP01: { nombre: 'Pagos (complemento de pago)', aplica: 'sólo régimen 605' },
  CN01: { nombre: 'Nómina', aplica: 'sólo régimen 605' },
}

/** Sufijos típicos de personas morales (para validar la razón social). */
const SUFIJOS_MORALES = ['SA DE CV', 'SA DE CV S', 'S DE RL', 'S DE RL DE CV', 'S A DE C V', 'SOCIEDAD', 'SC', 'AC', 'ABP', 'AS', 'SAS', 'SAPI DE CV', 'SC DE CV']
const SUFIJOS_FISICAS = ['SA DE CV', 'S DE RL', 'SAS', 'SAPI DE CV']

/** Tipo de persona según el RFC. */
export function tipoPersona(rfc = '') {
  const v = String(rfc || '').trim().toUpperCase()
  if (!v) return null
  if (RFC_GENERICO.test(v)) return TIPO_PERSONA.GENERICO
  if (RFC_EXTRANJERO.test(v)) return TIPO_PERSONA.EXTRANJERO
  if (RFC_MORAL.test(v)) return TIPO_PERSONA.MORAL
  if (RFC_FISICA.test(v)) return TIPO_PERSONA.FISICA
  return null
}

/** Regímenes disponibles para un tipo de persona. */
export function regimenesPara(tipo) {
  return REGIMENES_POR_TIPO[tipo] || []
}

/** ¿El régimen corresponde al tipo de persona del RFC? */
export function validarRegimen(rfc, regimen) {
  const tipo = tipoPersona(rfc)
  if (!tipo) return { ok: true, msg: '' }
  if (!regimen) return { ok: false, msg: 'Selecciona el régimen fiscal.' }
  if (tipo === TIPO_PERSONA.GENERICO || tipo === TIPO_PERSONA.EXTRANJERO) {
    return { ok: true, msg: '' }
  }
  const permitidos = regimenesPara(tipo)
  if (!permitidos.includes(String(regimen))) {
    const nombre = REGIMENES_FISCALES[regimen]?.nombre || regimen
    const esperados = tipo === TIPO_PERSONA.MORAL
      ? '601 (Persona Moral) o 603 (Sin fines lucrativos)'
      : '605, 612, 616, 620 o 626 (Persona Física)'
    return {
      ok: false,
      msg: `El RFC es de persona ${tipo === TIPO_PERSONA.MORAL ? 'moral' : 'física'} pero el régimen ${nombre} es de otro tipo. Para una persona ${tipo === TIPO_PERSONA.MORAL ? 'moral' : 'física'} corresponde: ${esperados}.`,
    }
  }
  return { ok: true, msg: '' }
}

/** ¿El uso de CFDI está permitido para ese régimen? */
export function validarUsoCfdi(rfc, regimen, uso) {
  const tipo = tipoPersona(rfc)
  if (!uso) return { ok: false, msg: 'Selecciona el uso del CFDI.' }

  if (uso === 'P01') return { ok: true, msg: '' }

  if (uso === 'CP01' || uso === 'CN01') {
    if (String(regimen) !== '605') {
      return { ok: false, msg: `El uso ${uso} sólo aplica al régimen 605 (Arrendamiento).` }
    }
    return { ok: true, msg: '' }
  }

  if (uso === 'S01') {
    if (tipo === TIPO_PERSONA.FISICA && String(regimen) === '612') {
      return { ok: false, msg: 'El uso S01 (Sin efectos fiscales) no aplica a personas físicas con actividad empresarial (régimen 612).' }
    }
    return { ok: true, msg: '' }
  }

  const permitidos = USOS_POR_REGIMEN[String(regimen)] || []
  if (!permitidos.includes(uso)) {
    const nombres = { D01: 'honorarios médicos', D10: 'servicios educativos', I01: 'ingresos por presentación de servicios' }
    const detalle = nombres[uso] ? ` (${nombres[uso]})` : ''
    return {
      ok: false,
      msg: `El uso ${uso}${detalle} no está permitido para el régimen ${regimen}. Usos válidos: ${permitidos.join(', ')}.`,
    }
  }
  return { ok: true, msg: '' }
}

/** Usos de CFDI que puede elegir el usuario para su régimen (con etiqueta de los no permitidos). */
export function usosDisponibles(regimen) {
  const base = USOS_POR_REGIMEN[String(regimen)] || []
  const todos = [...base, 'S01', 'P01']
  if (regimen === '605') todos.push('CP01', 'CN01')
  return [...new Set(todos)]
}

/** La razón social debe ser coherente con el tipo de persona. */
export function validarNombreRazonSocial(rfc, nombre) {
  const tipo = tipoPersona(rfc)
  const n = String(nombre || '').trim().toUpperCase()
  if (!n) return { ok: false, msg: 'El nombre o razón social es obligatorio.' }
  if (tipo === TIPO_PERSONA.MORAL) {
    const esMoral = SUFIJOS_MORALES.some(s => n.endsWith(s) || n.includes(s))
    if (!esMoral) {
      return { ok: false, msg: 'El RFC es de persona moral: la razón social debe incluir el régimen social (SA de CV, S de RL, etc.).' }
    }
  }
  if (tipo === TIPO_PERSONA.FISICA) {
    const pareceMoral = SUFIJOS_FISICAS.some(s => n.includes(s))
    if (pareceMoral) {
      return { ok: false, msg: 'El RFC es de persona física: la razón social no puede incluir un régimen social (SA de CV, etc.).' }
    }
  }
  return { ok: true, msg: '' }
}

/** El RFC genérico sólo se admite en factura global. */
export function validarRfcParaFactura(rfc, { esGlobal = false } = {}) {
  const tipo = tipoPersona(rfc)
  if (tipo === TIPO_PERSONA.GENERICO && !esGlobal) {
    return { ok: false, msg: 'El RFC genérico XAXX010101000 sólo se admite en factura global (público en general).' }
  }
  if (tipo === TIPO_PERSONA.EXTRANJERO && !esGlobal) {
    return { ok: false, msg: 'El RFC extranjero XEXX010101000 sólo se admite en factura global.' }
  }
  return { ok: true, msg: '' }
}

/**
 * Validación completa del receptor de una factura.
 * @returns {{ok:boolean, errores:{campo:string, mensaje:string}[], avisos:{campo:string, mensaje:string}[]}}
 */
export function validarReceptor({ rfc = '', nombre = '', regimen = '', usoCfdi = '', cp = '', correo = '', esGlobal = false } = {}) {
  const errores = []
  const avisos = []
  const push = (campo, res) => { if (!res.ok) errores.push({ campo, mensaje: res.msg }) }

  const tipo = tipoPersona(rfc)
  if (!rfc.trim()) {
    errores.push({ campo: 'rfc', mensaje: 'El RFC es obligatorio.' })
  } else if (!tipo) {
    errores.push({ campo: 'rfc', mensaje: 'Formato de RFC inválido (12 para persona moral, 13 para persona física).' })
  } else {
    push('rfc', validarRfcParaFactura(rfc, { esGlobal }))
    push('nombre', validarNombreRazonSocial(rfc, nombre))
    push('regimen', validarRegimen(rfc, regimen))
    push('usoCfdi', validarUsoCfdi(rfc, regimen, usoCfdi))
  }

  if (!String(cp).trim()) errores.push({ campo: 'cp', mensaje: 'El código postal es obligatorio.' })
  else if (!/^\d{5}$/.test(String(cp).trim())) errores.push({ campo: 'cp', mensaje: 'El código postal debe tener 5 dígitos.' })

  if (!String(correo).trim()) errores.push({ campo: 'correo', mensaje: 'El correo es obligatorio: es donde se recibe el comprobante.' })
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(correo).trim())) errores.push({ campo: 'correo', mensaje: 'El correo electrónico no tiene un formato válido.' })

  if (tipo === TIPO_PERSONA.FISICA && regimen === '616' && ['G01', 'G02', 'G03'].includes(usoCfdi)) {
    avisos.push({ campo: 'usoCfdi', mensaje: 'El régimen 616 (sin obligaciones fiscales) con un gasto en general no genera crédito fiscal; verifica que sea el uso correcto.' })
  }

  return { ok: errores.length === 0, errores, avisos, tipo }
}
