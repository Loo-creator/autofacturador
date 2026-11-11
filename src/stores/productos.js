import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as svc from '@/services/negocio.service'

export const useProductosStore = defineStore('productos', () => {
  const items = ref([])
  const loading = ref(false)
  async function fetch(negocioId) { loading.value = true; const r = await svc.listProductos(negocioId); loading.value = false; if (r.ok) items.value = r.data; return r }
  async function save(payload) { const r = await svc.saveProducto(payload); if (r.ok) await fetch(payload.negocioId); return r }
  async function remove(id, negocioId) { const r = await svc.deleteProducto(id); if (r.ok) await fetch(negocioId); return r }
  return { items, loading, fetch, save, remove }
})
