<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

const auth = useAuthStore()
const ui = useUiStore()
const router = useRouter()

async function doLogout() {
  await auth.logout()
  router.push('/login')
}
</script>

<template>
  <header class="topbar">
    <div class="topbar-left">
      <button class="nav-toggle" type="button" aria-label="Abrir menú" @click="ui.toggleMobileNav()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
      </button>
      <span class="role-pill">{{ auth.role || 'invitado' }}</span>
    </div>
    <div class="topbar-right">
      <div v-if="auth.user" class="user-chip">
        <div class="user-name">{{ auth.user.nombre || auth.user.email }}</div>
        <div class="user-email">{{ auth.user.email }}</div>
      </div>
      <button v-if="auth.isAuthenticated" class="btn btn-secondary btn-sm" @click="doLogout">Salir</button>
      <router-link v-else class="btn btn-primary btn-sm" to="/login">Entrar</router-link>
    </div>
  </header>
</template>

<style scoped>
.topbar {
  height: var(--topbar-h);
  border-bottom: 1px solid var(--border);
  background: var(--grad-panel);
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 var(--sp-5);
  z-index: 10;
  transition: background .35s ease, border-color .35s ease;
}

.topbar-left, .topbar-right { display: flex; align-items: center; gap: var(--sp-3); }
.role-pill { font-size: var(--fs-xs); text-transform: uppercase; letter-spacing: .06em; color: var(--muted); padding: 4px 10px; border: 1px solid var(--border); border-radius: var(--r-pill); }
.user-chip { text-align: right; line-height: 1.2; }
.user-name { font-size: var(--fs-sm); font-weight: 500; }
.user-email { font-size: var(--fs-xs); color: var(--muted); }

.nav-toggle {
  display: none;
  width: 38px; height: 38px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-soft);
  cursor: pointer;
  align-items: center; justify-content: center;
  transition: all .2s ease;
}
.nav-toggle:hover { background: var(--bg-subtle); color: var(--text); }
.nav-toggle svg { width: 20px; height: 20px; }

@media (max-width: 1024px) {
  .nav-toggle { display: inline-flex; }
  .topbar { padding: 0 var(--sp-4); }
}
@media (max-width: 640px) { .user-chip { display: none; } }
</style>
