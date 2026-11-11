<script setup>
/**
 * Login. El formulario vive en la mitad derecha; el fondo animado global
 * (AuthBackdrop, montado en App.vue) queda a la izquierda y no se desmonta
 * al navegar a /registro → la transición entre ambas es continua.
 */
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { repararDemo } from '@/services/auth.service'
import BrandMark from '@/components/ui/BrandMark.vue'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const toast = useToast()

const mounted = ref(false)
const loading = ref(false)
const showPass = ref(false)
const selectedRole = ref('cliente')
const reparando = ref(false)

const form = ref({ email: '', password: '' })

const roles = [
  {
    key: 'admin', label: 'Admin', desc: 'Control total',
    email: 'admin@autofacturacion.mx', password: 'admin123',
    color: '#FB923C', ink: '#9A3412',
    glow: 'rgba(251,146,60,0.40)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v5c0 4.5-3 7.5-7 10-4-2.5-7-5.5-7-10V6l7-3z"/><path d="M9 12l2 2 4-4"/></svg>`,
  },
  {
    key: 'negocio', label: 'Negocio', desc: 'Emite y gestiona',
    email: 'negocio@demo.mx', password: 'negocio123',
    color: '#C084FC', ink: '#7E22CE',
    glow: 'rgba(192,132,252,0.40)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-5 9 5v9a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M9 22V12h6v10"/></svg>`,
  },
  {
    key: 'cliente', label: 'Cliente', desc: 'Consulta y solicita',
    email: 'cliente@demo.mx', password: 'cliente123',
    color: '#A855F7', ink: '#6B21A8',
    glow: 'rgba(168,85,247,0.40)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20a8 8 0 0116 0"/></svg>`,
  },
]

const rolActual = computed(() => roles.find(r => r.key === selectedRole.value) || roles[2])

function redirectByRole(role) {
  if (role === 'admin') return '/admin'
  if (role === 'negocio') return '/negocio'
  return '/cliente'
}

function selectRole(role) {
  selectedRole.value = role.key
  form.value.email = role.email
  form.value.password = role.password
}

async function submit() {
  if (!form.value.email || !form.value.password) {
    return toast.error({ title: 'Datos incompletos', message: 'Ingresa tu correo y contraseña.' })
  }
  loading.value = true
  const res = await auth.login(form.value.email, form.value.password)
  loading.value = false
  if (!res.ok) {
    toast.error({ title: 'Acceso denegado', message: res.error || 'Credenciales inválidas.' })
    return
  }
  toast.success({ title: 'Bienvenido', message: 'Has iniciado sesión correctamente.' })
  router.push(route.query.redirect || redirectByRole(res.data.user.rol))
}

/** Acceso directo: un solo clic entra con el rol elegido. */
async function quickLogin(role) {
  if (loading.value) return
  selectRole(role)
  await submit()
}

async function reparar() {
  if (reparando.value) return
  reparando.value = true
  const res = await repararDemo()
  reparando.value = false
  if (!res.ok) return toast.error({ title: 'No se pudo reparar', message: res.error })
  toast.success({
    title: 'Datos de demostración reparados',
    message: `${res.data.usuarios} usuarios · ${res.data.clientes} clientes · ${res.data.tickets} tickets listos.`,
  })
}

onMounted(() => {
  requestAnimationFrame(() => { mounted.value = true })
  const def = roles.find(r => r.key === selectedRole.value)
  if (def) { form.value.email = def.email; form.value.password = def.password }
})
</script>

