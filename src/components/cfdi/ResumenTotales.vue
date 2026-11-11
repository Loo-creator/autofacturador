<script setup>
import { computed } from 'vue'
import { formatMoney, calcTotales } from '@/utils/formatters'
const props = defineProps({ conceptos: { type: Array, default: () => [] }, moneda: { type: String, default: 'MXN' } })
const tot = computed(() => calcTotales(props.conceptos))
</script>

<template>
  <div class="card">
    <div class="card-header"><h3>Totales</h3></div>
    <div class="card-body" style="display:grid; gap:8px; font-size:var(--fs-sm)">
      <div style="display:flex; justify-content:space-between"><span class="text-muted">Subtotal</span><strong>{{ formatMoney(tot.subtotal, moneda) }}</strong></div>
      <div style="display:flex; justify-content:space-between"><span class="text-muted">Descuento</span><span>- {{ formatMoney(tot.descuento, moneda) }}</span></div>
      <div style="display:flex; justify-content:space-between"><span class="text-muted">Impuestos trasladados</span><span>{{ formatMoney(tot.impuestosTrasladados, moneda) }}</span></div>
      <div style="display:flex; justify-content:space-between"><span class="text-muted">Impuestos retenidos</span><span>- {{ formatMoney(tot.impuestosRetenidos, moneda) }}</span></div>
      <div class="divider"></div>
      <div style="display:flex; justify-content:space-between; font-size:var(--fs-lg)"><span>Total</span><strong>{{ formatMoney(tot.total, moneda) }}</strong></div>
    </div>
  </div>
</template>
