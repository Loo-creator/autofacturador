<script setup>
/**
 * Configuración del negocio: datos fiscales, CSD, series/folios, apariencia y contraseña.
 */
import { ref, onMounted, computed } from 'vue'
import SelectField from '@/components/ui/SelectField.vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { useNegociosStore } from '@/stores/negocios'
import { useUiStore } from '@/stores/ui'
import { useToast } from '@/composables/useToast'
import { REGIMENES } from '@/utils/satCatalogs'
import CsdPanel from '@/components/cfdi/CsdPanel.vue'
import AccountSecurity from '@/components/ui/AccountSecurity.vue'

const auth = useAuthStore()
const store = useNegociosStore()
const ui = useUiStore()
const toast = useToast()

const negId = computed(() => auth.user?.negocioId)
const tab = ref('datos')
const subSeguridad = ref('correo')
const form = ref({})
const guardando = ref(false)

function cambiarNegocio(id) {
  const n = store.items.find(x => x.id === id)
  if (!n) return
  form.value = { ...n }
}

onMounted(async () => {
  await store.fetch()
  // El admin no tiene negocio asignado: elige uno para configurar.
  const id = negId.value || store.items[0]?.id
  const n = store.items.find(x => x.id === id)
  if (n) {
    form.value = { ...n }
  }
})

async function save() {
  guardando.value = true
  const r = await store.update(form.value.id, form.value)
  guardando.value = false
  if (r.ok) toast.success({ title: 'Configuración guardada', message: 'Los cambios se aplicaron correctamente.' })
  else toast.error(r.error)
}
</script>

<template>
  <AppLayout>
    <div class="page-header">
      <div>
        <h1 class="page-title">Configuración</h1>
        <p class="page-subtitle">Datos del emisor, certificados, folios, apariencia y seguridad</p>
      </div>
      <button class="btn btn-primary" :disabled="guardando" @click="save">
        {{ guardando ? 'Guardando…' : 'Guardar cambios' }}
      </button>
    </div>

    <div class="tabs">
      <button class="tab" :class="{ active: tab === 'datos' }" @click="tab = 'datos'">Datos generales</button>
      <button class="tab" :class="{ active: tab === 'csd' }" @click="tab = 'csd'">Certificados CSD</button>
      <button class="tab" :class="{ active: tab === 'series' }" @click="tab = 'series'">Series y folios</button>
      <button class="tab" :class="{ active: tab === 'seguridad' }" @click="tab = 'seguridad'">Seguridad</button>
    </div>

    <!-- Selector de negocio (sólo para el administrador) -->
    <div v-if="auth.esAdmin" class="card">
      <div class="card-body form-grid" style="grid-template-columns:1fr;max-width:520px">
        <div class="field">
          <label for="cfg-negocio">Negocio a configurar</label>
          <SelectField id="cfg-negocio" :value="form.id" @change="cambiarNegocio($event)">
            <option v-for="n in store.items" :key="n.id" :value="n.id">{{ n.nombre }} ({{ n.rfc }})</option>
          </SelectField>
          <div class="hint">El administrador puede configurar cualquier negocio de la plataforma.</div>
        </div>
      </div>
    </div>

    <!-- ── Datos generales ──────────────────────────────────────────────── -->
    <div v-if="tab === 'datos'" class="tab-panel card">
      <div class="card-body form-grid">
        <div class="field span-2"><label>Nombre / Razón social</label><input class="input" v-model="form.nombre" placeholder="Razón social del emisor" /></div>
        <div class="field"><label>RFC emisor</label><input class="input mono" v-model="form.rfc" /></div>
        <div class="field"><label>Código postal (Lugar de expedición)</label><input class="input" v-model="form.cp" /></div>
        <div class="field span-2"><label>Régimen fiscal</label><SelectField v-model="form.regimen"><option v-for="r in REGIMENES" :key="r.id" :value="r.id">{{ r.id }} - {{ r.nombre }}</option></SelectField></div>
      </div>
    </div>

    <!-- ── CSD ──────────────────────────────────────────────────────────── -->
    <div v-else-if="tab === 'csd'" class="tab-panel card">
      <div class="card-body">
        <CsdPanel
          :model-value="form.certificado || {}"
          :emisor="form.rfc"
          @update:model-value="v => { form.certificado = v }"
          @save="save"
        />
      </div>
    </div>

    <!-- ── Series y folios ──────────────────────────────────────────────── -->
    <div v-else-if="tab === 'series'" class="tab-panel card">
      <div class="card-body form-grid" style="max-width:720px">
        <div class="field"><label>Serie activa</label><input class="input" v-model="form.serie" placeholder="Ej. A, FAC, CAF" /></div>
        <div class="field"><label>Folio actual</label><input class="input" type="number" v-model.number="form.folio" /></div>
        <div class="field"><label>Prefijo adicional</label><input class="input" placeholder="Opcional" /></div>
        <div class="field"><label>Incremento</label><input class="input" type="number" value="1" /></div>
        <div class="field span-2"><div class="hint">Los folios se asignan consecutivamente al timbrar cada comprobante. El siguiente folio será <strong>{{ (form.folio || 0) + 1 }}</strong>.</div></div>
      </div>
    </div>

    <!-- ── Seguridad ────────────────────────────────────────────────────── -->
    <div v-else class="tab-panel">
      <nav class="subtabs" role="tablist" aria-label="Acciones de seguridad">
        <button type="button" role="tab" class="subtab" :class="{ 'is-active': subSeguridad === 'correo' }" :aria-selected="subSeguridad === 'correo'" @click="subSeguridad = 'correo'">
          <span class="subtab__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>
          </span>
          <span>Correo electrónico</span>
        </button>
        <button type="button" role="tab" class="subtab" :class="{ 'is-active': subSeguridad === 'contrasena' }" :aria-selected="subSeguridad === 'contrasena'" @click="subSeguridad = 'contrasena'">
          <span class="subtab__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="15" r="4"/><path d="M10.8 12.2L20 3M17 6l3 3-2 2-3-3"/></svg>
          </span>
          <span>Contraseña</span>
        </button>
      </nav>

      <div class="card" style="margin-top:16px">
        <div class="card-body">
          <AccountSecurity :user="auth.user" :solo="subSeguridad" @updated="auth.setUser($event)" />
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>


/* Contraseña */
.pass-errors {
  margin-top: 16px; padding: 12px 14px; border-radius: 10px;
  background: var(--danger-soft); border: 1px solid rgba(220,38,38,.18);
}
.pass-errors p { margin: 0; font-size: 13px; color: var(--danger); }
.pass-errors p + p { margin-top: 3px; }

@media (max-width: 640px) {
}

/* Sub-pestañas (mismo lenguaje que ClienteTabs) */
.subtabs {
  display: flex; gap: 4px; padding: 5px;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 14px; box-shadow: var(--shadow-sm);
}
.subtab {
  display: inline-flex; align-items: center; gap: 8px;
  flex: 1 1 auto; justify-content: center;
  padding: 11px 16px; border: none; border-radius: 10px;
  background: transparent; color: var(--muted);
  font-size: 14px; font-weight: 600; font-family: inherit;
  cursor: pointer; white-space: nowrap;
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

@media (max-width: 640px) {
  .subtab { padding: 10px 12px; font-size: 13px; }
}
</style>
