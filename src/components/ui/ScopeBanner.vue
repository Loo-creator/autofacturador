<script setup>
/**
 * Avisa al administrador de que está viendo la información agregada de todos los
 * negocios (no la de un negocio en concreto).
 */
import { computed } from 'vue'
import InlineBanner from './InlineBanner.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const visible = computed(() => auth.esAdmin && !auth.user?.negocioId)
</script>

<template>
  <InlineBanner
    v-if="visible"
    type="info"
    title="Vista global del administrador"
    message="Estás viendo la información de todos los negocios de la plataforma. Acota con los filtros o con el selector de negocio."
  />
</template>
