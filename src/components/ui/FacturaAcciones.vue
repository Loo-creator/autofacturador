<script setup>
/**
 * Acciones sobre un comprobante, dentro de un menú "Opciones":
 * descargar XML, descargar PDF, enviar por correo y solicitar la cancelación.
 */
import { computed } from 'vue'
import ActionMenu from '@/components/ui/ActionMenu.vue'
import { descargarXML, descargarPDF } from '@/services/factura.service'
import { downloadBlob } from '@/utils/formatters'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  factura: { type: Object, required: true },
  compacto: { type: Boolean, default: false },
  mostrarCorreo: { type: Boolean, default: true },
  mostrarCancelar: { type: Boolean, default: false },
  puedeDescargar: { type: Boolean, default: true }
})

const emit = defineEmits(['cancelar'])

const toast = useToast()

const cancelable = computed(() => props.factura?.estado === 'vigente')

const items = computed(() => {
  const lista = [
    {
      key: 'xml', label: 'Descargar XML', hint: 'Archivo XML del comprobante',
      icon: 'xml', group: 'Comprobante', disabled: !props.puedeDescargar,
    },
    {
      key: 'pdf', label: 'Descargar PDF', hint: 'Representación impresa',
      icon: 'pdf', group: 'Comprobante', disabled: !props.puedeDescargar,
    },
  ]
  if (props.mostrarCorreo) {
    lista.push({
      key: 'correo', label: 'Enviar por correo',
      hint: props.factura?.receptor?.email || 'Al correo registrado del receptor',
      icon: 'mail', group: 'Comprobante',
    })
  }
  if (props.mostrarCancelar) {
    lista.push({
      key: 'cancelar', label: 'Solicitar cancelación',
      hint: cancelable.value ? 'Con motivo SAT (01–04)' : 'Sólo disponible en CFDI vigentes',
      icon: 'cancel', group: 'Cancelación', danger: true, disabled: !cancelable.value,
    })
  }
  return lista
})

async function xml() {
  const r = await descargarXML(props.factura.id)
  if (r.ok) downloadBlob(r.data.content, r.data.filename, 'application/xml')
  else toast.error({ title: 'No se pudo descargar el XML', message: r.error })
}

async function pdf() {
  const r = await descargarPDF(props.factura.id)
  if (r.ok) downloadBlob(r.data.blob, r.data.filename, 'application/pdf')
  else toast.error({ title: 'No se pudo descargar el PDF', message: r.error })
}

function correo() {
  const destino = props.factura?.receptor?.email || 'el correo registrado del receptor'
  toast.success({
    title: 'Comprobante enviado',
    message: `El CFDI ${props.factura?.serie}-${props.factura?.folio} se envió a ${destino}.`,
  })
}

function onSelect(item) {
  if (item.key === 'xml') return xml()
  if (item.key === 'pdf') return pdf()
  if (item.key === 'correo') return correo()
  if (item.key === 'cancelar') return emit('cancelar', props.factura)
}
</script>

<template>
  <ActionMenu
    :items="items"
    label="Opciones"
    :compact="compacto"
    @select="onSelect"
  />
</template>
