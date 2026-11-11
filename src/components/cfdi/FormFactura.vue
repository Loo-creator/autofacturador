<script setup>
import { reactive, computed, watch } from 'vue'
import SelectField from '@/components/ui/SelectField.vue'
import ConceptoRow from './ConceptoRow.vue'
import ResumenTotales from './ResumenTotales.vue'
import { REGIMENES, USOS_CFDI, FORMAS_PAGO, METODOS_PAGO, MONEDAS, TIPOS_RELACION } from '@/utils/satCatalogs'
import { useCfdi } from '@/composables/useCfdi'

const props = defineProps({
  initial: { type: Object, default: () => ({}) },
  tipo: { type: String, default: 'INGRESO' }, // INGRESO, EGRESO, PAGO, TRASLADO, NOMINA, GLOBAL, HONORARIOS, etc.
  readonlyEmisor: { type: Boolean, default: false }
})
const emit = defineEmits(['submit'])
const { errors, validate, nuevoConcepto, compute } = useCfdi()

const form = reactive({
  tipo: props.tipo,
  tipoComprobante: props.initial.tipoComprobante || (props.tipo === 'EGRESO' ? 'E' : props.tipo === 'PAGO' ? 'P' : props.tipo === 'TRASLADO' ? 'T' : props.tipo === 'NOMINA' ? 'N' : 'I'),
  usoCfdi: props.initial.usoCfdi || (props.tipo === 'PAGO' ? 'CP01' : props.tipo === 'NOMINA' ? 'CN01' : 'G03'),
  formaPago: props.initial.formaPago || '03',
  metodoPago: props.initial.metodoPago || 'PUE',
  moneda: props.initial.moneda || 'MXN',
  tipoCambio: props.initial.tipoCambio || 1,
  exportacion: '01',
  condicionesDePago: '',
  emisor: props.initial.emisor || { rfc: '', nombre: '', regimen: '601', cp: '' },
  receptor: props.initial.receptor || { rfc: '', nombre: '', regimen: '616', cp: '' },
  conceptos: props.initial.conceptos || [nuevoConcepto()],
  tipoRelacion: props.initial.tipoRelacion || '',
  cfdiRelacionados: props.initial.cfdiRelacionados || [],
  uuidRelacionadoInput: '',
  // Campos específicos
  periodicidad: props.initial.periodicidad || '04',
  meses: props.initial.meses || '01',
  anio: props.initial.anio || String(new Date().getFullYear()),
  complementoPago: { fechaPago: '', formaPago: '03', monto: 0, doctoRelacionado: '' },
  nomina: { percepciones: 0, deducciones: 0 },
  cartaPorte: { origen: '', destino: '', distancia: 0 }
})

watch(() => form.moneda, (m) => { const cur = MONEDAS.find(x => x.id === m); form.tipoCambio = cur ? cur.tipoCambio : 1 })

const totales = computed(() => compute(form.conceptos))
function addConcepto() { form.conceptos.push(nuevoConcepto()) }
function removeConcepto(i) { form.conceptos.splice(i, 1) }
function updateConcepto(i, val) { form.conceptos[i] = val }

function submit() {
  const payload = { ...form, ...totales.value }
  if (form.tipoRelacion && form.uuidRelacionadoInput) payload.cfdiRelacionados = [form.uuidRelacionadoInput]
  if (!validate(payload)) return
  emit('submit', payload)
}
</script>

