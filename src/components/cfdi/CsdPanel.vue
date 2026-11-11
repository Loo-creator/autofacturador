<script setup>
/**
 * Panel del Certificado Digital (CSD / e.firma).
 *
 * Registra y muestra los 3 elementos que exige el SAT para firmar:
 *   1. Archivo .cer  (certificado)
 *   2. Archivo .key  (llave privada)
 *   3. Contraseña de la llave privada
 *
 * La contraseña nunca se guarda en claro: sólo se registra que está definida
 * (buena práctica, igual que en los PAC).
 */
import { ref, computed, watch } from 'vue'
import { formatDate } from '@/utils/formatters'

const props = defineProps({
  modelValue: { type: Object, default: () => ({}) },
  emisor: { type: String, default: '' }
})
const emit = defineEmits(['update:modelValue', 'save'])

const cerFile = ref(null)
const keyFile = ref(null)
const password = ref('')
const showPassword = ref(false)
const showMasked = ref(false)
const dragOver = ref({ cer: false, key: false })

const csd = computed(() => ({
  numero: '', emisor: '', archivoCer: '', archivoKey: '', passwordDefinida: false,
  inicio: '', fin: '', estado: 'sin-certificado', ...(props.modelValue || {}),
}))

const HOY = new Date()
function diasRestantes(fin) {
  if (!fin) return null
  const f = new Date(fin)
  if (Number.isNaN(f.getTime())) return null
  return Math.ceil((f - HOY) / 86400000)
}
const restantes = computed(() => diasRestantes(csd.value.fin))
const progreso = computed(() => {
  if (!csd.value.inicio || !csd.value.fin) return 0
  const total = new Date(csd.value.fin) - new Date(csd.value.inicio)
  if (!total) return 0
  const usados = HOY - new Date(csd.value.inicio)
  return Math.max(0, Math.min(100, Math.round((usados / total) * 100)))
})
const estadoLabel = computed(() => ({
  activa: 'Activo', por_vencer: 'Por vencer', vencido: 'Vencido', sin_certificado: 'Sin certificado',
}[csd.value.estado] || csd.value.estado))
const estadoTone = computed(() => ({
  activa: 'badge-success', por_vencer: 'badge-warning', vencido: 'badge-danger', sin_certificado: 'badge-muted',
}[csd.value.estado] || 'badge-muted'))

