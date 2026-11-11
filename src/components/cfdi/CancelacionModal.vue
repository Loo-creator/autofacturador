<script setup>
import { ref } from 'vue'
import SelectField from '@/components/ui/SelectField.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import { MOTIVOS_CANCELACION } from '@/utils/satCatalogs'

const props = defineProps({ open: Boolean, factura: Object })
const emit = defineEmits(['close', 'submit'])
const motivo = ref('02')
const uuidRelacionado = ref('')

function submit() {
  emit('submit', { motivo: motivo.value, uuidRelacionado: motivo.value === '01' ? uuidRelacionado.value : '' })
}
</script>

<template>
  <BaseModal :open="open" title="Solicitar cancelación CFDI" @close="emit('close')">
    <div class="field">
      <label>Motivo SAT</label>
      <SelectField v-model="motivo">
        <option v-for="m in MOTIVOS_CANCELACION" :key="m.id" :value="m.id">{{ m.id }} - {{ m.nombre }}</option>
      </SelectField>
    </div>
    <div v-if="motivo === '01'" class="field" style="margin-top:12px">
      <label>UUID relacionado (sustitución)</label>
      <input class="input" v-model="uuidRelacionado" placeholder="XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX" />
      <div class="hint">Obligatorio cuando el motivo es 01.</div>
    </div>
    <div class="hint" style="margin-top:12px">La solicitud será enviada al negocio para aprobación y registro de acuse (mock).</div>
    <template #footer>
      <button class="btn btn-secondary" @click="emit('close')">Cancelar</button>
      <button class="btn btn-danger" @click="submit">Enviar solicitud</button>
    </template>
  </BaseModal>
</template>
