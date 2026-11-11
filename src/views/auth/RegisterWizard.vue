<script setup>
/**
 * Registro. Comparte el lenguaje visual del login: mismo panel glass, misma marca,
 * mismos campos underline y el mismo fondo animado global (montado en App.vue).
 */
import { ref, reactive, computed, onMounted } from 'vue'
import SelectField from '@/components/ui/SelectField.vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { REGIMENES } from '@/utils/satCatalogs'
import { validarEmail } from '@/utils/rfcValidator'
import { validarReceptor, tipoPersona, regimenesPara } from '@/utils/cfdiValidations'
import BrandMark from '@/components/ui/BrandMark.vue'
import * as negocioSvc from '@/services/negocio.service'

const router = useRouter()
const auth = useAuthStore()
const toast = useToast()
const negocios = ref([])
const mounted = ref(false)
const loading = ref(false)

const step = ref(1)
const form = reactive({
  nombre: '', email: '', password: '', password2: '', telefono: '',
  rfc: '', regimen: '612', cp: '', razonSocial: '', negocioId: '',
})

onMounted(async () => {
  requestAnimationFrame(() => { mounted.value = true })
  const r = await negocioSvc.listNegocios()
  if (r.ok) negocios.value = r.data
})

const tipoRfc = computed(() => tipoPersona(form.rfc))
const regimenesDisponibles = computed(() => {
  const lista = REGIMENES.filter(r => !tipoRfc.value || regimenesPara(tipoRfc.value).includes(r.id))
  return lista.length ? lista : REGIMENES
})

const errorsStep = computed(() => {
  const e = []
  if (step.value === 1) {
    if (!form.nombre.trim()) e.push('El nombre es obligatorio.')
    if (!form.email.trim()) e.push('El correo es obligatorio.')
    else if (!validarEmail(form.email).ok) e.push('El correo no tiene un formato válido.')
    if (form.password.length < 6) e.push('La contraseña debe tener al menos 6 caracteres.')
    if (form.password !== form.password2) e.push('Las contraseñas no coinciden.')
  }
  if (step.value === 2) {
    // Reglas fiscales del SAT: el RFC define el tipo de persona y, con él,
    // el régimen y los usos de CFDI permitidos.
    const v = validarReceptor({
      rfc: form.rfc, nombre: form.razonSocial || form.nombre,
      regimen: form.regimen, usoCfdi: 'G03', cp: form.cp, correo: form.email,
    })
    for (const err of v.errores) e.push(err.mensaje)
  }
  return e
})

const STEPS = [
  { n: 1, label: 'Datos personales' },
  { n: 2, label: 'Datos fiscales' },
  { n: 3, label: 'Negocio y confirmación' },
]

function next() {
  if (errorsStep.value.length) return toast.error(errorsStep.value[0])
  step.value++
}

async function submit() {
  if (errorsStep.value.length) return toast.error(errorsStep.value[0])
  loading.value = true
  const res = await auth.register({
    nombre: form.nombre, email: form.email, password: form.password, telefono: form.telefono,
    rfc: form.rfc.toUpperCase(), regimen: form.regimen, cp: form.cp,
    razonSocial: form.razonSocial || form.nombre,
    negocioId: form.negocioId || negocios.value[0]?.id || '',
  })
  loading.value = false
  if (!res.ok) return toast.error({ title: 'No se pudo crear la cuenta', message: res.error || 'Intenta de nuevo.' })
  toast.success({ title: '¡Cuenta creada!', message: 'Ya puedes iniciar sesión con tu correo.' })
  router.push('/login')
}
</script>

