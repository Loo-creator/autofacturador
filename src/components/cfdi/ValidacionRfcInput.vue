<script setup>
/**
 * Input de RFC con validación en tiempo real contra la Constancia de Situación Fiscal.
 * Inspirado en el portal de Walmart: RFC + Razón Social + CP deben coincidir con la CSF
 * o el comprobante es rechazado. Aquí se valida antes de timbrar.
 */
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { consultarCsf } from '@/services/csf.service'
import { validarRFC } from '@/utils/rfcValidator'

const props = defineProps({
  modelValue: { type: String, default: '' },
  razonSocial: { type: String, default: '' },
  regimen: { type: String, default: '' },
  cp: { type: String, default: '' },
  label: { type: String, default: 'RFC' },
  inputId: { type: String, default: 'rfc' },
  hint: { type: String, default: 'Persona física (13) o persona moral (12). Se valida contra tu Constancia de Situación Fiscal.' },
  disabled: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'update:validity'])

const estado = ref('idle') // idle | checking | ok | warning | error
const resultado = ref(null)
const verComparativo = ref(false)
let timer = null
let requestId = 0

const rfc = computed({
  get: () => props.modelValue || '',
  set: (v) => emit('update:modelValue', String(v).toUpperCase().replace(/\s+/g, ''))
})

const formato = computed(() => validarRFC(rfc.value))
const longitudEsperada = computed(() => {
  const t = formato.value.tipo
  if (t === 'moral') return 12
  if (t === 'fisica') return 13
  return '12/13'
})

/** Texto de ayuda según lo que se ha detectado en el RFC. */
const hintDinamico = computed(() => {
  const t = formato.value.tipo
  if (t === 'moral') return 'RFC de persona moral (12 caracteres).'
  if (t === 'fisica') return 'RFC de persona física (13 caracteres).'
  return 'Persona física (13 caracteres) o persona moral (12 caracteres).'
})

const estadoUi = computed(() => ({
  idle: { icon: 'idle', tone: 'idle', texto: '' },
  checking: { icon: 'spinner', tone: 'checking', texto: 'Consultando CSF…' },
  ok: { icon: 'check', tone: 'ok', texto: 'Coincide con la CSF' },
  warning: { icon: 'alert', tone: 'warning', texto: 'Revisa la coincidencia' },
  error: { icon: 'cross', tone: 'error', texto: 'Revisa los datos' },
}[estado.value]))

watch(() => props.modelValue, (v) => programar(v))
watch(() => [props.razonSocial, props.regimen, props.cp], () => {
  if (estado.value !== 'idle' && estado.value !== 'checking') programar(props.modelValue)
})

onBeforeUnmount(() => clearTimeout(timer))

function programar(valor) {
  clearTimeout(timer)
  const v = String(valor || '').trim().toUpperCase()

  if (!v) {
    estado.value = 'idle'
    resultado.value = null
    verComparativo.value = false
    emit('update:validity', { ok: false, nivel: 'idle', codigo: 'VACIO', mensaje: '', campos: [] })
    return
  }

  if (!/^[A-ZÑ&0-9]{12,13}$/.test(v)) {
    estado.value = 'error'
    resultado.value = {
      ok: false,
      nivel: 'error',
      codigo: 'FORMATO_RFC',
      mensaje: v.length < 12
        ? `Faltan ${12 - v.length} caracteres para completar el RFC.`
        : 'Formato de RFC inválido: deben ser 12 (moral) o 13 (física) caracteres.',
      campos: [],
    }
    emit('update:validity', resultado.value)
    return
  }

  estado.value = 'checking'
  timer = setTimeout(consultar, 320)
}

async function consultar() {
  const id = ++requestId
  const res = await consultarCsf(rfc.value, {
    razonSocial: props.razonSocial,
    regimen: props.regimen,
    cp: props.cp,
  })

  if (id !== requestId) return

  if (!res.ok) {
    const fallback = { ok: false, nivel: 'error', codigo: 'CSF_NO_DISPONIBLE', mensaje: res.error || 'No fue posible consultar la CSF.', campos: [] }
    estado.value = 'error'
    resultado.value = fallback
    emit('update:validity', fallback)
    return
  }

  const v = res.data.validacion
  resultado.value = v
  estado.value = v.nivel === 'ok' ? 'ok' : v.nivel === 'warning' ? 'warning' : 'error'
  emit('update:validity', v)
}
</script>

