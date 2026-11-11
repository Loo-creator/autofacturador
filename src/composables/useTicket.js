import { ref, computed } from 'vue'
import { getTicketByFolio } from '@/services/ticket.service'
import { ESTADO_TICKET } from '@/utils/ticketPolicy'

/**
 * Estado del flujo de facturación por folio de ticket.
 * Reemplaza el "mock sintético" por tickets reales con plazo, estado y folios consumidos.
 */
export function useTicket(opciones = {}) {
  const folio = ref('')
  const ticket = ref(null)
  const negocio = ref(null)
  const evaluacion = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const codigo = ref(null)

  const estado = computed(() => evaluacion.value?.estado || ESTADO_TICKET.NO_ENCONTRADO)
  const disponible = computed(() => evaluacion.value?.facturable === true)
  const diasRestantes = computed(() => evaluacion.value?.diasRestantes ?? null)
  const fechaLimite = computed(() => evaluacion.value?.fechaLimite || null)

  async function buscar(valor) {
    const f = String(valor ?? folio.value ?? '').trim()
    folio.value = f
    error.value = null
    codigo.value = null
    ticket.value = null
    negocio.value = null
    evaluacion.value = null

    if (!f) {
      error.value = 'Ingresa el folio del ticket de compra.'
      codigo.value = 'TICKET_REQUERIDO'
      return { ok: false }
    }

    loading.value = true
    const res = await getTicketByFolio(f, opciones.negocioId ? { negocioId: opciones.negocioId } : {})
    loading.value = false

    if (!res.ok) {
      error.value = res.error
      codigo.value = res.codigo || null
      evaluacion.value = res.contexto?.evaluacion || null
      ticket.value = res.contexto?.ticket || null
      negocio.value = res.contexto?.negocio || null
      return { ok: false, ...res }
    }

    ticket.value = res.data.ticket
    negocio.value = res.data.negocio
    evaluacion.value = res.data.evaluacion
    return { ok: true, ...res }
  }

  function limpiar() {
    folio.value = ''
    ticket.value = null
    negocio.value = null
    evaluacion.value = null
    error.value = null
    codigo.value = null
  }

  return {
    folio, ticket, negocio, evaluacion, loading, error, codigo,
    estado, disponible, diasRestantes, fechaLimite,
    buscar, limpiar,
  }
}
