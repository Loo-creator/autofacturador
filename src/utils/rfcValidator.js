// Regex SAT RFC: Persona Moral (12) y Persona Física (13)
export const RFC_MORAL = /^[A-ZÑ&]{3}\d{6}[A-Z0-9]{3}$/i
export const RFC_FISICA = /^[A-ZÑ&]{4}\d{6}[A-Z0-9]{3}$/i
export const RFC_GENERICO = /^XAXX010101000$/i
export const RFC_EXTRANJERO = /^XEXX010101000$/i

export function validarRFC(rfc = '') {
  const v = (rfc || '').trim().toUpperCase()
  if (!v) return { ok: false, msg: 'RFC requerido' }
  if (RFC_GENERICO.test(v)) return { ok: true, tipo: 'generico', msg: 'RFC genérico público en general' }
  if (RFC_EXTRANJERO.test(v)) return { ok: true, tipo: 'extranjero', msg: 'RFC extranjero' }
  if (RFC_MORAL.test(v)) return { ok: true, tipo: 'moral', msg: 'Persona moral' }
  if (RFC_FISICA.test(v)) return { ok: true, tipo: 'fisica', msg: 'Persona física' }
  return { ok: false, msg: 'Formato de RFC inválido (12 moral / 13 física)' }
}

export function validarCP(cp = '') {
  const v = String(cp || '').trim()
  if (!/^\d{5}$/.test(v)) return { ok: false, msg: 'Código postal debe ser de 5 dígitos' }
  return { ok: true, msg: '' }
}

export function validarEmail(email = '') {
  const v = String(email || '').trim()
  if (!v) return { ok: true, msg: '' }
  const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
  return { ok, msg: ok ? '' : 'Correo electrónico inválido' }
}

export function validarRegimenUso(regimen, uso) {
  // Reglas simplificadas: S01/CP01 válidos para la mayoría; P01 comodín
  if (!uso) return { ok: false, msg: 'Uso CFDI requerido' }
  if (uso === 'P01') return { ok: true, msg: '' }
  if (['616', '605'].includes(regimen) && !['S01', 'CN01', 'D01', 'G03'].includes(uso)) {
    return { ok: false, msg: 'Uso CFDI no compatible con el régimen seleccionado' }
  }
  return { ok: true, msg: '' }
}

export function validarMontos(conceptos = []) {
  if (!conceptos.length) return { ok: false, msg: 'Debe haber al menos un concepto' }
  for (const c of conceptos) {
    if (Number(c.cantidad) <= 0) return { ok: false, msg: 'Cantidad debe ser mayor a 0' }
    if (Number(c.valorUnitario) < 0) return { ok: false, msg: 'Valor unitario inválido' }
  }
  return { ok: true, msg: '' }
}
