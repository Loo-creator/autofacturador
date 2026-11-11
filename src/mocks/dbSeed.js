// Semilla única de la base mock. Antes cada service definía la suya (y se pisaban
// entre sí: una carga `clientes: []` borraba el catálogo de clientes). Ahora todos consumen
// `crearSeed()`, por lo que la colección persiste y es consistente entre servicios.
//
// Además `migrarDb()` repara las bases old que quedaron en el localStorage del navegador:
// si la DB se creó con la seed antigua de `factura.service` (`usuarios: []`), los roles
// admin y negocio dejan de poder ingresar. La migración repone lo que falte SIN tocar
// los datos que el usuario sí tenga (facturas, auditoría, sesiones).

import { negociosSeed } from './negocios.mock'
import { clientesSeed } from './clientes.mock'
import { productosSeed } from './productos.mock'
import { facturasSeed, facturasGlobalesExtra } from './facturas.mock'
import { ticketsSeed } from './tickets.mock'
import { loadDB, saveDB } from './api.mock'
import { normalizarEmail } from '@/utils/formatters'

export const usuariosSeed = [
  { id: 'adm-1', nombre: 'Administrador Autofacturación', email: 'admin@autofacturacion.mx', password: 'admin123', rol: 'admin', activo: true },
  { id: 'neg-usr-1', nombre: 'Operador Negocio 1', email: 'negocio@demo.mx', password: 'negocio123', rol: 'negocio', negocioId: 'neg-1', activo: true },
]

export function crearSeed() {
  return {
    negocios: negociosSeed,
    clientes: clientesSeed,
    productos: productosSeed,
    facturas: [...facturasSeed, ...facturasGlobalesExtra],
    tickets: ticketsSeed,
    usuarios: usuariosSeed,
    auditoria: [],
    sesiones: [],
  }
}

function asegurarArreglo(db, key, valorPorDefecto) {
  if (!Array.isArray(db[key])) {
    db[key] = valorPorDefecto
    return true
  }
  return false
}

/**
 * Repara una DB persistida. Devuelve la DB migrada (y la guarda si cambió).
 * @param {object} db
 * @returns {object}
 */
export function migrarDb(db) {
  let changed = false

  // Colecciones que siempre deben existir
  changed = asegurarArreglo(db, 'negocios', negociosSeed) || changed
  changed = asegurarArreglo(db, 'productos', productosSeed) || changed
  changed = asegurarArreglo(db, 'facturas', [...facturasSeed, ...facturasGlobalesExtra]) || changed
  changed = asegurarArreglo(db, 'auditoria', []) || changed
  changed = asegurarArreglo(db, 'sesiones', []) || changed

  // Las facturas globales del seed deben existir aunque la DB sea vieja.
  for (const g of facturasGlobalesExtra) {
    if (!db.facturas.some(f => f.id === g.id)) {
      db.facturas.push({ ...g })
      changed = true
    }
  }

  // Tickets: si la DB no los tiene (o quedó vacía) se repone el catálogo.
  if (!Array.isArray(db.tickets) || !db.tickets.length) {
    db.tickets = ticketsSeed
    changed = true
  }

  // Clientes: sólo se repone si la colección quedó vacía (p. ej. la seed vieja).
  if (!Array.isArray(db.clientes)) {
    db.clientes = clientesSeed
    changed = true
  } else if (!db.clientes.length) {
    db.clientes = clientesSeed
    changed = true
  }

  // Usuarios: los usuarios demo SIEMPRE deben existir (admin y negocio no pueden perderse).
  if (!Array.isArray(db.usuarios)) {
    db.usuarios = []
    changed = true
  }
  for (const u of usuariosSeed) {
    const yaExiste = db.usuarios.some(x => normalizarEmail(x.email) === normalizarEmail(u.email))
    if (!yaExiste) {
      db.usuarios.push({ ...u })
      changed = true
    }
  }

  if (changed) saveDB(db)
  return db
}

/** Devuelve la base mock migrada y consistente. Punto de entrada único de los services. */
export function ensureDb() {
  return migrarDb(loadDB(crearSeed))
}