<template>
  <div class="rfc-field">
    <label :for="inputId">{{ label }}</label>

    <div class="rfc-input" :class="[`is-${estadoUi.tone}`, { 'is-disabled': disabled }]">
      <input
        :id="inputId"
        v-model="rfc"
        class="input mono"
        type="text"
        maxlength="13"
        autocomplete="off"
        spellcheck="false"
        placeholder="PELJ8001019A1"
        :disabled="disabled"
        :aria-invalid="estado === 'error'"
        :aria-describedby="`${inputId}-msg`"
      />

      <span class="rfc-status" aria-hidden="true">
        <svg v-if="estadoUi.icon === 'spinner'" class="spinner" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3" opacity=".25" />
          <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
        </svg>
        <svg v-else-if="estadoUi.icon === 'check'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
        <svg v-else-if="estadoUi.icon === 'alert'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8v5M12 16h.01" /><circle cx="12" cy="12" r="9" /></svg>
        <svg v-else-if="estadoUi.icon === 'cross'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 9l-6 6M9 9l6 6" /><circle cx="12" cy="12" r="9" /></svg>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 11a4 4 0 100-8 4 4 0 000 8z" /><path d="M5 20a7 7 0 0114 0" /></svg>
      </span>
    </div>

    <div class="rfc-meta">
      <span class="rfc-count mono">{{ rfc.length }}/{{ longitudEsperada }}</span>
      <span v-if="formato.ok && formato.tipo !== 'generico'" class="rfc-kind">{{ formato.msg }}</span>
    </div>

    <p v-if="estado === 'idle'" class="hint">{{ hint || hintDinamico }}</p>
    <p v-else-if="resultado" :id="`${inputId}-msg`" class="msg" :class="`msg--${estadoUi.tone}`" role="status" aria-live="polite">
      {{ resultado.mensaje || estadoUi.texto }}
    </p>

    <button
      v-if="resultado?.campos?.length"
      type="button"
      class="link-btn"
      :aria-expanded="verComparativo"
      @click="verComparativo = !verComparativo"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18l6-6-6-6" /></svg>
      {{ verComparativo ? 'Ocultar comparativo CSF' : 'Ver comparativo con la CSF' }}
    </button>

    <table v-if="verComparativo && resultado?.campos?.length" class="csf-table">
      <thead>
        <tr><th>Campo</th><th>Capturado</th><th>En la CSF</th><th></th></tr>
      </thead>
      <tbody>
        <tr v-for="c in resultado.campos" :key="c.campo" :class="{ 'is-mismatch': !c.coincide }">
          <td>{{ c.campo }}</td>
          <td class="mono">{{ c.capturado }}</td>
          <td class="mono">{{ c.csf }}</td>
          <td class="cmp-state">
            <span v-if="c.coincide" class="cmp cmp--ok" title="Coincide">✓</span>
            <span v-else class="cmp cmp--ko" title="No coincide">✕</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.rfc-field { display: flex; flex-direction: column; gap: 6px; }
.rfc-field label { font-size: 13px; font-weight: 500; color: var(--text-soft); }

.rfc-input { position: relative; }
.rfc-input .input { padding-right: 44px; text-transform: uppercase; letter-spacing: .04em; }
.rfc-input.is-disabled .input { opacity: .6; cursor: not-allowed; }

.rfc-status {
  position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
  width: 22px; height: 22px; display: inline-flex; align-items: center; justify-content: center;
  color: var(--muted-2); pointer-events: none; transition: color var(--t-base);
}
.rfc-status svg { width: 20px; height: 20px; }
.is-ok .rfc-status { color: var(--success); }
.is-warning .rfc-status { color: var(--warning); }
.is-error .rfc-status { color: var(--danger); }
.is-checking .rfc-status { color: var(--brand-primary); }
.spinner { animation: rfc-spin .8s linear infinite; }
@keyframes rfc-spin { to { transform: rotate(360deg); } }

.rfc-meta { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.rfc-count { font-size: 11px; color: var(--muted-2); }
.rfc-kind { font-size: 11px; color: var(--muted); font-weight: 600; }

.hint { font-size: 12px; color: var(--muted); }
.msg { font-size: 12px; line-height: 1.45; display: flex; gap: 6px; }
.msg--ok { color: var(--success); }
.msg--warning { color: var(--warning); }
.msg--error { color: var(--danger); }

.link-btn {
  display: inline-flex; align-items: center; gap: 4px; align-self: flex-start;
  border: none; background: transparent; padding: 2px 0; cursor: pointer;
  font-size: 12px; font-weight: 600; color: var(--brand-primary);
}
.link-btn:hover { text-decoration: underline; }
.link-btn svg { width: 14px; height: 14px; transition: transform var(--t-fast); }
.link-btn[aria-expanded='true'] svg { transform: rotate(90deg); }

.csf-table {
  width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 12px;
  background: var(--control-bg); border: 1px solid var(--border); border-radius: 10px; overflow: hidden;
}
.csf-table th {
  text-align: left; padding: 8px 10px; font-size: 11px; font-weight: 600; color: var(--muted);
  text-transform: uppercase; letter-spacing: .04em; background: var(--bg-subtle);
}
.csf-table td { padding: 8px 10px; border-top: 1px solid var(--border); color: var(--text-soft); vertical-align: top; }
.csf-table tr.is-mismatch td { background: var(--danger-soft); color: var(--danger); }
.cmp-state { text-align: right; width: 28px; }
.cmp { display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; border-radius: 50%; font-size: 11px; font-weight: 700; }
.cmp--ok { background: var(--success-soft); color: var(--success); }
.cmp--ko { background: var(--danger-soft); color: var(--danger); }
</style>
