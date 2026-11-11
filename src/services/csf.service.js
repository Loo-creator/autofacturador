import { csfSeed, RFC_GENERICO, RFC_EXTRANJERO } from '@/mocks/csf.mock'
import { delay, response } from '@/mocks/api.mock'
import { compararConCsf, normalizarTexto, CODIGO_CSF } from '@/utils/csfValidator'
import { tipoPersona, TIPO_PERSONA } from '@/utils/cfdiValidations'

/**
 * Consulta la Constancia de Situación Fiscal de un RFC y compara los datos capturados.
 *
 * Se comporta como el CSAT del SAT:
 *   - RFC en el catálogo → devuelve la constancia completa y compara campo por campo.
 *   - RFC con estructura válida pero fuera del catálogo de demostración → NO se bloquea:
 *     se avisa que no fue posible verificarlo y se conservan los datos capturados.
 *     (Así el portal sirve para probar con cualquier RFC real.)
 *   - RFC con estructura inválida → error.
 *
 * @future GET /api/v1/csf/:rfc  (proxy a SAT / proveedor de CSF)
 */
export async function consultarCsf(rfc, contexto = {}) {
  await delay(420)
  const r = String(rfc || '').trim().toUpperCase()

  if (!r) {
    return response(true, {
      rfc: r,
      csf: null,
      validacion: compararConCsf({ csf: null, rfc: r, ...contexto }),
    })
  }

  if (r === RFC_GENERICO || r === RFC_EXTRANJERO) {
    return response(true, {
      rfc: r,
      csf: null,
      validacion: compararConCsf({ csf: null, rfc: r, ...contexto }),
    })
  }

  const csf = csfSeed.find(c => c.rfc === r) || null

  // ── RFC fuera del catálogo de demostración ──────────────────────────────
  if (!csf) {
    const tipo = tipoPersona(r)
    const valido = tipo === TIPO_PERSONA.FISICA || tipo === TIPO_PERSONA.MORAL
    if (!valido) {
      return response(true, {
        rfc: r,
        csf: null,
        validacion: compararConCsf({ csf: null, rfc: r, ...contexto }),
      })
    }

    const sugiereRegimen = tipo === TIPO_PERSONA.MORAL ? '601' : '626'
    return response(true, {
      rfc: r,
      csf: null,
      sinVerificar: true,
      validacion: {
        ok: true,
        nivel: 'warning',
        codigo: 'NO_VERIFICADO',
        mensaje: 'Este RFC no está en el catálogo de demostración, así que no se pudo verificar contra la CSF. Se conservaron los datos que capturaste: confirma el régimen y la razón social.',
        campos: [
          { campo: 'RFC', capturado: r, csf: 'Sin catálogo', coincide: true },
          { campo: 'Razón social', capturado: contexto.razonSocial || '—', csf: 'Sin catálogo', coincide: true },
          { campo: 'CP domicilio fiscal', capturado: contexto.cp || '—', csf: 'Sin catálogo', coincide: true },
          { campo: 'Régimen fiscal', capturado: contexto.regimen || '—', csf: 'Sin catálogo', coincide: true },
        ],
        sugerenciaRegimen: sugiereRegimen,
        tipo,
      },
    })
  }

  // ── RFC en el catálogo: comparación campo por campo ─────────────────────
  const homonimos = csfSeed.filter(c => c.rfc !== csf.rfc && normalizarTexto(c.razonSocial) === normalizarTexto(csf.razonSocial))
  const validacion = compararConCsf({ csf, homonimos, rfc: r, ...contexto })

  return response(true, { rfc: r, csf, homonimos, validacion })
}

export { CODIGO_CSF }
