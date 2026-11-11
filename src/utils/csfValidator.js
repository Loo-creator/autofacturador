// Comparación de los datos capturados contra la Constancia de Situación Fiscal (CSF).
// Regla de mercado: Walmart/Coppel rechazan el comprobante si RFC, Razón Social y CP
// no coinciden con la CSF. Aquí se replica esa validación para evitar rechazos del SAT.

export const CODIGO_CSF = {
  OK: 'OK',
  FORMATO_INVALIDO: 'FORMATO_INVALIDO',
  RFC_REQUERIDO: 'RFC_REQUERIDO',
  FORMATO_RFC: 'FORMATO_RFC',
  RFC_GENERICO: 'RFC_GENERICO',
  RFC_NO_ENCONTRADO: 'RFC_NO_ENCONTRADO',
  CSF_NO_ACTIVA: 'CSF_NO_ACTIVA',
  RAZON_SOCIAL_NO_COINCIDE: 'RAZON_SOCIAL_NO_COINCIDE',
  HOMONIMIA: 'HOMONIMIA',
  CP_NO_COINCIDE: 'CP_NO_COINCIDE',
  REGIMEN_NO_COINCIDE: 'REGIMEN_NO_COINCIDE',
  CSF_DESACTUALIZADA: 'CSF_DESACTUALIZADA',
}

export const VIGENCIA_CSF_DIAS = 60

/** Normaliza razón social: sin acentos, sin puntuación, en mayúsculas. */
export function normalizarTexto(s = '') {
  return String(s)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
}

function diasDesde(fecha, hoy = new Date()) {
  if (!fecha) return null
  const a = new Date(fecha)
  if (Number.isNaN(a.getTime())) return null
  const b = new Date(hoy)
  return Math.round((b - a) / 86400000)
}

/**
 * @param {object} p
 * @param {object|null} p.csf        CSF encontrada
 * @param {object[]} p.homonimos     CSF con la misma razón social (riesgo de homonimia)
 * @param {string} p.rfc
 * @param {string} p.razonSocial
 * @param {string} p.regimen
 * @param {string} p.cp
 * @returns {{ok:boolean, nivel:'ok'|'warning'|'error', codigo:string, mensaje:string, campos:Array}}
 */
export function compararConCsf({ csf = null, homonimos = [], rfc = '', razonSocial = '', regimen = '', cp = '' } = {}, hoy = new Date()) {
  const rfcLimpio = String(rfc || '').trim().toUpperCase()
  const campos = []
  const base = { campos, csf, homonimos }

  if (!rfcLimpio) {
    return { ...base, ok: false, nivel: 'idle', codigo: CODIGO_CSF.RFC_REQUERIDO, mensaje: 'Captura tu RFC para validar contra la CSF.' }
  }

  if (rfcLimpio === 'XAXX010101000') {
    return {
      ...base,
      ok: true,
      nivel: 'warning',
      codigo: CODIGO_CSF.RFC_GENERICO,
      mensaje: 'RFC genérico: se permite únicamente para ventas al público en general (factura global).',
    }
  }

  if (!csf) {
    // Sin CSF: primero se revisa la ESTRUCTURA del RFC (si es inválido, el error es de formato).
    const esMoral = /^[A-ZÑ&]{3}\d{6}[A-Z0-9]{3}$/i.test(rfc)
    const esFisica = /^[A-ZÑ&]{4}\d{6}[A-Z0-9]{3}$/i.test(rfc)
    if (!esMoral && !esFisica) {
      return {
        ...base,
        ok: false,
        nivel: 'error',
        codigo: CODIGO_CSF.FORMATO_INVALIDO,
        mensaje: 'Formato de RFC inválido: 12 caracteres para persona moral o 13 para persona física.',
      }
    }
    return {
      ...base,
      ok: false,
      nivel: 'error',
      codigo: CODIGO_CSF.RFC_NO_ENCONTRADO,
      mensaje: 'El RFC no fue encontrado en la Constancia de Situación Fiscal. Revísalo o solicita la constancia al SAT.',
    }
  }

  // ── Razón social ──────────────────────────────────────────────────────────
  const capRazon = normalizarTexto(razonSocial)
  const csfRazon = normalizarTexto(csf.razonSocial)
  const coincideRazon = !capRazon || capRazon === csfRazon
  campos.push({ campo: 'Razón social', capturado: razonSocial || '—', csf: csf.razonSocial, coincide: coincideRazon })

  // ── Código postal ─────────────────────────────────────────────────────────
  const coincideCp = !cp || String(cp).trim() === String(csf.cp).trim()
  campos.push({ campo: 'CP domicilio fiscal', capturado: cp || '—', csf: csf.cp, coincide: coincideCp })

  // ── Régimen fiscal ────────────────────────────────────────────────────────
  const coincideRegimen = !regimen || String(regimen) === String(csf.regimen)
  campos.push({ campo: 'Régimen fiscal', capturado: regimen || '—', csf: csf.regimen, coincide: coincideRegimen })

  campos.unshift({ campo: 'RFC', capturado: rfcLimpio, csf: csf.rfc, coincide: rfcLimpio === csf.rfc })

  if (csf.estado && csf.estado !== 'activa') {
    return {
      ...base,
      ok: false,
      nivel: 'error',
      codigo: CODIGO_CSF.CSF_NO_ACTIVA,
      mensaje: `La constancia está ${csf.estado}. Un RFC suspendido no puede facturar.`,
    }
  }

  if (!coincideRazon) {
    return {
      ...base,
      ok: false,
      nivel: 'error',
      codigo: CODIGO_CSF.RAZON_SOCIAL_NO_COINCIDE,
      mensaje: `La razón social no coincide con la CSF ("${csf.razonSocial}"). El comprobante sería rechazado.`,
    }
  }

  if (!coincideCp) {
    return {
      ...base,
      ok: false,
      nivel: 'error',
      codigo: CODIGO_CSF.CP_NO_COINCIDE,
      mensaje: `El código postal no coincide con el domicilio fiscal de la CSF (${csf.cp}).`,
    }
  }

  if (!coincideRegimen) {
    return {
      ...base,
      ok: false,
      nivel: 'error',
      codigo: CODIGO_CSF.REGIMEN_NO_COINCIDE,
      mensaje: `El régimen ${regimen} no coincide con el de la CSF (${csf.regimen}).`,
    }
  }

  // Los errores duros van primero; la homonimia es un aviso (no impide emitir).
  if (homonimos.length) {
    return {
      ...base,
      ok: true,
      nivel: 'warning',
      codigo: CODIGO_CSF.HOMONIMIA,
      mensaje: `Ojo: existen ${homonimos.length + 1} constancias con la misma razón social (posible homonimia). Confirma que el RFC es el tuyo.`,
    }
  }

  const vigencia = diasDesde(csf.fechaActualizacion, hoy)
  if (vigencia != null && vigencia > VIGENCIA_CSF_DIAS) {
    return {
      ...base,
      ok: true,
      nivel: 'warning',
      codigo: CODIGO_CSF.CSF_DESACTUALIZADA,
      mensaje: `La CSF tiene ${vigencia} días de actualizada. Se recomienda renovarla para evitar rechazo del SAT.`,
    }
  }

  return {
    ...base,
    ok: true,
    nivel: 'ok',
    codigo: CODIGO_CSF.OK,
    mensaje: 'Los datos coinciden con la Constancia de Situación Fiscal.',
  }
}
