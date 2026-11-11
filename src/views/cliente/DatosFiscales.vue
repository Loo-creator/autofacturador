<script setup>
/**
 * Mis datos (cliente).
 *
 * La vista se organiza en sub-pestañas para que cada acción esté ordenada:
 *   1. Datos fiscales → identificación (RFC) + domicilio fiscal (lo que va al CFDI)
 *   2. Correo        → cambiar el correo de acceso
 *   3. Contraseña    → cambiar la contraseña
 */
import { ref, reactive, computed, watch } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import ValidacionRfcInput from '@/components/cfdi/ValidacionRfcInput.vue'
import SelectField from '@/components/ui/SelectField.vue'
import AccountSecurity from '@/components/ui/AccountSecurity.vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { REGIMENES } from '@/utils/satCatalogs'
import { validarReceptor, tipoPersona, regimenesPara } from '@/utils/cfdiValidations'
import * as svc from '@/services/negocio.service'

const auth = useAuthStore()
const toast = useToast()

const sub = ref('fiscal')
const form = reactive({ nombre: '', rfc: '', regimen: '616', cp: '', email: '', telefono: '' })
const csfValidez = ref(null)
const guardando = ref(false)

const SUBTABS = [
  { key: 'fiscal', label: 'Datos fiscales', icon: 'doc' },
  { key: 'correo', label: 'Correo', icon: 'mail' },
  { key: 'contrasena', label: 'Contraseña', icon: 'key' },
]

const ICONS = {
  doc: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h4"/></svg>`,
  mail: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>`,
  key: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="15" r="4"/><path d="M10.8 12.2L20 3M17 6l3 3-2 2-3-3"/></svg>`,
}

watch(() => auth.user, (u) => {
  if (!u) return
  Object.assign(form, {
    nombre: u.nombre || '', rfc: u.rfc || '', regimen: u.regimen || '616',
    cp: u.cp || '', email: u.email || '', telefono: u.telefono || '',
  })
}, { immediate: true })

/* ── Validación ──────────────────────────────────────────────────────────── */
const tipoRfc = computed(() => tipoPersona(form.rfc))
const regimenesDisponibles = computed(() => {
  const lista = REGIMENES.filter(r => !tipoRfc.value || regimenesPara(tipoRfc.value).includes(r.id))
  return lista.length ? lista : REGIMENES
})

/** Reglas fiscales del SAT + datos de contacto. */
const errores = computed(() => {
  const e = []
  const v = validarReceptor({
    rfc: form.rfc, nombre: form.nombre, regimen: form.regimen,
    usoCfdi: 'G03', cp: form.cp, correo: form.email,
  })
  for (const err of v.errores) e.push(err.mensaje)
  if (!String(form.telefono).trim()) e.push('El teléfono es obligatorio.')
  return e
})

const errorDe = (campo) => {
  const v = validarReceptor({
    rfc: form.rfc, nombre: form.nombre, regimen: form.regimen,
    usoCfdi: 'G03', cp: form.cp, correo: form.email,
  })
  return v.errores.find(x => x.campo === campo)?.mensaje || ''
}

const csfEstado = computed(() => {
  const v = csfValidez.value
  if (!v) return { tono: 'badge-muted', texto: 'Sin verificar' }
  if (v.nivel === 'ok') return { tono: 'badge-success', texto: 'Verificado contra la CSF' }
  if (v.nivel === 'warning') return { tono: 'badge-warning', texto: 'Con observaciones' }
  if (v.nivel === 'idle') return { tono: 'badge-muted', texto: 'Sin verificar' }
  return { tono: 'badge-danger', texto: 'No coincide con la CSF' }
})

async function guardar() {
  if (errores.value.length) return toast.error(errores.value[0])
  guardando.value = true
  const r = await svc.saveCliente({ ...auth.user, ...form })
  guardando.value = false
  if (!r.ok) return toast.error(r.error)
  auth.setUser({ ...form })
  toast.success({ title: 'Datos fiscales actualizados', message: 'Se usarán en tus próximos comprobantes.' })
}
</script>

