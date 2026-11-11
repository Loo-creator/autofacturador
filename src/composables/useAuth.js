import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
export function useAuth() {
  const auth = useAuthStore()
  return {
    user: computed(() => auth.user),
    role: computed(() => auth.role),
    isAuthenticated: computed(() => auth.isAuthenticated),
    login: auth.login,
    logout: auth.logout,
    register: auth.register
  }
}
