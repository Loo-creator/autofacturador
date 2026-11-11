<script setup>
/**
 * Panel de seguridad de la cuenta: cambiar correo electrónico y cambiar contraseña.
 * Ambos flujos exigen la contraseña actual para confirmar la identidad.
 */
import { ref, reactive, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'

const props = defineProps({
  user: { type: Object, default: () => ({}) },
  compacto: { type: Boolean, default: false },
  // 'todo' | 'correo' | 'contrasena' → permite usar cada acción en su propia pestaña
  solo: { type: String, default: 'todo' }
})
const emit = defineEmits(['updated'])

const auth = useAuthStore()
const toast = useToast()

/* ── Correo ─────────────────────────────────────────────────────────────── */
const correo = reactive({ actual: '', nuevo: '', confirmar: '', password: '' })
const showMailPass = ref(false)
const guardandoCorreo = ref(false)

const correoErrors = computed(() => {
  const e = []
  if (!correo.nuevo.trim()) e.push('Captura el correo nuevo.')
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.nuevo.trim())) e.push('El correo nuevo no tiene un formato válido.')
  else if (correo.nuevo.trim().toLowerCase() === (props.user?.email || '').toLowerCase()) e.push('El correo nuevo es igual al actual.')
  if (correo.nuevo.trim() !== correo.confirmar.trim()) e.push('Los correos no coinciden.')
  if (!correo.password) e.push('Confirma tu contraseña actual.')
  return e
})

/* ── Contraseña ─────────────────────────────────────────────────────────── */
const pass = reactive({ actual: '', nueva: '', confirmar: '' })
const showPass = ref(false)
const showNueva = ref(false)
const guardandoPass = ref(false)

const passErrors = computed(() => {
  const e = []
  if (!pass.actual) e.push('Captura tu contraseña actual.')
  if (!pass.nueva) e.push('Captura la nueva contraseña.')
  else if (pass.nueva.length < 6) e.push('La nueva contraseña debe tener al menos 6 caracteres.')
  else if (!/[A-Za-z]/.test(pass.nueva) || !/\d/.test(pass.nueva)) e.push('Combina letras y números.')
  if (pass.nueva && pass.nueva !== pass.confirmar) e.push('Las contraseñas no coinciden.')
  return e
})

const fuerza = computed(() => {
  const v = pass.nueva || ''
  let puntos = 0
  if (v.length >= 8) puntos++
  if (v.length >= 12) puntos++
  if (/[A-Z]/.test(v) && /[a-z]/.test(v)) puntos++
  if (/\d/.test(v)) puntos++
  if (/[^\w\s]/.test(v)) puntos++
  return Math.min(4, puntos)
})
const fuerzaTexto = computed(() => ['Muy débil', 'Débil', 'Media', 'Buena', 'Fuerte'][fuerza.value])
const fuerzaTone = computed(() => ['badge-danger', 'badge-danger', 'badge-warning', 'badge-info', 'badge-success'][fuerza.value])

async function guardarCorreo() {
  if (correoErrors.value.length) return toast.error(correoErrors.value[0])
  guardandoCorreo.value = true
  const r = await auth.cambiarEmail({
    emailActual: correo.actual || props.user?.email,
    emailNuevo: correo.nuevo,
    password: correo.password,
  })
  guardandoCorreo.value = false
  if (!r.ok) return toast.error({ title: 'No se pudo cambiar el correo', message: r.error })
  correo.actual = correo.nuevo
  correo.nuevo = ''; correo.confirmar = ''; correo.password = ''
  toast.success({ title: 'Correo actualizado', message: `Ahora inicias sesión con ${r.data.user.email}` })
  emit('updated', r.data.user)
}

async function guardarPassword() {
  if (passErrors.value.length) return toast.error(passErrors.value[0])
  guardandoPass.value = true
  const r = await auth.cambiarPassword({ passwordActual: pass.actual, passwordNueva: pass.nueva })
  guardandoPass.value = false
  if (!r.ok) return toast.error({ title: 'No se pudo cambiar la contraseña', message: r.error })
  pass.actual = ''; pass.nueva = ''; pass.confirmar = ''
  toast.success({ title: 'Contraseña actualizada', message: 'Usarás la nueva contraseña en tu próximo ingreso.' })
  emit('updated')
}
</script>

