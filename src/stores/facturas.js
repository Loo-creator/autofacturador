import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as svc from '@/services/factura.service'

export const useFacturasStore = defineStore('facturas', () => {
  const items = ref([])
  const loading = ref(false)
  async function fetch(filters = {}) { loading.value = true; const r = await svc.listFacturas(filters); loading.value = false; if (r.ok) items.value = r.data; return r }
  async function timbrar(payload) { const r = await svc.timbrarFactura(payload); if (r.ok) items.value.unshift(r.data); return r }
  async function timbrarGlobal(payload) { const r = await svc.timbrarGlobal(payload); if (r.ok) items.value.unshift(r.data); return r }
  async function solicitarCancelacion(id, data) { const r = await svc.solicitarCancelacion(id, data); if (r.ok) await fetch(); return r }
  async function resolverCancelacion(id, aprobar) { const r = await svc.resolverCancelacion(id, aprobar); if (r.ok) await fetch(); return r }
  return { items, loading, fetch, timbrar, timbrarGlobal, solicitarCancelacion, resolverCancelacion }
})
