// Constancias de Situación Fiscal simuladas (CSF).
// Referencia de mercado: Walmart/Coppel exigen que RFC, Razón Social y CP coincidan
// con la CSF; si no, el comprobante es rechazado.
//
// El catálogo es de DEMOSTRACIÓN: cualquier RFC con estructura válida que no esté
// aquí se reporta como "no verificado" (aviso, no error), para poder probar el
// portal con datos reales.

const AHORA = new Date()

function fechaHaceDias(n) {
  const d = new Date(AHORA)
  d.setDate(d.getDate() - n)
  d.setHours(9, 0, 0, 0)
  return d.toISOString()
}

const definiciones = [
  // ── Personas morales ────────────────────────────────────────────────────
  {
    rfc: 'CFA210101AA1',
    razonSocial: 'COMERCIALIZADORA NORTE SA DE CV',
    regimen: '601',
    cp: '44110',
    tipo: 'persona_moral',
    fechaNacimiento: '2021-01-01',
    diasActualizacion: 12,
    estado: 'activa',
  },
  {
    rfc: 'AAA010101XXX',
    razonSocial: 'RES REGIMEN SIMPLIFICADO DE CONFIANZA SA DE CV',
    regimen: '603',
    cp: '01010',
    tipo: 'persona_moral',
    fechaNacimiento: '2001-01-01',
    diasActualizacion: 90,
    estado: 'activa',
  },

  {
    rfc: 'AAA020202YYY',
    razonSocial: 'CONSORCIO RES SA DE CV',
    regimen: '603',
    cp: '44160',
    tipo: 'persona_moral',
    fechaNacimiento: '2002-02-02',
    diasActualizacion: 60,
    estado: 'activa',
  },

  // ── Personas físicas ────────────────────────────────────────────────────
  {
    rfc: 'PELJ8001019A1',
    razonSocial: 'JUAN PÉREZ LÓPEZ',
    regimen: '612',
    cp: '44110',
    tipo: 'persona_fisica',
    fechaNacimiento: '1980-01-01',
    diasActualizacion: 12,
    estado: 'activa',
  },
  {
    rfc: 'GARM850215AB2',
    razonSocial: 'MARÍA GARCÍA RUIZ',
    regimen: '605',
    cp: '64010',
    tipo: 'persona_fisica',
    fechaNacimiento: '1985-02-15',
    diasActualizacion: 25,
    estado: 'activa',
  },
  {
    rfc: 'TOMA900512CD4',
    razonSocial: 'ANA TORRES MÉNDEZ',
    regimen: '626',
    cp: '44120',
    tipo: 'persona_fisica',
    fechaNacimiento: '1990-05-12',
    diasActualizacion: 8,
    estado: 'activa',
  },
  {
    rfc: 'AAAA010101XXX',
    razonSocial: 'RES REGIMEN SIMPLIFICADO DE CONFIANZA',
    regimen: '626',
    cp: '01010',
    tipo: 'persona_fisica',
    fechaNacimiento: '2001-01-01',
    diasActualizacion: 150,
    estado: 'activa',
  },

  // ── Caso de homonimia (mismo nombre, RFC distinto) ──────────────────────
  {
    rfc: 'PELJ8001012B2',
    razonSocial: 'JUAN PÉREZ LÓPEZ',
    regimen: '626',
    cp: '44110',
    tipo: 'persona_fisica',
    fechaNacimiento: '1980-01-01',
    diasActualizacion: 200,
    estado: 'activa',
  },

  // ── Caso de CSF suspendida ─────────────────────────────────────────────
  {
    rfc: 'SUSR900101ZZ9',
    razonSocial: 'SUPERVISOR FISCAL DE PRUEBA SA DE CV',
    regimen: '601',
    cp: '01010',
    tipo: 'persona_moral',
    fechaNacimiento: '1990-01-01',
    diasActualizacion: 400,
    estado: 'suspendida',
  },
]

export const csfSeed = definiciones.map(d => ({
  ...d,
  fechaActualizacion: fechaHaceDias(d.diasActualizacion),
  diasVigencia: d.diasActualizacion,
}))

// RFC genérico: no requiere CSF (factura global / público en general).
export const RFC_GENERICO = 'XAXX010101000'
export const RFC_EXTRANJERO = 'XEXX010101000'