<template>
  <div class="sec" :class="{ 'sec--compacto': compacto }">
    <!-- ── Correo ──────────────────────────────────────────────────────── -->
    <section v-if="props.solo === 'todo' || props.solo === 'correo'" class="sec__card">
      <header class="sec__head">
        <span class="sec__icon sec__icon--mail" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>
        </span>
        <div>
          <h3>Correo electrónico</h3>
          <p class="sec__sub">Es el correo con el que inicias sesión y donde recibes tus CFDI.</p>
        </div>
      </header>

      <div class="sec__body">
        <div class="field">
          <label>Correo actual</label>
          <input class="input" :value="user?.email || ''" disabled />
        </div>

        <div class="form-grid">
          <div class="field">
            <label for="sec-mail-nuevo">Correo nuevo</label>
            <input id="sec-mail-nuevo" v-model="correo.nuevo" class="input" type="email" placeholder="nuevo@correo.mx" autocomplete="email" />
          </div>
          <div class="field">
            <label for="sec-mail-confirmar">Confirmar correo nuevo</label>
            <input id="sec-mail-confirmar" v-model="correo.confirmar" class="input" type="email" placeholder="nuevo@correo.mx" autocomplete="email" />
          </div>
        </div>

        <div class="field">
          <label for="sec-mail-pass">Confirma tu contraseña actual</label>
          <div class="sec__pass">
            <input id="sec-mail-pass" v-model="correo.password" class="input" :type="showMailPass ? 'text' : 'password'" autocomplete="current-password" placeholder="••••••••" />
            <button type="button" class="sec__eye" :aria-label="showMailPass ? 'Ocultar' : 'Mostrar'" @click="showMailPass = !showMailPass">
              <svg v-if="!showMailPass" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" /><circle cx="12" cy="12" r="3" /></svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 3l18 18" /><path d="M10.6 10.6a3 3 0 004.2 4.2" /><path d="M9.9 5.1A10.9 10.9 0 0112 5c7 0 11 7 11 7a20 20 0 01-4.4 4.9" /></svg>
            </button>
          </div>
        </div>

        <ul v-if="correoErrors.length" class="sec__errors">
          <li v-for="(e, i) in correoErrors" :key="i">{{ e }}</li>
        </ul>

        <div class="sec__foot">
          <button type="button" class="btn btn-primary" :disabled="correoErrors.length > 0 || guardandoCorreo" @click="guardarCorreo">
            {{ guardandoCorreo ? 'Guardando…' : 'Cambiar correo' }}
          </button>
        </div>
      </div>
    </section>

    <!-- ── Contraseña ──────────────────────────────────────────────────── -->
    <section v-if="props.solo === 'todo' || props.solo === 'contrasena'" class="sec__card">
      <header class="sec__head">
        <span class="sec__icon sec__icon--key" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="15" r="4" /><path d="M10.8 12.2L20 3M17 6l3 3-2 2-3-3" /></svg>
        </span>
        <div>
          <h3>Contraseña</h3>
          <p class="sec__sub">Mínimo 6 caracteres, combinando letras y números.</p>
        </div>
      </header>

      <div class="sec__body">
        <div class="field">
          <label for="sec-pass-actual">Contraseña actual</label>
          <div class="sec__pass">
            <input id="sec-pass-actual" v-model="pass.actual" class="input" :type="showPass ? 'text' : 'password'" autocomplete="current-password" placeholder="••••••••" />
            <button type="button" class="sec__eye" :aria-label="showPass ? 'Ocultar' : 'Mostrar'" @click="showPass = !showPass">
              <svg v-if="!showPass" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" /><circle cx="12" cy="12" r="3" /></svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 3l18 18" /><path d="M10.6 10.6a3 3 0 004.2 4.2" /><path d="M9.9 5.1A10.9 10.9 0 0112 5c7 0 11 7 11 7a20 20 0 01-4.4 4.9" /></svg>
            </button>
          </div>
        </div>

        <div class="form-grid">
          <div class="field">
            <label for="sec-pass-nueva">Nueva contraseña</label>
            <div class="sec__pass">
              <input id="sec-pass-nueva" v-model="pass.nueva" class="input" :type="showNueva ? 'text' : 'password'" autocomplete="new-password" placeholder="Mínimo 6 caracteres" />
              <button type="button" class="sec__eye" :aria-label="showNueva ? 'Ocultar' : 'Mostrar'" @click="showNueva = !showNueva">
                <svg v-if="!showNueva" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" /><circle cx="12" cy="12" r="3" /></svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 3l18 18" /><path d="M10.6 10.6a3 3 0 004.2 4.2" /><path d="M9.9 5.1A10.9 10.9 0 0112 5c7 0 11 7 11 7a20 20 0 01-4.4 4.9" /></svg>
              </button>
            </div>
          </div>
          <div class="field">
            <label for="sec-pass-confirmar">Confirmar nueva contraseña</label>
            <input id="sec-pass-confirmar" v-model="pass.confirmar" class="input" type="password" autocomplete="new-password" placeholder="••••••••" />
          </div>
        </div>

        <div v-if="pass.nueva" class="sec__strength">
          <div class="sec__strength-bar"><span :class="`is-${fuerza}`" :style="{ width: (fuerza / 4) * 100 + '%' }"></span></div>
          <span class="badge" :class="fuerzaTone">Fuerza {{ fuerzaTexto }}</span>
        </div>

        <ul v-if="passErrors.length" class="sec__errors">
          <li v-for="(e, i) in passErrors" :key="i">{{ e }}</li>
        </ul>

        <div class="sec__foot">
          <button type="button" class="btn btn-primary" :disabled="passErrors.length > 0 || guardandoPass" @click="guardarPassword">
            {{ guardandoPass ? 'Actualizando…' : 'Actualizar contraseña' }}
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.sec { display: flex; flex-direction: column; gap: 20px; }