<template>
  <form @submit.prevent="submit" class="grid" style="gap: var(--sp-5)">
    <div v-if="errors.length" class="card" style="border-color: var(--danger)">
      <div class="card-body">
        <strong class="text-danger">Corrige los siguientes errores:</strong>
        <ul style="margin-top:8px; padding-left:18px; list-style:disc; color:var(--danger); font-size:var(--fs-sm)">
          <li v-for="e in errors" :key="e">{{ e }}</li>
        </ul>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><h3>Datos generales</h3></div>
      <div class="card-body form-grid">
        <div class="field">
          <label>Tipo</label>
          <input class="input" :value="tipo" disabled />
        </div>
        <div class="field">
          <label>Uso CFDI</label>
          <SelectField v-model="form.usoCfdi">
            <option v-for="u in USOS_CFDI" :key="u.id" :value="u.id">{{ u.id }} - {{ u.nombre }}</option>
          </SelectField>
        </div>
        <div class="field">
          <label>Forma de pago</label>
          <SelectField v-model="form.formaPago">
            <option v-for="f in FORMAS_PAGO" :key="f.id" :value="f.id">{{ f.id }} - {{ f.nombre }}</option>
          </SelectField>
        </div>
        <div class="field">
          <label>Método de pago</label>
          <SelectField v-model="form.metodoPago">
            <option v-for="m in METODOS_PAGO" :key="m.id" :value="m.id">{{ m.id }} - {{ m.nombre }}</option>
          </SelectField>
        </div>
        <div class="field">
          <label>Moneda</label>
          <SelectField v-model="form.moneda">
            <option v-for="m in MONEDAS" :key="m.id" :value="m.id">{{ m.id }} - {{ m.nombre }}</option>
          </SelectField>
        </div>
        <div class="field">
          <label>Tipo de cambio</label>
          <input class="input" type="number" step="0.01" v-model.number="form.tipoCambio" />
        </div>
        <div class="field span-2">
          <label>Condiciones de pago</label>
          <input class="input" v-model="form.condicionesDePago" placeholder="Opcional" />
        </div>
      </div>
    </div>

    <div class="card" v-if="tipo === 'GLOBAL'">
      <div class="card-header"><h3>Información global</h3></div>
      <div class="card-body form-grid">
        <div class="field"><label>Periodicidad</label><SelectField v-model="form.periodicidad"><option value="01">Diaria</option><option value="02">Semanal</option><option value="04">Mensual</option><option value="05">Bimestral</option></SelectField></div>
        <div class="field"><label>Mes</label><input class="input" v-model="form.meses" placeholder="01-12" /></div>
        <div class="field"><label>Año</label><input class="input" v-model="form.anio" /></div>
      </div>
    </div>

    <div class="card" v-if="tipo === 'PAGO'">
      <div class="card-header"><h3>Complemento de Pago (REP)</h3></div>
      <div class="card-body form-grid">
        <div class="field"><label>Fecha de pago</label><input class="input" type="date" v-model="form.complementoPago.fechaPago" /></div>
        <div class="field"><label>Monto</label><input class="input" type="number" step="0.01" v-model.number="form.complementoPago.monto" /></div>
        <div class="field span-2"><label>UUID docto. relacionado</label><input class="input mono" v-model="form.complementoPago.doctoRelacionado" /></div>
      </div>
    </div>

    <div class="card" v-if="tipo === 'NOMINA'">
      <div class="card-header"><h3>Nómina (mock)</h3></div>
      <div class="card-body form-grid">
        <div class="field"><label>Percepciones</label><input class="input" type="number" step="0.01" v-model.number="form.nomina.percepciones" /></div>
        <div class="field"><label>Deducciones</label><input class="input" type="number" step="0.01" v-model.number="form.nomina.deducciones" /></div>
      </div>
    </div>

    <div class="card" v-if="tipo === 'TRANSPORTE'">
      <div class="card-header"><h3>Carta Porte (simplificada)</h3></div>
      <div class="card-body form-grid">
        <div class="field"><label>Origen</label><input class="input" v-model="form.cartaPorte.origen" /></div>
        <div class="field"><label>Destino</label><input class="input" v-model="form.cartaPorte.destino" /></div>
        <div class="field"><label>Distancia (km)</label><input class="input" type="number" v-model.number="form.cartaPorte.distancia" /></div>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><h3>Emisor</h3></div>
      <div class="card-body form-grid">
        <div class="field"><label>RFC</label><input class="input" v-model="form.emisor.rfc" :disabled="readonlyEmisor" /></div>
        <div class="field"><label>Nombre / Razón social</label><input class="input" v-model="form.emisor.nombre" :disabled="readonlyEmisor" /></div>
        <div class="field"><label>Régimen fiscal</label><SelectField v-model="form.emisor.regimen" :disabled="readonlyEmisor"><option v-for="r in REGIMENES" :key="r.id" :value="r.id">{{ r.id }} - {{ r.nombre }}</option></SelectField></div>
        <div class="field"><label>CP</label><input class="input" v-model="form.emisor.cp" :disabled="readonlyEmisor" /></div>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><h3>Receptor</h3></div>
      <div class="card-body form-grid">
        <div class="field"><label>RFC</label><input class="input" v-model="form.receptor.rfc" /></div>
        <div class="field"><label>Nombre / Razón social</label><input class="input" v-model="form.receptor.nombre" /></div>
        <div class="field"><label>Régimen fiscal</label><SelectField v-model="form.receptor.regimen"><option v-for="r in REGIMENES" :key="r.id" :value="r.id">{{ r.id }} - {{ r.nombre }}</option></SelectField></div>
        <div class="field"><label>CP domicilio fiscal</label><input class="input" v-model="form.receptor.cp" /></div>
      </div>
    </div>

    <div class="card" v-if="['INGRESO','EGRESO','GLOBAL','HONORARIOS','ARRENDAMIENTO','EDUCACION','MEDICO','TRANSPORTE'].includes(tipo)">
      <div class="card-header"><h3>CFDI relacionados (opcional)</h3></div>
      <div class="card-body form-grid">
        <div class="field"><label>Tipo relación</label><SelectField v-model="form.tipoRelacion"><option value="">Ninguna</option><option v-for="t in TIPOS_RELACION" :key="t.id" :value="t.id">{{ t.id }} - {{ t.nombre }}</option></SelectField></div>
        <div class="field"><label>UUID relacionado</label><input class="input mono" v-model="form.uuidRelacionadoInput" placeholder="UUID del CFDI previo" /></div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <h3>Conceptos</h3>
        <button type="button" class="btn btn-secondary btn-sm" @click="addConcepto">Agregar concepto</button>
      </div>
      <div class="card-body">
        <ConceptoRow v-for="(c, i) in form.conceptos" :key="i" :model-value="c" :index="i" @update:modelValue="val => updateConcepto(i, val)" @remove="removeConcepto(i)" />
      </div>
    </div>

    <ResumenTotales :conceptos="form.conceptos" :moneda="form.moneda" />

    <div style="display:flex; justify-content:flex-end; gap:8px">
      <slot name="actions" />
      <button type="submit" class="btn btn-primary">Timbrar CFDI (mock)</button>
    </div>
  </form>
</template>
