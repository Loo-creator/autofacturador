import { ref } from 'vue'
import { calcTotales, uuidV4 } from '@/utils/formatters'
import { validarRFC, validarCP, validarRegimenUso, validarMontos } from '@/services/cfdi.validator'

export function useCfdi() {
  const errors = ref([])
  function compute(conceptos) { return calcTotales(conceptos) }
  function validate(factura) {
    const errs = []
    const e = factura.emisor || {}
    const r = factura.receptor || {}
    if (!validarRFC(e.rfc).ok) errs.push('RFC emisor inválido')
    if (!validarCP(e.cp).ok) errs.push('CP emisor inválido')
    if (!validarRFC(r.rfc).ok) errs.push('RFC receptor inválido')
    if (!validarCP(r.cp).ok) errs.push('CP receptor inválido')
    const ru = validarRegimenUso(r.regimen, factura.usoCfdi)
    if (!ru.ok) errs.push(ru.msg)
    const vm = validarMontos(factura.conceptos || [])
    if (!vm.ok) errs.push(vm.msg)
    errors.value = errs
    return errs.length === 0
  }
  function nuevoConcepto() {
    return { claveProdServ: '01010101', claveUnidad: 'H87', unidad: 'Pieza', cantidad: 1, descripcion: '', valorUnitario: 0, descuento: 0, iva: 16, ieps: 0, retIva: 0, retIsr: 0, objetoImp: '02' }
  }
  return { errors, compute, validate, nuevoConcepto, uuidV4 }
}