.sec__card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  overflow: hidden;
}
.sec__head {
  display: flex; align-items: flex-start; gap: 14px;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
  background: var(--surface-2);
}
.sec__head h3 { margin: 0; font-size: 15px; font-weight: 600; color: var(--text); }
.sec__sub { margin: 3px 0 0; font-size: 13px; color: var(--muted); }

.sec__icon {
  width: 38px; height: 38px; border-radius: 11px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
}
.sec__icon svg { width: 19px; height: 19px; }
.sec__icon--mail { background: var(--brand-primary-soft); color: var(--brand-ink); }
.sec__icon--key { background: var(--badge-warning-bg); color: var(--badge-warning-fg); }

.sec__body { padding: 24px; display: flex; flex-direction: column; gap: 18px; }

.sec__pass { position: relative; display: flex; align-items: center; }
.sec__pass .input { padding-right: 44px; }
.sec__eye {
  position: absolute; right: 6px; width: 32px; height: 32px; border-radius: 8px;
  border: none; background: transparent; color: var(--muted); cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
}
.sec__eye:hover { color: var(--text); background: var(--bg-subtle); }
.sec__eye svg { width: 18px; height: 18px; }

.sec__errors {
  margin: 0; padding: 12px 14px; border-radius: 10px; list-style: none;
  background: var(--danger-soft); border: 1px solid rgba(220,38,38,.18);
}
.sec__errors li { font-size: 13px; color: var(--danger); }
.sec__errors li + li { margin-top: 3px; }

.sec__strength { display: flex; align-items: center; gap: 12px; }
.sec__strength-bar { flex: 1; height: 6px; border-radius: 99px; background: var(--bg-subtle); overflow: hidden; border: 1px solid var(--border); }
.sec__strength-bar span { display: block; height: 100%; transition: width .3s ease; }
.sec__strength-bar .is-0, .sec__strength-bar .is-1 { background: var(--danger); }
.sec__strength-bar .is-2 { background: var(--warning); }
.sec__strength-bar .is-3 { background: var(--info); }
.sec__strength-bar .is-4 { background: var(--success); }

.sec__foot { display: flex; justify-content: flex-end; gap: 8px; }

.sec--compacto .sec__body { padding: 20px; }
</style>
