// Helper de persistencia en localStorage y latencia simulada para mocks

const DB_KEY = 'Autofacturación_db_v1'

export function delay(ms = 300) {
  const jitter = Math.floor(Math.random() * 300)
  return new Promise(resolve => setTimeout(resolve, ms + jitter))
}

export function loadDB(seedFactory) {
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  const seed = seedFactory()
  localStorage.setItem(DB_KEY, JSON.stringify(seed))
  return seed
}

export function saveDB(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db))
}

export function resetDB() {
  localStorage.removeItem(DB_KEY)
}

/**
 * Contrato único de toda la capa de datos: { ok, data, error }.
 * `extra` permite añadir metadatos (código de error de negocio, contexto) sin romper
 * a los consumidores existentes.
 */
export function response(ok, data = null, error = null, extra = {}) {
  return { ok, data, error, ...extra }
}