function formateaBytes(n) {
  if (!n && n !== 0) return ''
  if (n < 1024) return `${n} B`
  if (n < 1048576) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1048576).toFixed(1)} MB`
}

function acepta(archivo, ext) {
  return archivo.name.toLowerCase().endsWith(ext)
}

function onFile(tipo, archivo) {
  if (!archivo) return
  const ext = tipo === 'cer' ? '.cer' : '.key'
  if (!acepta(archivo, ext)) {
    emit('update:modelValue', { ...csd.value, error: `El archivo debe ser de tipo ${ext}` })
    return
  }
  if (tipo === 'cer') cerFile.value = archivo
  else keyFile.value = archivo
  emit('update:modelValue', { ...csd.value, error: '' })
}

function onDrop(tipo, e) {
  dragOver.value[tipo] = false
  onFile(tipo, e.dataTransfer?.files?.[0])
}

function limpiarArchivo(tipo) {
  if (tipo === 'cer') cerFile.value = null
  else keyFile.value = null
}

watch(() => props.modelValue, (v) => {
  if (v?.error === undefined && csd.value.error) emit('update:modelValue', { ...csd.value, error: '' })
})

function registrar() {
  const payload = {
    ...csd.value,
    archivoCer: cerFile.value?.name || csd.value.archivoCer,
    archivoKey: keyFile.value?.name || csd.value.archivoKey,
    // Nunca se persiste la contraseña en claro.
    passwordDefinida: Boolean(password.value) || csd.value.passwordDefinida,
    estado: csd.value.fin && restantes.value !== null && restantes.value <= 0 ? 'vencido' : 'activa',
    error: '',
  }
  emit('update:modelValue', payload)
  emit('save', payload)
  password.value = ''
}
</script>

<template>
  <div class="csd">
    <!-- ── VER: estado del certificado registrado ──────────────────────── -->
    <section class="csd__block">
      <header class="csd__head">
        <h3>Certificado registrado</h3>
        <span class="badge" :class="estadoTone">{{ estadoLabel }}</span>
      </header>

      <div v-if="csd.estado === 'sin-certificado'" class="csd__empty">
        <span class="csd__empty-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 4v6c0 4.5-3 7.5-8 9-5-1.5-8-4.5-8-9V7l8-4z" /><path d="M9 12l2 2 4-4" /></svg>
        </span>
        <p class="csd__empty-title">Aún no hay certificado registrado</p>
        <p class="csd__empty-text">Registra tu .cer, tu .key y la contraseña para poder timbrar.</p>
      </div>

      <template v-else>
        <dl class="csd__grid">
          <div><dt>Número de certificado</dt><dd class="mono">{{ csd.numero || '—' }}</dd></div>
          <div><dt>Emisor</dt><dd class="mono">{{ csd.emisor || '—' }}</dd></div>
          <div>
            <dt>Archivo .cer</dt>
            <dd class="mono csd__file">
              <span class="csd__file-chip">{{ csd.archivoCer || '—' }}</span>
            </dd>
          </div>
          <div>
            <dt>Archivo .key</dt>
            <dd class="mono csd__file">
              <span class="csd__file-chip">{{ csd.archivoKey || '—' }}</span>
            </dd>
          </div>
          <div>
            <dt>Contraseña de la llave</dt>
            <dd class="mono">
              <span v-if="csd.passwordDefinida" class="csd__file-chip">
                {{ showMasked ? 'contraseña-guardada' : '••••••••' }}
              </span>
              <span v-else class="text-muted">No definida</span>
            </dd>
          </div>
          <div>
            <dt>Vigencia</dt>
            <dd>{{ csd.inicio ? formatDate(csd.inicio) : '—' }} → {{ csd.fin ? formatDate(csd.fin) : '—' }}</dd>
          </div>
        </dl>

        <div class="csd__progress" v-if="csd.inicio && csd.fin">
          <div class="csd__progress-bar"><span :style="{ width: progreso + '%' }"></span></div>
          <p class="csd__progress-text">
            <template v-if="restantes !== null && restantes > 0">
              Vence en <strong>{{ restantes }}</strong> días ({{ formatDate(csd.fin) }})
            </template>
            <template v-else-if="restantes !== null">
              El certificado venció el {{ formatDate(csd.fin) }}
            </template>
          </p>
        </div>

        <div class="csd__actions">
          <button type="button" class="btn btn-secondary btn-sm" @click="showMasked = !showMasked">
            {{ showMasked ? 'Ocultar contraseña' : 'Ver contraseña' }}
          </button>
        </div>
      </template>
    </section>

    <!-- ── REGISTRAR: los 3 campos ─────────────────────────────────────── -->
    <section class="csd__block">
      <header class="csd__head">
        <h3>Registrar o actualizar certificado</h3>
        <span class="text-muted" style="font-size:var(--fs-xs)">Sólo .cer, .key y su contraseña</span>
      </header>

      <div class="csd__form">
        <!-- .cer -->
        <div class="csd__field">
          <label class="csd__label" for="csd-cer">
            Archivo .cer <span class="csd__req">*</span>
          </label>
          <label
            class="csd__drop"
            :class="{ 'is-over': dragOver.cer, 'has-file': cerFile || csd.archivoCer }"
            @dragover.prevent="dragOver.cer = true"
            @dragleave="dragOver.cer = false"
            @drop.prevent="onDrop('cer', $event)"
          >
            <input id="csd-cer" type="file" accept=".cer" class="sr-only" @change="onFile('cer', $event.target.files[0])" />
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" />
            </svg>
            <span v-if="cerFile" class="csd__drop-text">
              <strong>{{ cerFile.name }}</strong>
              <span>{{ formateaBytes(cerFile.size) }}</span>
            </span>
            <span v-else-if="csd.archivoCer" class="csd__drop-text">
              <strong>{{ csd.archivoCer }}</strong>
              <span>Archivo registrado — haz clic para reemplazarlo</span>
            </span>
            <span v-else class="csd__drop-text">
              <strong>Arrastra el .cer aquí</strong>
              <span>o haz clic para buscarlo</span>
            </span>
            <button v-if="cerFile" type="button" class="csd__drop-clear" aria-label="Quitar archivo .cer" @click.prevent.stop="limpiarArchivo('cer')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </label>
        </div>

        <!-- .key -->
        <div class="csd__field">
          <label class="csd__label" for="csd-key">
            Archivo .key <span class="csd__req">*</span>
          </label>
          <label
            class="csd__drop"
            :class="{ 'is-over': dragOver.key, 'has-file': keyFile || csd.archivoKey }"
            @dragover.prevent="dragOver.key = true"
            @dragleave="dragOver.key = false"
            @drop.prevent="onDrop('key', $event)"
          >
            <input id="csd-key" type="file" accept=".key" class="sr-only" @change="onFile('key', $event.target.files[0])" />
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="8" cy="15" r="4" /><path d="M10.8 12.2L20 3M17 6l3 3-2 2-3-3" />
            </svg>
            <span v-if="keyFile" class="csd__drop-text">
              <strong>{{ keyFile.name }}</strong>
              <span>{{ formateaBytes(keyFile.size) }}</span>
            </span>
            <span v-else-if="csd.archivoKey" class="csd__drop-text">
              <strong>{{ csd.archivoKey }}</strong>
              <span>Archivo registrado — haz clic para reemplazarlo</span>
            </span>
            <span v-else class="csd__drop-text">
              <strong>Arrastra el .key aquí</strong>
              <span>o haz clic para buscarlo</span>
            </span>
            <button v-if="keyFile" type="button" class="csd__drop-clear" aria-label="Quitar archivo .key" @click.prevent.stop="limpiarArchivo('key')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </label>
        </div>

        <!-- Contraseña -->
        <div class="csd__field">
          <label class="csd__label" for="csd-pass">Contraseña de la llave privada <span class="csd__req">*</span></label>
          <div class="csd__pass">
            <input
              id="csd-pass"
              v-model="password"
              class="input"
              :type="showPassword ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="••••••••"
            />
            <button type="button" class="csd__eye" :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'" @click="showPassword = !showPassword">
              <svg v-if="!showPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" /><circle cx="12" cy="12" r="3" /></svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 3l18 18" /><path d="M10.6 10.6a3 3 0 004.2 4.2" /><path d="M9.9 5.1A10.9 10.9 0 0112 5c7 0 11 7 11 7a20 20 0 01-4.4 4.9" /></svg>
            </button>
          </div>
          <div class="hint">No se almacena en texto plano: sólo se registra que está definida.</div>
        </div>

        <div class="csd__field">
          <label class="csd__label" for="csd-inicio">Vigencia desde</label>
          <input id="csd-inicio" class="input" type="date" :value="csd.inicio" @input="emit('update:modelValue', { ...csd, inicio: $event.target.value })" />
        </div>
        <div class="csd__field">
          <label class="csd__label" for="csd-fin">Vigencia hasta</label>
          <input id="csd-fin" class="input" type="date" :value="csd.fin" @input="emit('update:modelValue', { ...csd, fin: $event.target.value })" />
        </div>
      </div>

      <p v-if="csd.error" class="csd__error">{{ csd.error }}</p>

      <div class="csd__foot">
        <button type="button" class="btn btn-primary" @click="registrar">Registrar certificado</button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.csd { display: flex; flex-direction: column; gap: 24px; }

.csd__block {
  background: var(--bg-subtle);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 20px;
}
.csd__head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
.csd__head h3 { margin: 0; font-size: 15px; font-weight: 600; color: var(--text); }

.csd__empty { text-align: center; padding: 28px 16px; }
.csd__empty-icon { display: inline-flex; width: 48px; height: 48px; border-radius: 14px; background: var(--badge-muted-bg); color: var(--muted); margin-bottom: 10px; }
.csd__empty-icon svg { width: 24px; height: 24px; }
.csd__empty-title { margin: 0; font-size: 14px; font-weight: 600; color: var(--text); }
.csd__empty-text { margin: 4px 0 0; font-size: 13px; color: var(--muted); }

.csd__grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px 20px; margin: 0; }
.csd__grid dt { margin: 0; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; color: var(--muted); }
.csd__grid dd { margin: 3px 0 0; font-size: 14px; color: var(--text); font-weight: 500; word-break: break-word; }

.csd__file-chip {
  display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 999px;
  background: var(--brand-primary-soft); color: var(--brand-ink); font-size: 12.5px; font-weight: 600;
}

.csd__progress { margin-top: 18px; }
.csd__progress-bar { height: 7px; border-radius: 99px; background: var(--bg); overflow: hidden; border: 1px solid var(--border); }
.csd__progress-bar span { display: block; height: 100%; background: var(--grad-cta); transition: width .3s ease; }
.csd__progress-text { margin: 7px 0 0; font-size: 13px; color: var(--muted); }
.csd__progress-text strong { color: var(--text); }

.csd__actions { margin-top: 16px; display: flex; gap: 8px; }

.csd__form { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
.csd__field { display: flex; flex-direction: column; gap: 7px; min-width: 0; }
.csd__label { font-size: 13px; font-weight: 600; color: var(--text-soft); }
.csd__req { color: var(--danger); }

.csd__drop {
  position: relative;
  display: flex; align-items: center; gap: 12px;
  min-height: 74px; padding: 14px 16px;
  border: 1.5px dashed var(--border-strong); border-radius: 12px;
  background: var(--surface); cursor: pointer;
  transition: border-color .2s ease, background .2s ease, box-shadow .2s ease;
}
.csd__drop:hover { border-color: var(--brand-primary); background: var(--brand-primary-soft); }
.csd__drop.is-over { border-color: var(--brand-primary); background: var(--brand-primary-soft); box-shadow: 0 0 0 4px rgba(251,146,60,.16); }
.csd__drop.has-file { border-style: solid; border-color: var(--brand-primary); }
.csd__drop svg { width: 22px; height: 22px; color: var(--muted); flex-shrink: 0; }
.csd__drop.has-file svg { color: var(--brand-ink); }
.csd__drop-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.csd__drop-text strong { font-size: 13.5px; color: var(--text); font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.csd__drop-text span { font-size: 12px; color: var(--muted); }
.csd__drop-clear {
  margin-left: auto; width: 28px; height: 28px; border-radius: 8px; flex-shrink: 0;
  border: 1px solid var(--border); background: var(--surface); color: var(--muted); cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
}
.csd__drop-clear:hover { color: var(--danger); border-color: var(--danger); background: var(--danger-soft); }
.csd__drop-clear svg { width: 14px; height: 14px; color: currentColor; }

.csd__pass { position: relative; display: flex; align-items: center; }
.csd__pass .input { padding-right: 44px; }
.csd__eye {
  position: absolute; right: 6px; width: 32px; height: 32px; border-radius: 8px;
  border: none; background: transparent; color: var(--muted); cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
}
.csd__eye:hover { color: var(--text); background: var(--bg-subtle); }
.csd__eye svg { width: 18px; height: 18px; }

.csd__error { margin: 14px 0 0; font-size: 13px; color: var(--danger); }
.csd__foot { margin-top: 20px; display: flex; justify-content: flex-end; }

@media (max-width: 768px) {
  .csd__form { grid-template-columns: 1fr; }
}
</style>
