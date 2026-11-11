import { ensureDb } from '@/mocks/dbSeed'
import { delay, saveDB, response } from '@/mocks/api.mock'
import { uid, normalizarEmail } from '@/utils/formatters'

/**
 * @future POST /api/v1/auth/login
 */
export async function login(email, password) {
  await delay()
  const database = ensureDb()
  const correo = normalizarEmail(email)
  const all = [...(database.usuarios || []), ...(database.clientes || [])]

  const user = all.find(u => normalizarEmail(u.email) === correo && u.password === password)
  if (!user) {
    const existe = all.some(u => normalizarEmail(u.email) === correo)
    return response(false, null, existe
      ? 'La contraseña no coincide con este usuario.'
      : 'No encontramos una cuenta con ese correo.')
  }

  const safe = { ...user }
  delete safe.password
  const session = { token: uid('tok'), userId: user.id, rol: user.rol, at: new Date().toISOString() }
  database.sesiones.push(session)
  saveDB(database)
  return response(true, { token: session.token, user: safe })
}

/**
 * @future POST /api/v1/auth/logout
 */
export async function logout(token) {
  await delay(150)
  const database = ensureDb()
  database.sesiones = (database.sesiones || []).filter(s => s.token !== token)
  saveDB(database)
  return response(true, { ok: true })
}

/**
 * @future POST /api/v1/auth/register
 */
export async function register(payload) {
  await delay()
  const database = ensureDb()
  const correo = normalizarEmail(payload.email)
  const exists = [...(database.usuarios || []), ...(database.clientes || [])]
    .some(u => normalizarEmail(u.email) === correo)
  if (exists) return response(false, null, 'El correo ya está registrado')
  const user = { id: uid('cli'), rol: 'cliente', ...payload }
  database.clientes.push(user)
  saveDB(database)
  const safe = { ...user }; delete safe.password
  return response(true, { user: safe })
}

/**
 * @future GET /api/v1/auth/me
 */
export async function me(token) {
  await delay(120)
  const database = ensureDb()
  const session = (database.sesiones || []).find(s => s.token === token)
  if (!session) return response(false, null, 'Sesión inválida')
  const all = [...(database.usuarios || []), ...(database.clientes || [])]
  const user = all.find(u => u.id === session.userId)
  if (!user) return response(false, null, 'Usuario no encontrado')
  const safe = { ...user }; delete safe.password
  return response(true, { user: safe })
}

/**
 * Cambia el correo electrónico del usuario (requiere confirmar la contraseña actual).
 * @future POST /api/v1/auth/cambiar-email
 */
export async function cambiarEmail(userId, { emailActual, emailNuevo, password }) {
  await delay()
  const database = ensureDb()
  const all = [...(database.usuarios || []), ...(database.clientes || [])]
  const user = all.find(u => u.id === userId)

  if (!user) return response(false, null, 'No encontramos tu usuario.')

  if (normalizarEmail(user.email) !== normalizarEmail(emailActual)) {
    return response(false, null, 'El correo actual no coincide.')
  }

  if (!password || user.password !== password) {
    return response(false, null, 'La contraseña no es correcta.')
  }

  const nuevo = String(emailNuevo || '').trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nuevo)) {
    return response(false, null, 'El correo nuevo no tiene un formato válido.')
  }

  const duplicado = all.some(u => u.id !== userId && normalizarEmail(u.email) === normalizarEmail(nuevo))
  if (duplicado) return response(false, null, 'Ese correo ya está registrado con otra cuenta.')

  const anterior = user.email
  user.email = nuevo
  saveDB(database)

  const safe = { ...user }
  delete safe.password
  return response(true, { user: safe, emailAnterior: anterior })
}

/**
 * Cambia la contraseña del usuario.
 * @future POST /api/v1/auth/cambiar-password
 */
export async function cambiarPassword(userId, { passwordActual, passwordNueva }) {
  await delay()
  const database = ensureDb()
  const all = [...(database.usuarios || []), ...(database.clientes || [])]
  const user = all.find(u => u.id === userId)

  if (!user) return response(false, null, 'No encontramos tu usuario.')

  if (!passwordActual || user.password !== passwordActual) {
    return response(false, null, 'La contraseña actual no es correcta.')
  }

  if (!passwordNueva || passwordNueva.length < 6) {
    return response(false, null, 'La nueva contraseña debe tener al menos 6 caracteres.')
  }

  if (passwordNueva === passwordActual) {
    return response(false, null, 'La nueva contraseña debe ser distinta de la actual.')
  }

  user.password = passwordNueva
  saveDB(database)
  return response(true, { id: user.id, actualizado: true })
}

/**
 * Repara la base local (usuarios demo ausentes, colecciones vacías).
 * Útil cuando el navegador conserva una DB creada con una versión anterior del mock.
 * @future POST /api/v1/admin/reparar-demo
 */
export async function repararDemo() {
  await delay(200)
  const database = ensureDb()
  return response(true, {
    usuarios: (database.usuarios || []).length,
    clientes: (database.clientes || []).length,
    tickets: (database.tickets || []).length,
  })
}
