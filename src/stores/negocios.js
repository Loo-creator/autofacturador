import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as svc from '@/services/negocio.service'

export const useNegociosStore = defineStore('negocios', () => {
  const items = ref([])
  const loading = ref(false)
  async function fetch() { loading.value = true; const r = await svc.listNegocios(); loading.value = false; if (r.ok) items.value = r.data; return r }
  async function create(payload) { const r = await svc.createNegocio(payload); if (r.ok) await fetch(); return r }
  async function update(id, payload) { const r = await svc.updateNegocio(id, payload); if (r.ok) await fetch(); return r }
  async function remove(id) { const r = await svc.deleteNegocio(id); if (r.ok) await fetch(); return r }
  return { items, loading, fetch, create, update, remove }
})