<template>
  <AppLayout>

    <div class="page-header">
      <div>
        <h1 class="page-title">Mis datos</h1>
        <p class="page-subtitle">Datos fiscales de receptor y seguridad de la cuenta</p>
      </div>
      <button v-if="sub === 'fiscal'" class="btn btn-primary" :disabled="guardando || errores.length > 0" @click="guardar">
        {{ guardando ? 'Guardando…' : 'Guardar datos fiscales' }}
      </button>
    </div>

    <!-- Sub-pestañas: cada acción de la vista, ordenada -->
    <nav class="subtabs" role="tablist" aria-label="Acciones de mis datos">
      <button
        v-for="t in SUBTABS"
        :key="t.key"
        type="button"
        role="tab"
        class="subtab"
        :class="{ 'is-active': sub === t.key }"
        :aria-selected="sub === t.key"
        @click="sub = t.key"
      >
        <span class="subtab__icon" v-html="ICONS[t.icon]" aria-hidden="true"></span>
        <span>{{ t.label }}</span>
      </button>
    </nav>

    <!-- ── 1. Datos fiscales ─────────────────────────────────────────────── -->
    <section v-if="sub === 'fiscal'" class="card" role="tabpanel">
      <header class="card-header">
        <div>
          <h2 class="datos-title">Datos fiscales del receptor</h2>
          <p class="datos-sub">Aparecen como receptor en tus comprobantes CFDI 4.0</p>
        </div>
        <span class="badge" :class="csfEstado.tono">{{ csfEstado.texto }}</span>
      </header>

      <div class="card-body grid" style="gap:20px">
        <div class="datos-note" :class="`is-${csfValidez?.nivel || 'idle'}`">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 16h.01" /></svg>
          <span>
            <template v-if="csfValidez?.mensaje">{{ csfValidez.mensaje }}</template>
            <template v-else>Captura tu RFC para validarlo contra la Constancia de Situación Fiscal.</template>
          </span>
        </div>

        <div class="form-grid">
          <div class="field span-2">
            <ValidacionRfcInput
              v-model="form.rfc"
              :razon-social="form.nombre"
              :regimen="form.regimen"
              :cp="form.cp"
              input-id="datos-rfc"
              hint="Debe coincidir con tu Constancia de Situación Fiscal, si no el comprobante será rechazado."
              @update:validity="csfValidez = $event"
            />
          </div>

          <div class="field span-2">
            <label for="datos-nombre">Nombre / Razón social</label>
            <input id="datos-nombre" v-model="form.nombre" class="input" placeholder="Tal como aparece en tu CSF" />
            <p v-if="errorDe('nombre')" class="field-error">{{ errorDe('nombre') }}</p>
            <div v-else class="hint">Persona física (nombre y apellidos) o moral (razón social completa).</div>
          </div>

          <div class="field">
            <label for="datos-cp">Código postal</label>
            <input id="datos-cp" v-model="form.cp" class="input mono" maxlength="5" inputmode="numeric" placeholder="5 dígitos" />
            <p v-if="errorDe('cp')" class="field-error">{{ errorDe('cp') }}</p>
            <div v-else class="hint">Debe coincidir con el de tu CSF.</div>
          </div>

          <div class="field">
            <label for="datos-regimen">Régimen fiscal</label>
            <SelectField id="datos-regimen" v-model="form.regimen">
              <option v-for="r in regimenesDisponibles" :key="r.id" :value="r.id">{{ r.id }} - {{ r.nombre }}</option>
            </SelectField>
            <p v-if="errorDe('regimen')" class="field-error">{{ errorDe('regimen') }}</p>
            <div v-else class="hint">El RFC define si eres persona física o moral y, con ello, el régimen válido.</div>
          </div>

          <div class="field">
            <label for="datos-tel">Teléfono</label>
            <input id="datos-tel" v-model="form.telefono" class="input" type="tel" placeholder="10 dígitos" />
            <div class="hint">Para avisos y recordatorios de facturación.</div>
          </div>

          <div class="field">
            <label for="datos-correo">Correo electrónico</label>
            <input id="datos-correo" v-model="form.email" class="input" type="email" disabled />
            <div class="hint">Para cambiarlo ve a la pestaña <strong>Correo</strong>.</div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── 2. Correo ────────────────────────────────────────────────────── -->
    <section v-else-if="sub === 'correo'" role="tabpanel">
      <AccountSecurity :user="auth.user" solo="correo" @updated="auth.setUser($event)" />
    </section>

    <!-- ── 3. Contraseña ────────────────────────────────────────────────── -->
    <section v-else role="tabpanel">
      <AccountSecurity :user="auth.user" solo="contrasena" @updated="auth.setUser($event)" />
    </section>

    <div v-if="sub === 'fiscal' && errores.length" class="datos-alert">
      <p class="datos-alert-title">Faltan datos para guardar:</p>
      <ul>
        <li v-for="(e, i) in errores" :key="i">{{ e }}</li>
      </ul>
    </div>
  </AppLayout>
</template>

<style scoped>
.datos-title { margin: 0; font-size: 16px; font-weight: 600; color: var(--text); }
.datos-sub { margin: 3px 0 0; font-size: 13px; color: var(--muted); }

.subtabs {
  display: flex;
  gap: 4px;
  padding: 5px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  box-shadow: var(--shadow-sm);
}
.subtab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex: 1 1 auto;
  justify-content: center;
  padding: 11px 16px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--muted);
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  transition: background .2s ease, color .2s ease, box-shadow .2s ease;
}
.subtab:hover { background: var(--bg-subtle); color: var(--text); }
.subtab.is-active {
  background: var(--brand-primary-soft);
  color: var(--brand-ink);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--brand-primary) 22%, transparent);
}
.subtab__icon { width: 17px; height: 17px; flex-shrink: 0; }
.subtab__icon :deep(svg) { width: 17px; height: 17px; }

.field-error { margin: 0; font-size: 12.5px; line-height: 1.45; color: var(--danger); }

.datos-note {
  display: flex; align-items: flex-start; gap: 9px; margin: 0;
  padding: 11px 14px; border-radius: 10px;
  font-size: 13px; line-height: 1.45;
  background: var(--bg-subtle); color: var(--muted);
  border: 1px solid var(--border);
}
.datos-note svg { width: 16px; height: 16px; flex-shrink: 0; margin-top: 1px; }
.datos-note.is-ok { background: var(--badge-success-bg); color: var(--badge-success-fg); border-color: transparent; }
.datos-note.is-warning { background: var(--badge-warning-bg); color: var(--badge-warning-fg); border-color: transparent; }
.datos-note.is-error { background: var(--badge-danger-bg); color: var(--badge-danger-fg); border-color: transparent; }

.datos-alert {
  margin-top: 20px; padding: 14px 18px; border-radius: 12px;
  background: var(--danger-soft); border: 1px solid rgba(220,38,38,.18);
}
.datos-alert-title { margin: 0; font-size: 13px; font-weight: 600; color: var(--danger); }
.datos-alert ul { margin: 6px 0 0; padding-left: 18px; list-style: disc; }
.datos-alert li { font-size: 13px; color: var(--danger); }

@media (max-width: 640px) {
  .subtab { padding: 10px 12px; font-size: 13px; }
}
</style>
