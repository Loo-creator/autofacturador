import { ref } from 'vue'

const toasts = ref([])
let seed = 0

function removeToast(id) {
  const idx = toasts.value.findIndex(t => t.id === id)
  if (idx !== -1) {
    const t = toasts.value[idx]
    if (t._timer) clearTimeout(t._timer)
    toasts.value.splice(idx, 1)
  }
}

function startTimer(toast) {
  if (!toast.duration || toast.duration <= 0) return
  toast._remaining = toast.duration
  toast._startedAt = Date.now()
  toast._timer = setTimeout(() => removeToast(toast.id), toast._remaining)
}

function pauseToast(id) {
  const toast = toasts.value.find(t => t.id === id)
  if (!toast || !toast._timer) return
  clearTimeout(toast._timer)
  toast._timer = null
  const elapsed = Date.now() - (toast._startedAt || Date.now())
  toast._remaining = Math.max(0, (toast._remaining ?? toast.duration) - elapsed)
  toast._paused = true
}

function resumeToast(id) {
  const toast = toasts.value.find(t => t.id === id)
  if (!toast || toast._timer || !toast._paused) return
  toast._paused = false
  toast._startedAt = Date.now()
  const remaining = toast._remaining ?? toast.duration
  if (remaining <= 0) removeToast(id)
  else toast._timer = setTimeout(() => removeToast(id), remaining)
}

function showToast({ type = 'info', title = '', message = '', duration = 4200 } = {}) {
  const id = ++seed
  const toast = {
    id, type, title, message, duration,
    _timer: null, _remaining: duration, _startedAt: null, _paused: false
  }
  toasts.value.unshift(toast)
  startTimer(toast)
  return id
}

function clearAll() {
  toasts.value.forEach(t => t._timer && clearTimeout(t._timer))
  toasts.value = []
}

function normalize(input, fallbackTitle) {
  if (typeof input === 'string') return { title: fallbackTitle, message: input }
  return { title: input?.title || fallbackTitle, message: input?.message || '', duration: input?.duration }
}

export function useToast() {
  return {
    toasts,
    showToast,
    removeToast,
    pauseToast,
    resumeToast,
    clearAll,
    success: (input, duration) => showToast({ type: 'success', ...normalize(input, 'Éxito'), ...(duration ? { duration } : {}) }),
    error: (input, duration) => showToast({ type: 'error', ...normalize(input, 'Error'), ...(duration ? { duration } : {}) }),
    warning: (input, duration) => showToast({ type: 'warning', ...normalize(input, 'Aviso'), ...(duration ? { duration } : {}) }),
    info: (input, duration) => showToast({ type: 'info', ...normalize(input, 'Información'), ...(duration ? { duration } : {}) })
  }
}