<template>
  <div class="login-page">
    <section class="auth-panel">
      <div class="form-card" :class="{ show: mounted }">
        <header class="brand">
          <BrandMark :size="54" />
          <div>
            <p class="brand-name">Crea tu cuenta</p>
            <p class="brand-sub">Autofacturación · Portal CFDI 4.0</p>
          </div>
        </header>

        <ol class="stepper" aria-label="Progreso del registro">
          <li
            v-for="s in STEPS"
            :key="s.n"
            class="step"
            :class="{ active: step === s.n, done: step > s.n }"
          >
            <span class="step__num">
              <svg v-if="step > s.n" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
              <template v-else>{{ s.n }}</template>
            </span>
            <span class="step__label">{{ s.label }}</span>
          </li>
        </ol>

        <!-- ── Paso 1 ──────────────────────────────────────────────────── -->
        <form v-if="step === 1" class="form" novalidate @submit.prevent="next">
          <div class="field float">
            <input id="reg-nombre" v-model="form.nombre" class="underline-input" placeholder=" " autocomplete="name" />
            <label for="reg-nombre">Nombre completo</label>
            <span class="line" aria-hidden="true"></span>
          </div>
          <div class="field float">
            <input id="reg-email" v-model="form.email" class="underline-input" type="email" placeholder=" " autocomplete="email" />
            <label for="reg-email">Correo electrónico</label>
            <span class="line" aria-hidden="true"></span>
          </div>
          <div class="field float">
            <input id="reg-tel" v-model="form.telefono" class="underline-input" type="tel" placeholder=" " autocomplete="tel" />
            <label for="reg-tel">Teléfono (opcional)</label>
            <span class="line" aria-hidden="true"></span>
          </div>
          <div class="field float">
            <input id="reg-pass" v-model="form.password" class="underline-input" type="password" placeholder=" " autocomplete="new-password" />
            <label for="reg-pass">Contraseña</label>
            <span class="line" aria-hidden="true"></span>
          </div>
          <div class="field float">
            <input id="reg-pass2" v-model="form.password2" class="underline-input" type="password" placeholder=" " autocomplete="new-password" />
            <label for="reg-pass2">Confirmar contraseña</label>
            <span class="line" aria-hidden="true"></span>
          </div>

          <div class="step__actions">
            <router-link to="/login" class="ghost-link">← Volver al inicio de sesión</router-link>
            <button type="submit" class="submit">Continuar</button>
          </div>
        </form>

        <!-- ── Paso 2 ──────────────────────────────────────────────────── -->
        <form v-else-if="step === 2" class="form" novalidate @submit.prevent="next">
          <div class="field float">
            <input id="reg-rfc" v-model="form.rfc" class="underline-input mono" placeholder=" " maxlength="13" style="text-transform: uppercase" />
            <label for="reg-rfc">RFC (persona física o moral)</label>
            <span class="line" aria-hidden="true"></span>
          </div>
          <div class="field float">
            <input id="reg-razon" v-model="form.razonSocial" class="underline-input" placeholder=" " />
            <label for="reg-razon">Razón social (opcional)</label>
            <span class="line" aria-hidden="true"></span>
          </div>
          <div class="field">
            <label for="reg-regimen" class="static-label">Régimen fiscal</label>
            <SelectField id="reg-regimen" v-model="form.regimen">
              <option v-for="r in regimenesDisponibles" :key="r.id" :value="r.id">{{ r.id }} - {{ r.nombre }}</option>
            </SelectField>
            <p v-if="erroresStep.length" class="field-error">{{ erroresStep[0] }}</p>
            <div v-else class="hint">El RFC determina si eres persona física o moral y qué régimen puedes usar.</div>
          </div>
          <div class="field float">
            <input id="reg-cp" v-model="form.cp" class="underline-input mono" placeholder=" " maxlength="5" inputmode="numeric" />
            <label for="reg-cp">Código postal</label>
            <span class="line" aria-hidden="true"></span>
          </div>

          <div class="step__actions">
            <button type="button" class="ghost-link" @click="step = 1">← Atrás</button>
            <button type="submit" class="submit">Continuar</button>
          </div>
        </form>

        <!-- ── Paso 3 ──────────────────────────────────────────────────── -->
        <form v-else class="form" novalidate @submit.prevent="submit">
          <div class="field">
            <label for="reg-negocio" class="static-label">Negocio al que te registrarás</label>
            <SelectField id="reg-negocio" v-model="form.negocioId">
              <option value="">Selecciona un negocio</option>
              <option v-for="n in negocios" :key="n.id" :value="n.id">{{ n.nombre }} ({{ n.rfc }})</option>
            </SelectField>
          </div>

          <div class="summary">
            <p class="summary__title">Resumen</p>
            <div class="summary__row"><span>Nombre</span><strong>{{ form.nombre }}</strong></div>
            <div class="summary__row"><span>Correo</span><strong>{{ form.email }}</strong></div>
            <div class="summary__row"><span>RFC</span><strong class="mono">{{ form.rfc.toUpperCase() }}</strong></div>
            <div class="summary__row"><span>Código postal</span><strong class="mono">{{ form.cp }}</strong></div>
            <div class="summary__row"><span>Régimen</span><strong>{{ form.regimen }}</strong></div>
          </div>

          <div class="step__actions">
            <button type="button" class="ghost-link" @click="step = 2">← Atrás</button>
            <button type="submit" class="submit" :disabled="loading">
              {{ loading ? 'Creando cuenta…' : 'Crear mi cuenta' }}
            </button>
          </div>
        </form>

        <footer class="legal">
          <router-link to="/login" class="legal__link">Términos y Condiciones</router-link>
          <span class="legal__dot" aria-hidden="true">·</span>
          <router-link to="/login" class="legal__link">Aviso de Privacidad</router-link>
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

.brand { display: flex; align-items: center; gap: 15px; }
.brand-name { font-size: 19px; font-weight: 800; color: var(--text); letter-spacing: -.01em; }
.brand-sub { font-size: 13px; color: var(--muted); }

