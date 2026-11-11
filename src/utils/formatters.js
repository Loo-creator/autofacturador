export function formatMoney(n, currency = 'MXN') {
  const num = Number(n || 0)
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(num)
}

/**
 * Normaliza un correo para comparar: sin acentos, sin espacios, en minúsculas.
 * Evita que "admin@Autofacturación.mx" falle si se teclea sin la ñ o con otra ñ.
 */
export function normalizarEmail(v = '') {
  return String(v || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function formatDate(d) {
  if (!d) return '—'
  const date = new Date(d)
  if (Number.isNaN(date.getTime())) return d
  return date.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: '2-digit' })
}

export function formatDateTime(d) {
  if (!d) return '—'
  const date = new Date(d)
  if (Number.isNaN(date.getTime())) return d
  return date.toLocaleString('es-MX', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export function uid(prefix = 'id') {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`
}

export function uuidV4() {
  // UUID v4 mock (formato SAT)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  }).toUpperCase()
}

export function calcTotales(conceptos = []) {
  let subtotal = 0, descuento = 0, impuestosTrasladados = 0, impuestosRetenidos = 0
  for (const c of conceptos) {
    const importe = Number(c.cantidad || 0) * Number(c.valorUnitario || 0)
    const desc = Number(c.descuento || 0)
    subtotal += importe
    descuento += desc
    const base = importe - desc
    const iva = Number(c.iva || 0)
    const ieps = Number(c.ieps || 0)
    const retIva = Number(c.retIva || 0)
    const retIsr = Number(c.retIsr || 0)
    impuestosTrasladados += base * (iva / 100) + base * (ieps / 100)
    impuestosRetenidos += base * (retIva / 100) + base * (retIsr / 100)
  }
  const total = subtotal - descuento + impuestosTrasladados - impuestosRetenidos
  return { subtotal, descuento, impuestosTrasladados, impuestosRetenidos, total }
}

export function escapeXml(str = '') {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

export function downloadBlob(content, filename, type = 'application/octet-stream') {
  const blob = content instanceof Blob ? content : new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
