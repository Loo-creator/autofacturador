import { ensureDb } from '@/mocks/dbSeed'
import { delay, saveDB, response } from '@/mocks/api.mock'
import { uid } from '@/utils/formatters'

function ensure() {
  return ensureDb()
}

/** @future GET /api/v1/negocios */
export async function listNegocios() { await delay(); return response(true, ensure().negocios) }
/** @future POST /api/v1/negocios */
export async function createNegocio(payload) { await delay(); const db = ensure(); const n = { id: uid('neg'), activo: true, folio: 1001, branding: { logo: 'N' }, ...payload }; db.negocios.push(n); saveDB(db); return response(true, n) }
/** @future PUT /api/v1/negocios/:id */
export async function updateNegocio(id, payload) { await delay(); const db = ensure(); const i = db.negocios.findIndex(x => x.id === id); if (i < 0) return response(false, null, 'No encontrado'); db.negocios[i] = { ...db.negocios[i], ...payload }; saveDB(db); return response(true, db.negocios[i]) }
/** @future DELETE /api/v1/negocios/:id */
export async function deleteNegocio(id) { await delay(); const db = ensure(); db.negocios = db.negocios.filter(x => x.id !== id); saveDB(db); return response(true, { id }) }

/** @future GET /api/v1/negocios/:id/productos */
export async function listProductos(negocioId) { await delay(); const db = ensure(); const items = negocioId ? db.productos.filter(p => p.negocioId === negocioId) : db.productos; return response(true, items) }
/** @future POST /api/v1/productos */
export async function saveProducto(payload) { await delay(); const db = ensure(); if (payload.id) { const i = db.productos.findIndex(p => p.id === payload.id); if (i >= 0) db.productos[i] = { ...db.productos[i], ...payload }; } else { db.productos.push({ id: uid('p'), activo: true, ...payload }); } saveDB(db); return response(true, payload) }
/** @future DELETE /api/v1/productos/:id */
export async function deleteProducto(id) { await delay(); const db = ensure(); db.productos = db.productos.filter(p => p.id !== id); saveDB(db); return response(true, { id }) }

/** @future GET /api/v1/negocios/:id/clientes */
export async function listClientes(negocioId) { await delay(); const db = ensure(); const items = negocioId ? db.clientes.filter(c => c.negocioId === negocioId) : db.clientes; return response(true, items) }
/** @future POST /api/v1/clientes */
export async function saveCliente(payload) {
  await delay()
  const db = ensure()
  if (payload.id) {
    const i = db.clientes.findIndex(c => c.id === payload.id)
    if (i >= 0) { db.clientes[i] = { ...db.clientes[i], ...payload }; saveDB(db); return response(true, db.clientes[i]) }
    // También puede ser un usuario admin o de negocio
    const j = db.usuarios.findIndex(u => u.id === payload.id)
    if (j >= 0) { db.usuarios[j] = { ...db.usuarios[j], ...payload }; saveDB(db); return response(true, db.usuarios[j]) }
  }
  const user = { id: uid('cli'), rol: 'cliente', activo: true, ...payload }
  db.clientes.push(user)
  saveDB(db)
  return response(true, user)
}

/** @future PATCH /api/v1/usuarios/:id/estado */
export async function toggleUsuarioActivo(id) {
  await delay()
  const db = ensure()
  const lista = [...db.clientes, ...db.usuarios]
  const user = lista.find(u => u.id === id)
  if (!user) return response(false, null, 'Usuario no encontrado')
  user.activo = user.activo === false
  saveDB(db)
  return response(true, { ...user })
}

/** @future GET /api/v1/usuarios */
export async function listUsuarios() {
  await delay()
  const db = ensure()
  const all = [...db.usuarios, ...db.clientes].map(u => {
    const { password, ...s } = u
    return { activo: true, ...s }
  })
  return response(true, all)
}

/** @future GET /api/v1/auditoria */
export async function listAuditoria() { await delay(); return response(true, ensure().auditoria || []) }
