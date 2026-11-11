<script setup>
import { computed } from 'vue'
const props = defineProps({ status: String })
const map = {
  vigente: ['badge-success', 'Vigente'],
  cancelada: ['badge-danger', 'Cancelada'],
  pendiente_cancelacion: ['badge-warning', 'Pendiente cancelación'],
  activa: ['badge-success', 'Activa'],
  activo: ['badge-success', 'Activo'],
  suspendido: ['badge-danger', 'Suspendido'],
  aprobada: ['badge-success', 'Aprobada'],
  rechazada: ['badge-danger', 'Rechazada'],
  solicitada: ['badge-warning', 'Solicitada'],
  // Estados de ticket de compra (ver utils/ticketPolicy.js)
  disponible: ['badge-info', 'Por facturar'],
  facturado: ['badge-success', 'Facturado'],
  expirado: ['badge-danger', 'Expirado'],
  mes_cerrado: ['badge-warning', 'Mes cerrado'],
  no_encontrado: ['badge-muted', 'No encontrado'],
  facturado_global: ['badge-warning', 'Factura global']
}
const cfg = computed(() => map[props.status] || ['badge-muted', props.status || '—'])
</script>
<template>
  <span class="badge" :class="cfg[0]">{{ cfg[1] }}</span>
</template>