<template>
  <div class="login-page">
    <!-- El fondo animado vive en App.vue (izquierda) -->
    <section class="auth-panel">
      <div class="form-card" :class="{ show: mounted }">
        <header class="brand">
          <BrandMark :size="54" />
          <div>
            <p class="brand-name">Autofacturación</p>
            <p class="brand-sub">Portal CFDI 4.0</p>
          </div>
        </header>

        <div class="quick-access">
          <span class="quick-access__label">Entrar con un clic</span>
          <div class="quick-access__row">
            <button
              v-for="role in roles"
              :key="role.key"
              type="button"
              class="quick-btn"
              :class="{ 'is-active': selectedRole === role.key }"
              :style="{ '--role-color': role.color, '--role-ink': role.ink }"
              :title="`Entrar como ${role.label} (${role.email})`"
              :disabled="loading"
              @click="quickLogin(role)"
            >
              <span class="quick-btn__dot" aria-hidden="true"></span>
              {{ role.label }}
            </button>
          </div>
        </div>

        <form class="form" @submit.prevent="submit" novalidate>
          <div class="field float">
            <input id="email" v-model="form.email" class="underline-input" type="email" placeholder=" " autocomplete="email" />
            <label for="email">Correo electrónico</label>
            <span class="line" aria-hidden="true"></span>
          </div>

          <div class="field float">
            <input id="password" v-model="form.password" class="underline-input" :type="showPass ? 'text' : 'password'" placeholder=" " autocomplete="current-password" />
            <label for="password">Contraseña</label>
            <button type="button" class="eye" :aria-label="showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'" @click="showPass = !showPass">
              <svg v-if="!showPass" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" /><circle cx="12" cy="12" r="3" /></svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 3l18 18" /><path d="M10.6 10.6a3 3 0 004.2 4.2" /><path d="M9.9 5.1A10.9 10.9 0 0112 5c7 0 11 7 11 7a20 20 0 01-4.4 4.9" /></svg>
            </button>
            <span class="line" aria-hidden="true"></span>
          </div>

          <div class="form-row">
            <label class="remember"><input type="checkbox" /> <span>Recordarme</span></label>
            <a href="#" class="link" @click.prevent>¿Olvidaste tu contraseña?</a>
          </div>

          <button
            type="submit"
            class="submit"
            :disabled="loading"
            style="--btn-color: var(--accent-coral)"
          >
            <span v-if="!loading">Iniciar sesión</span>
            <span v-else class="btn-loading">Ingresando…</span>
            <svg v-if="!loading" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </button>
        </form>

        <div class="extras">
          <router-link to="/facturar-express" class="ghost-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 2L3 14h7l-1 8 10-12h-7z" /></svg>
            Facturar sin registrarse
          </router-link>
          <span class="sep">·</span>
          <router-link to="/registro" class="ghost-link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M19 8v6M22 11h-6" /></svg>
            Crear cuenta
          </router-link>
        </div>

        <footer class="legal">
          <router-link to="/login" class="legal__link">Términos y Condiciones</router-link>
          <span class="legal__dot" aria-hidden="true">·</span>
          <router-link to="/login" class="legal__link">Aviso de Privacidad</router-link>
          <span class="legal__dot" aria-hidden="true">·</span>
          <button type="button" class="legal__link legal__link--btn" :disabled="reparando" @click="reparar">
            {{ reparando ? 'Reparando…' : 'Reparar datos demo' }}
          </button>
        </footer>
      </div>
    </section>
  </div>
</template>

<style scoped>
.login-page {
  position: relative;
  min-height: 100vh;
  min-height: 100dvh;
  display: grid;
  grid-template-columns: 1fr;
  font-family: 'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif;
  background: transparent;
}

/* ── Panel del formulario (derecha) ───────────────────────────────────── */
.auth-panel {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 28px 24px;
  min-width: 0;
}

.form-card {
  width: 100%;
  max-width: 560px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  background: var(--glass-panel-strong);
  /* Sin backdrop-filter: difuminar las figuras detrás del panel es justo lo que
     el ojo lee como "bruma". El panel se mantiene limpio y opaco. */
  border: 1px solid var(--glass-line);
  border-radius: 26px;
  padding: 34px 38px;
  box-shadow: 0 24px 60px rgba(17, 24, 39, .10), 0 6px 18px rgba(17, 24, 39, .05);
  opacity: 0;
  transform: translateY(26px) scale(.98);
  transition: opacity .55s cubic-bezier(.16, 1, .3, 1), transform .55s cubic-bezier(.16, 1, .3, 1);
}
.form-card.show { opacity: 1; transform: translateY(0) scale(1); }

