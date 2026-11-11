import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const toasts = ref([])
  const sidebarCollapsed = ref(localStorage.getItem('ff_sidebar_collapsed') === '1')
  const mobileNavOpen = ref(false)

  function pushToast({ type = 'info', message, timeout = 3500 }) {
    const id = Date.now() + Math.random()
    toasts.value.push({ id, type, message })
    setTimeout(() => removeToast(id), timeout)
  }
  function removeToast(id) { toasts.value = toasts.value.filter(t => t.id !== id) }
  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
    localStorage.setItem('ff_sidebar_collapsed', sidebarCollapsed.value ? '1' : '0')
  }
  function toggleMobileNav() { mobileNavOpen.value = !mobileNavOpen.value }
  function closeMobileNav() { mobileNavOpen.value = false }

  // El drawer móvil nunca sobrevive a un cambio de ruta.
  watch(mobileNavOpen, (open) => {
    if (typeof document === 'undefined') return
    document.body.style.overflow = open ? 'hidden' : ''
  })

  return {
    toasts, sidebarCollapsed, mobileNavOpen,
    pushToast, removeToast,
    toggleSidebar, toggleMobileNav, closeMobileNav,
  }
})