/* ── Stepper ──────────────────────────────────────────────────────────── */
.stepper {
  display: flex; align-items: center; gap: 6px;
  list-style: none; padding: 0 0 4px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 4px;
}
.step { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; opacity: .5; transition: opacity .25s ease; }
.step.active, .step.done { opacity: 1; }
.step__num {
  width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 12.5px; font-weight: 700;
  background: var(--bg-subtle); color: var(--muted);
  border: 1px solid var(--control-border);
  transition: all .25s ease;
}
.step__num svg { width: 13px; height: 13px; }
.step.active .step__num { background: var(--accent-coral); color: var(--accent-contrast, #fff); border-color: transparent; box-shadow: 0 6px 16px rgba(251, 146, 60, .42); }
.step.done .step__num { background: var(--success-soft); color: var(--success); border-color: transparent; }
.step__label { font-size: 12.5px; font-weight: 600; color: var(--text-soft); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.step.active .step__label { color: var(--text); }

/* ── Campos ───────────────────────────────────────────────────────────── */
.form { display: flex; flex-direction: column; gap: 20px; }
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
.static-label { display: block; font-size: 13px; font-weight: 600; color: var(--text-soft); margin-bottom: 7px; }

/* ── Resumen ──────────────────────────────────────────────────────────── */
.summary {
  background: var(--bg-subtle); border: 1px solid var(--border);
  border-radius: 14px; padding: 16px 18px;
  display: flex; flex-direction: column; gap: 8px;
}
.summary__title { margin: 0 0 2px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: var(--muted); }
.summary__row { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; font-size: 13.5px; color: var(--muted); }
.summary__row strong { color: var(--text); font-weight: 600; }

/* ── Acciones ─────────────────────────────────────────────────────────── */
.step__actions { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 4px; }
.submit {
  display: inline-flex; align-items: center; justify-content: center; gap: 10px;
  width: 100%; min-width: 0;
  height: 52px; padding: 0 22px; border: none; border-radius: 14px;
  background: var(--accent-coral); color: var(--accent-contrast, #fff);
  font-weight: 700; font-size: 15.5px;
  font-family: inherit; cursor: pointer;
  white-space: nowrap; overflow: hidden;
  box-shadow:
    0 12px 26px rgba(251, 146, 60, .40),
    inset 0 0 0 1px rgba(120, 53, 15, .16);
  transition: transform .18s ease, box-shadow .25s ease, filter .2s ease;
}
.submit > span { overflow: hidden; text-overflow: ellipsis; }
.submit:hover:not(:disabled) { transform: translateY(-2px); filter: saturate(1.08) brightness(1.03); box-shadow: 0 18px 34px rgba(251, 146, 60, .42); }
.submit:active:not(:disabled) { transform: translateY(0) scale(.985); }
.submit:disabled { opacity: .7; cursor: not-allowed; }
.ghost-link {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 8px 14px; border-radius: 10px;
  border: 1px solid transparent; background: transparent;
  color: var(--text-soft); font-weight: 600; font-size: 13.5px;
  font-family: inherit; text-decoration: none; cursor: pointer;
  transition: all .2s ease;
}
.ghost-link:hover { background: var(--bg-subtle); color: var(--text); border-color: var(--control-border); }

/* ── Legal ────────────────────────────────────────────────────────────── */
.legal {
  display: flex; align-items: center; justify-content: center; gap: 8px; flex-wrap: wrap;
  padding-top: 16px; border-top: 1px solid var(--border); font-size: 12.5px;
}
.legal__link { color: var(--muted); text-decoration: none; font-weight: 500; transition: color .2s ease; }
.legal__link:hover { color: var(--brand-primary); text-decoration: underline; }
.legal__dot { color: var(--border-strong); }

@media (min-width: 900px) {
  .login-page { grid-template-columns: 1fr 1fr; }
  /* La columna 1 la ocupa el fondo animado (fixed); el form va en la columna 2 */
  .auth-panel { grid-column: 2;
    height: 100vh; height: 100dvh;
    min-height: 100vh; min-height: 100dvh;
    align-items: stretch;
    padding: 24px 40px 24px 8px;
  }
  .form-card { height: 100%; max-height: 100%; overflow-y: auto; max-width: 620px; justify-content: center; padding: 40px 44px; }
}

@media (max-width: 899px) {
  .login-page { padding-top: 6vh; }
  .auth-panel { align-items: flex-start; }
}

@media (max-width: 560px) {
  .form-card { padding: 26px 20px; border-radius: 20px; }
  .step__label { display: none; }
  .step__actions { flex-direction: column-reverse; align-items: stretch; }
  .submit { width: 100%; }
}
</style>