/* ── Marca ────────────────────────────────────────────────────────────── */
.brand { display: flex; align-items: center; gap: 15px; }
.brand-name { font-size: 19px; font-weight: 800; color: var(--text); letter-spacing: -.01em; }
.brand-sub { font-size: 13px; color: var(--muted); }

/* ── Acceso rápido (selector de rol) ─────────────────────────────────── */
.quick-access__label {
  display: block; margin-bottom: 8px;
  font-size: 11px; font-weight: 700; color: var(--muted);
  text-transform: uppercase; letter-spacing: .06em;
}
.quick-access__row { display: flex; flex-wrap: wrap; gap: 8px; }
.quick-btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 9px 16px; border-radius: 999px; cursor: pointer;
  border: 1px solid var(--control-border);
  background: var(--control-bg);
  color: var(--text-soft); font-size: 13.5px; font-weight: 600; font-family: inherit;
  transition: all .2s ease; white-space: nowrap;
}
.quick-btn:hover:not(:disabled) {
  border-color: var(--role-color, var(--brand-primary));
  color: var(--role-ink, var(--brand-ink));
  background: var(--brand-primary-soft);
}
.quick-btn.is-active {
  border-color: var(--role-color, var(--brand-primary));
  color: var(--role-ink, var(--brand-ink));
  background: var(--brand-primary-soft);
}
.quick-btn:focus-visible { outline: 2px solid var(--role-color, var(--brand-primary)); outline-offset: 2px; }
.quick-btn:disabled { opacity: .55; cursor: not-allowed; }
.quick-btn__dot {
  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
  background: var(--role-color, var(--brand-primary));
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--role-color, #FB923C) 18%, transparent);
}

/* ── Campos ───────────────────────────────────────────────────────────── */
.form { display: flex; flex-direction: column; gap: 22px; }
.field { position: relative; }
.float { padding-top: 10px; }
.underline-input {
  width: 100%; border: none; border-bottom: 1.5px solid var(--border-strong);
  background: transparent; padding: 11px 40px 11px 0;
  font-size: 16px; color: var(--text); outline: none;
  transition: border-color .25s ease;
}
.float label {
  position: absolute; left: 0; top: 18px; font-size: 15px; color: var(--muted);
  pointer-events: none; transition: all .2s ease;
}
.underline-input:focus ~ label,
.underline-input:not(:placeholder-shown) ~ label {
  top: -2px; font-size: 13px; color: var(--brand-primary); font-weight: 600;
}
.line {
  position: absolute; left: 0; bottom: 0; height: 2.5px; width: 100%;
  background: var(--accent-coral); border-radius: 2px;
  transform: scaleX(0); transform-origin: left;
  transition: transform .3s cubic-bezier(.16, 1, .3, 1);
}
.underline-input:focus ~ .line { transform: scaleX(1); }
.eye {
  position: absolute; right: 0; top: 13px; border: none; background: transparent; color: var(--muted-2);
  cursor: pointer; padding: 4px; border-radius: 8px; display: inline-flex;
}
.eye:hover { color: var(--text); background: var(--bg-subtle); }
.eye svg { width: 19px; height: 19px; }

.form-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; font-size: 14px; }
.remember { display: inline-flex; align-items: center; gap: 8px; color: var(--text-soft); cursor: pointer; }
.remember input { accent-color: var(--brand-primary); width: 16px; height: 16px; }
.link { color: var(--brand-primary); text-decoration: none; font-weight: 600; }
.link:hover { text-decoration: underline; }

