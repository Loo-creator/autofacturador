import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as svc from '@/services/negocio.service'

export const useClientesStore = defineStore('clientes', () => {
  const items = ref([])
  const usuarios = ref([])
  const loading = ref(false)
  async function fetch(negocioId) { loading.value = true; const r = await svc.listClientes(negocioId); loading.value = false; if (r.ok) items.value = r.data; return r }
  async function save(payload) { const r = await svc.saveCliente(payload); if (r.ok) await fetch(payload.negocioId); return r }
  async function fetchUsuarios() { const r = await svc.listUsuarios(); if (r.ok) usuarios.value = r.data; return r }
  async function update(payload) { const r = await svc.saveCliente(payload); if (r.ok) await fetchUsuarios(); return r }
  async function toggleActivo(id) { const r = await svc.toggleUsuarioActivo(id); if (r.ok) await fetchUsuarios(); return r }
  return { items, usuarios, loading, fetch, save, fetchUsuarios, update, toggleActivo }
})
