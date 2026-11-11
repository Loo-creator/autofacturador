import { computed } from 'vue'
import { validarRFC, validarCP, validarRegimenUso } from '@/utils/rfcValidator'

/**
 * Semáforo de emission: combina las validaciones de CFDI 4.0 con el resultado de la
 * consulta de CSF y el estado del ticket, para habilitar/deshabilitar el botón de timbrado
 * con un motivo explícito (nunca un fallo genérico).
 *
 * @param {object} receptor  objeto reactivo { rfc, nombre, regimen, cp, usoCfdi }
 * @param {object} ticketRef ref con { ticket, evaluacion }
 * @param {object} csfRef    ref con el resultado de validarConCsf
 */
export function useEmision(receptor, ticketRef, csfRef) {
  const validaciones = computed(() => {
    const out = []
    const r = receptor || {}
    const csf = csfRef?.value

    if (!String(r.rfc || '').trim()) {
      out.push({ nivel: 'error', campo: 'rfc', mensaje: 'Captura el RFC del receptor.' })
    } else {
      const vr = validarRFC(r.rfc)
      if (!vr.ok) out.push({ nivel: 'error', campo: 'rfc', mensaje: vr.msg })
    }

    if (!String(r.nombre || '').trim()) {
      out.push({ nivel: 'error', campo: 'nombre', mensaje: 'Captura el nombre o razón social del receptor.' })
    }

    if (!String(r.cp || '').trim()) {
      out.push({ nivel: 'error', campo: 'cp', mensaje: 'Captura el código postal del domicilio fiscal.' })
    } else {
      const vc = validarCP(r.cp)
      if (!vc.ok) out.push({ nivel: 'error', campo: 'cp', mensaje: vc.msg })
    }

    const ru = validarRegimenUso(r.regimen, r.usoCfdi)
    if (!ru.ok) out.push({ nivel: 'error', campo: 'usoCfdi', mensaje: ru.msg })

    if (csf && csf.nivel === 'error') {
      out.push({ nivel: 'error', campo: 'csf', mensaje: csf.mensaje })
    } else if (csf && csf.nivel === 'warning') {
      out.push({ nivel: 'warning', campo: 'csf', mensaje: csf.mensaje })
    }

    return out
  })

  const errores = computed(() => validaciones.value.filter(v => v.nivel === 'error'))
  const avisos = computed(() => validaciones.value.filter(v => v.nivel === 'warning'))

  const ticketListo = computed(() => ticketRef?.value?.evaluacion?.facturable === true)

  const puedeEmitir = computed(() => ticketListo.value && errores.value.length === 0)

  const motivoBloqueo = computed(() => {
    if (!ticketListo.value) {
      return ticketRef?.value?.evaluacion?.mensaje || 'Primero localiza un ticket válido.'
    }
    if (errores.value.length) return errores.value[0].mensaje
    return ''
  })

  return { validaciones, errores, avisos, puedeEmitir, ticketListo, motivoBloqueo }
}