/* ── Botón principal: el más destacado ────────────────────────────────── */
.submit {
  display: inline-flex; align-items: center; justify-content: center; gap: 10px;
  width: 100%; min-width: 0;
  height: 56px; padding: 0 22px; border: none; border-radius: 14px;
  /* Color vivo del rol (naranja/coral) con tinta oscura: legible y con carácter */
  background: var(--btn-color, var(--accent-coral));
  color: var(--accent-contrast, #fff);
  font-weight: 700; font-size: 16px; font-family: inherit; cursor: pointer;
  white-space: nowrap; overflow: hidden;
  box-shadow:
    0 12px 26px rgba(251, 146, 60, .40),
    inset 0 0 0 1px rgba(120, 53, 15, .16);
  transition: transform .18s ease, box-shadow .25s ease, filter .2s ease;
}
.submit > span { overflow: hidden; text-overflow: ellipsis; }
.submit svg { width: 18px; height: 18px; flex-shrink: 0; transition: transform .25s ease; }
.submit:hover:not(:disabled) { transform: translateY(-2px); filter: saturate(1.1) brightness(1.04); box-shadow: 0 18px 34px rgba(251, 146, 60, .5), inset 0 0 0 1px rgba(120, 53, 15, .2); }
.submit:hover:not(:disabled) svg { transform: translateX(4px); }
.submit:active:not(:disabled) { transform: translateY(0) scale(.985); }
.submit:disabled { opacity: .7; cursor: not-allowed; }
.btn-loading { display: inline-flex; align-items: center; gap: 10px; }

/* ── Enlaces secundarios ──────────────────────────────────────────────── */
.extras {
  display: flex; align-items: center; justify-content: center; gap: 10px;
  padding-top: 4px; font-size: 13.5px; color: var(--muted);
}
.ghost-link {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 8px 14px; border-radius: 10px;
  border: 1px solid transparent;
  color: var(--text-soft); font-weight: 600; text-decoration: none;
  transition: all .2s ease;
}
.ghost-link svg { width: 15px; height: 15px; color: var(--muted-2); transition: color .2s ease; }
.ghost-link:hover { background: var(--bg-subtle); color: var(--text); border-color: var(--control-border); }
.ghost-link:hover svg { color: var(--brand-primary); }
.sep { color: var(--border-strong); }

/* ── Pie legal ────────────────────────────────────────────────────────── */
.legal {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  flex-wrap: wrap;
  padding-top: 16px; border-top: 1px solid var(--border);
  font-size: 12.5px;
}
.legal__link {
  color: var(--muted); text-decoration: none; font-weight: 500;
  transition: color .2s ease;
}
.legal__link:hover { color: var(--brand-primary); text-decoration: underline; }
.legal__link--btn { border: none; background: transparent; cursor: pointer; font-family: inherit; font-size: 12.5px; padding: 0; }
.legal__link--btn:disabled { opacity: .55; cursor: not-allowed; }
.legal__dot { color: var(--border-strong); }

/* ── Desktop: el formulario a la derecha, a todo el alto ─────────────── */
@media (min-width: 900px) {
  .login-page { grid-template-columns: 1fr 1fr; }
  /* La columna 1 la ocupa el fondo animado (fixed); el form va en la columna 2 */
  .auth-panel { grid-column: 2;
    height: 100vh; height: 100dvh;
    min-height: 100vh; min-height: 100dvh;
    align-items: stretch;
    padding: 24px 40px 24px 8px;
  }
  .form-card {
    height: 100%; max-height: 100%; overflow-y: auto;
    max-width: 620px; justify-content: center;
    padding: 40px 44px;
  }
}

@media (max-width: 899px) {
  .login-page { padding-top: 8vh; }
  .auth-panel { align-items: flex-start; }
}

@media (max-width: 560px) {
  .form-card { padding: 26px 20px; border-radius: 20px; }
  .form-row { flex-direction: column; align-items: flex-start; }
}
</style>
