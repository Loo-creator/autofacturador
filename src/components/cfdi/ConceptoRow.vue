<script setup>
import { CLAVES_UNIDAD, CLAVES_PRODSERV } from '@/utils/satCatalogs'
import SelectField from '@/components/ui/SelectField.vue'
const props = defineProps({ modelValue: Object, index: Number })
const emit = defineEmits(['update:modelValue', 'remove'])
function update(field, val) { emit('update:modelValue', { ...props.modelValue, [field]: val }) }
</script>

<template>
  <div class="concepto-row">
    <div class="form-grid">
      <div class="field">
        <label>Clave Prod/Serv</label>
        <SelectField :value="modelValue.claveProdServ" @change="update('claveProdServ', $event)">
          <option v-for="c in CLAVES_PRODSERV" :key="c.id" :value="c.id">{{ c.id }} - {{ c.nombre }}</option>
        </SelectField>
      </div>
      <div class="field">
        <label>Clave Unidad</label>
        <SelectField :value="modelValue.claveUnidad" @change="update('claveUnidad', $event)">
          <option v-for="c in CLAVES_UNIDAD" :key="c.id" :value="c.id">{{ c.id }} - {{ c.nombre }}</option>
        </SelectField>
      </div>
      <div class="field span-2">
        <label>Descripción</label>
        <input class="input" :value="modelValue.descripcion" @input="update('descripcion', $event.target.value)" placeholder="Descripción del concepto" />
      </div>
      <div class="field">
        <label>Cantidad</label>
        <input class="input" type="number" min="0" step="0.01" :value="modelValue.cantidad" @input="update('cantidad', Number($event.target.value))" />
      </div>
      <div class="field">
        <label>Valor unitario</label>
        <input class="input" type="number" min="0" step="0.01" :value="modelValue.valorUnitario" @input="update('valorUnitario', Number($event.target.value))" />
      </div>
      <div class="field">
        <label>Descuento</label>
        <input class="input" type="number" min="0" step="0.01" :value="modelValue.descuento" @input="update('descuento', Number($event.target.value))" />
      </div>
      <div class="field">
        <label>IVA %</label>
        <input class="input" type="number" min="0" step="1" :value="modelValue.iva" @input="update('iva', Number($event.target.value))" />
      </div>
    </div>
    <div style="margin-top:8px; text-align:right">
      <button type="button" class="btn btn-ghost btn-sm" @click="emit('remove')" v-if="index > 0">Quitar concepto</button>
    </div>
    <div class="divider"></div>
  </div>
</template>
