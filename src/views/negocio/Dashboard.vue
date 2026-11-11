<script setup>
import { ref, onMounted, computed } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import ScopeBanner from '@/components/ui/ScopeBanner.vue'
import StatCard from '@/components/ui/StatCard.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { useAuthStore } from '@/stores/auth'
import { useFacturasStore } from '@/stores/facturas'
import { formatMoney, formatDate } from '@/utils/formatters'

const auth = useAuthStore()
const facturas = useFacturasStore()
const negId = computed(() => auth.user?.negocioId)
const activeTab = ref('resumen')

onMounted(() => facturas.fetch({ negocioId: negId.value }))

const vigentes = computed(() => facturas.items.filter(f => f.estado === 'vigente'))
const hoy = new Date().toISOString().slice(0, 10)
const ventasHoy = computed(() => vigentes.value.filter(f => (f.fecha || '').slice(0, 10) === hoy).reduce((s, f) => s + Number(f.total || 0), 0))
const ventasMes = computed(() => vigentes.value.reduce((s, f) => s + Number(f.total || 0), 0))
const ticketProm = computed(() => vigentes.value.length ? ventasMes.value / vigentes.value.length : 0)
const recientes = computed(() => [...facturas.items].sort((a,b) => (b.fecha||'').localeCompare(a.fecha||'')).slice(0, 6))
</script>

<template>
  <AppLayout>
    <ScopeBanner />
    <div class="page-header">
      <div>
        <h1 class="page-title">Dashboard</h1>
        <p class="page-subtitle">Resumen de ventas y facturación de tu negocio</p>
      </div>
      <router-link to="/negocio/facturas" class="btn btn-primary">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
        Nueva factura
      </router-link>
    </div>

    <div class="tabs">
      <button class="tab" :class="{ active: activeTab === 'resumen' }" @click="activeTab = 'resumen'">Resumen</button>
      <button class="tab" :class="{ active: activeTab === 'actividad' }" @click="activeTab = 'actividad'">Actividad reciente</button>
      <button class="tab" :class="{ active: activeTab === 'pendientes' }" @click="activeTab = 'pendientes'">Pendientes</button>
    </div>

    <div v-if="activeTab === 'resumen'" class="tab-panel">
      <div class="grid kpi-grid section-block">
        <StatCard label="Ventas de hoy" :value="formatMoney(ventasHoy)" delta="+ Actualizado en tiempo real" tone="brand">
          <template #icon>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </template>
        </StatCard>
        <StatCard label="Ventas del mes" :value="formatMoney(ventasMes)" tone="cyan">
          <template #icon>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </template>
        </StatCard>
        <StatCard label="Ticket promedio" :value="formatMoney(ticketProm)" tone="purple">
          <template #icon>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 9h8M8 13h5" stroke-linecap="round"/></svg>
          </template>
        </StatCard>
        <StatCard label="Facturas vigentes" :value="vigentes.length" tone="coral">
          <template #icon>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 12l2 2 4-4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="9"/></svg>
          </template>
        </StatCard>
      </div>

      <div class="card">
        <div class="card-header">
          <div>
            <h3 style="font-size:16px;font-weight:600">Últimas facturas</h3>
            <p class="text-muted" style="font-size:13px;margin-top:2px">Movimientos recientes del negocio</p>
          </div>
          <router-link to="/negocio/facturas" class="btn btn-secondary btn-sm">Ver todas</router-link>
        </div>
        <div v-if="!recientes.length">
          <EmptyState title="Aún no hay facturas" description="Cuando emitas tu primer CFDI aparecerá aquí el resumen de actividad.">
            <router-link to="/negocio/facturas" class="btn btn-primary btn-sm">Emitir factura</router-link>
          </EmptyState>
        </div>
        <div v-else class="table-wrap" style="border:none;border-radius:0">
          <table class="table">
            <thead><tr><th>Folio</th><th>Receptor</th><th>Fecha</th><th>Estado</th><th class="text-right">Total</th></tr></thead>
            <tbody>
              <tr v-for="f in recientes" :key="f.id">
                <td><div class="cell-main mono">{{ f.serie }}-{{ f.folio }}</div><div class="cell-sub">{{ f.tipo || f.tipoComprobante }}</div></td>
                <td>{{ f.receptor?.nombre || '—' }}</td>
                <td class="text-muted">{{ formatDate(f.fecha) }}</td>
                <td><span class="badge" :class="f.estado==='vigente'?'badge-success':f.estado==='cancelada'?'badge-danger':'badge-warning'">{{ f.estado?.replace('_',' ') }}</span></td>
                <td class="text-right" style="font-weight:600">{{ formatMoney(f.total) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-else-if="activeTab === 'actividad'" class="tab-panel">
      <div class="card">
        <div v-if="!facturas.items.length">
          <EmptyState title="Sin actividad registrada" description="Las facturas emitidas y sus cambios de estado se mostrarán en esta sección." />
        </div>
        <div v-else class="table-wrap" style="border:none;border-radius:0">
          <table class="table">
            <thead><tr><th>Evento</th><th>Folio</th><th>Receptor</th><th>Fecha</th><th class="text-right">Monto</th></tr></thead>
            <tbody>
              <tr v-for="f in facturas.items.slice(0,10)" :key="f.id">
                <td><span class="badge" :class="f.estado==='vigente'?'badge-success':f.estado==='cancelada'?'badge-danger':'badge-warning'">{{ f.estado==='cancelada'?'CFDI cancelado':f.estado==='pendiente_cancelacion'?'Solicitud pendiente':'CFDI emitido' }}</span></td>
                <td class="mono">{{ f.serie }}-{{ f.folio }}</td>
                <td>{{ f.receptor?.nombre || '—' }}</td>
                <td class="text-muted">{{ formatDate(f.fecha) }}</td>
                <td class="text-right">{{ formatMoney(f.total) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-else class="tab-panel">
      <div class="card">
        <EmptyState v-if="!facturas.items.some(f=>f.estado==='pendiente_cancelacion')" title="No hay pendientes" description="Las solicitudes de cancelación y tareas por atender aparecerán aquí.">
          <template #icon>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 12l2 2 4-4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="9"/></svg>
          </template>
        </EmptyState>
        <div v-else class="table-wrap" style="border:none;border-radius:0">
          <table class="table">
            <thead><tr><th>Folio</th><th>Motivo</th><th>Fecha solicitud</th><th></th></tr></thead>
            <tbody>
              <tr v-for="f in facturas.items.filter(x=>x.estado==='pendiente_cancelacion')" :key="f.id">
                <td class="mono">{{ f.serie }}-{{ f.folio }}</td>
                <td>{{ f.cancelacion?.motivo || '—' }}</td>
                <td class="text-muted">{{ formatDate(f.cancelacion?.fecha) }}</td>
                <td class="text-right"><router-link to="/negocio/cancelaciones" class="btn btn-secondary btn-sm">Revisar</router-link></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
