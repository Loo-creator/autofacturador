import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as authService from '@/services/auth.service'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('ff_token') || '')
  const user = ref(JSON.parse(localStorage.getItem('ff_user') || 'null'))
  const loading = ref(false)

  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const role = computed(() => user.value?.rol || null)
  const esAdmin = computed(() => role.value === 'admin')

  /**
   * RFC propio del cliente. El admin devuelve `null` para que las vistas de cliente
   * le muestren TODOS los comprobantes (y no los filtren por un RFC inexistente).
   */
  const rfcPropio = computed(() => (esAdmin.value ? null : user.value?.rfc || null))

  function persist() {
    if (token.value) localStorage.setItem('ff_token', token.value)
    else localStorage.removeItem('ff_token')
    if (user.value) localStorage.setItem('ff_user', JSON.stringify(user.value))
    else localStorage.removeItem('ff_user')
  }

  async function login(email, password) {
    loading.value = true
    const res = await authService.login(email, password)
    loading.value = false
    if (!res.ok) return res
    token.value = res.data.token
    user.value = res.data.user
    persist()
    return res
  }

  async function register(payload) {
    loading.value = true
    const res = await authService.register(payload)
    loading.value = false
    return res
  }

  async function logout() {
    if (token.value) await authService.logout(token.value)
    token.value = ''
    user.value = null
    persist()
  }

  /** Actualiza el usuario en sesión (tras cambiar correo, datos fiscales, etc.). */
  function setUser(next) {
    if (!next) return
    user.value = { ...user.value, ...next }
    persist()
  }

  /** Cambia el correo electrónico de la cuenta. */
  async function cambiarEmail(payload) {
    const r = await authService.cambiarEmail(user.value?.id, payload)
    if (r.ok) setUser(r.data.user)
    return r
  }

  /** Cambia la contraseña de la cuenta. */
  async function cambiarPassword(payload) {
    return authService.cambiarPassword(user.value?.id, payload)
  }

  async function restore() {
    if (!token.value) return
    const res = await authService.me(token.value)
    if (res.ok) { user.value = res.data.user; persist() }
    else { token.value = ''; user.value = null; persist() }
  }

  return {
    token, user, loading, isAuthenticated, role, esAdmin, rfcPropio,
    login, register, logout, restore, setUser, cambiarEmail, cambiarPassword,
  }
})
