<script setup>
/**
 * Portal del cliente → pestaña "Resumen".
 *
 * Muestra el estado de la cuenta ( KPIs) , los últimos comprobantes y accesos
 * directos a las otras acciones, que viven en las pestañas de arriba.
 */
import { ref, onMounted, computed } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import StatCard from '@/components/ui/StatCard.vue'
import StatusBadge from '@/components/ui/StatusBadge.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { useAuthStore } from '@/stores/auth'
import { useFacturasStore } from '@/stores/facturas'
import { formatMoney, formatDate, downloadBlob } from '@/utils/formatters'
import { descargarXML, descargarPDF } from '@/services/factura.service'

const auth = useAuthStore()
const store = useFacturasStore()
const cargando = ref(true)

onMounted(async () => {
  await store.fetch()
  cargando.value = false
})

const mias = computed(() => store.items.filter(f => !auth.rfcPropio || f.receptor?.rfc === auth.rfcPropio))

const kpi = computed(() => {
  const list = mias.value
  const vigentes = list.filter(f => f.estado === 'vigente')
  return {
    total: list.length,
    vigentes: vigentes.length,
    pendientes: list.filter(f => f.estado === 'pendiente_cancelacion').length,
    monto: vigentes.reduce((s, f) => s + Number(f.total || 0), 0),
  }
})

const recientes = computed(() =>
  [...mias.value].sort((a, b) => String(b.fecha).localeCompare(String(a.fecha))).slice(0, 6)
)

const ultimosTickets = computed(() =>
  [...mias.value].sort((a, b) => String(b.fecha).localeCompare(String(a.fecha))).slice(0, 3)
)

async function xml(id) { const r = await descargarXML(id); if (r.ok) downloadBlob(r.data.content, r.data.filename, 'application/xml') }
async function pdf(id) { const r = await descargarPDF(id); if (r.ok) downloadBlob(r.data.blob, r.data.filename, 'application/pdf') }
</script>

<template>
  <AppLayout>

    <div class="page-header">
      <div>
        <h1 class="page-title">Mi portal</h1>
        <p class="page-subtitle">Resumen de tus comprobantes y datos fiscales</p>
      </div>
      <router-link to="/cliente/solicitar" class="btn btn-primary">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>
        Facturar un ticket
      </router-link>
    </div>

    <div class="grid kpi-grid section-block">
      <StatCard label="Comprobantes" :value="kpi.total" tone="brand" />
      <StatCard label="Vigentes" :value="kpi.vigentes" tone="cyan" />
      <StatCard label="En trámite" :value="kpi.pendientes" tone="coral" />
      <StatCard label="Monto vigente" :value="formatMoney(kpi.monto)" tone="purple" />
    </div>

    <div class="grid portal-grid">
      <!-- Últimos comprobantes -->
      <section class="card">
        <header class="card-header">
          <div>
            <h3 class="card-title">Últimos comprobantes</h3>
            <p class="card-sub">Los CFDI más recientes emitidos a tu nombre</p>
          </div>
          <router-link to="/cliente/facturas" class="btn btn-secondary btn-sm">Ver todos</router-link>
        </header>

        <div v-if="!recientes.length && !cargando" class="card-body">
          <EmptyState
            title="Todavía no tienes comprobantes"
            description="Cuando factures un ticket, aquí verás tus CFDI listos para descargar."
          >
            <router-link to="/cliente/solicitar" class="btn btn-primary btn-sm">Facturar mi primer ticket</router-link>
          </EmptyState>
        </div>

        <div v-else class="table-wrap" style="border:none;border-radius:0">
          <table class="table">
            <thead>
              <tr><th>Folio</th><th>Emisor</th><th>Fecha</th><th>Estado</th><th class="text-right">Total</th><th></th></tr>
            </thead>
            <tbody>
              <tr v-for="f in recientes" :key="f.id">
                <td><span class="cell-main mono">{{ f.serie }}-{{ f.folio }}</span></td>
                <td>{{ f.emisor?.nombre || '—' }}</td>
                <td class="text-muted">{{ formatDate(f.fecha) }}</td>
                <td><StatusBadge :status="f.estado" /></td>
                <td class="text-right" style="font-weight:600">{{ formatMoney(f.total) }}</td>
                <td class="text-right">
                  <div style="display:flex;gap:4px;justify-content:flex-end">
                    <button class="btn btn-ghost btn-sm" @click="xml(f.id)">XML</button>
                    <button class="btn btn-ghost btn-sm" @click="pdf(f.id)">PDF</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Accesos rápidos -->
      <div class="grid" style="gap:20px;align-content:start">
        <section class="card">
          <header class="card-header"><h3 class="card-title">Acciones</h3></header>
          <div class="card-body grid" style="gap:10px">
            <router-link to="/cliente/solicitar" class="action">
              <span class="action__icon action__icon--brand">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>
              </span>
              <span class="action__text">
                <strong>Facturar un ticket</strong>
                <span>Emite tu CFDI 4.0 en segundos</span>
              </span>
            </router-link>

            <router-link to="/cliente/facturas" class="action">
              <span class="action__icon action__icon--cyan">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h4" /></svg>
              </span>
              <span class="action__text">
                <strong>Mis facturas</strong>
                <span>Historial y descarga de XML y PDF</span>
              </span>
            </router-link>

            <router-link to="/cliente/cancelaciones" class="action">
              <span class="action__icon action__icon--coral">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 9l6 6" /></svg>
              </span>
              <span class="action__text">
                <strong>Cancelaciones</strong>
                <span>Solicita o revisa el estatus de una cancelación</span>
              </span>
            </router-link>

            <router-link to="/cliente/datos" class="action">
              <span class="action__icon action__icon--purple">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20a8 8 0 0116 0" /></svg>
              </span>
              <span class="action__text">
                <strong>Mis datos fiscales</strong>
                <span>RFC, régimen, código postal y contraseña</span>
              </span>
            </router-link>
          </div>
        </section>

        <section v-if="ultimosTickets.length" class="card">
          <header class="card-header"><h3 class="card-title">Tus últimas compras</h3></header>
          <div class="card-body grid" style="gap:10px">
            <div v-for="f in ultimosTickets" :key="f.id" class="mini">
              <div class="mini__head">
                <span class="mono mini__folio">{{ f.serie }}-{{ f.folio }}</span>
                <span class="mini__total">{{ formatMoney(f.total) }}</span>
              </div>
              <span class="mini__text">{{ f.emisor?.nombre }} · {{ formatDate(f.fecha) }}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  </AppLayout>
</template>

<style scoped>
.portal-grid { grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr); align-items: start; }
@media (max-width: 1100px) { .portal-grid { grid-template-columns: minmax(0, 1fr); } }

.card-title { margin: 0; font-size: 16px; font-weight: 600; color: var(--text); }
.card-sub { margin: 3px 0 0; font-size: 13px; color: var(--muted); }

.action {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 14px; border-radius: 12px; text-decoration: none;
  border: 1px solid var(--border); background: var(--surface);
  transition: all .2s ease;
}
.action:hover { border-color: var(--brand-primary); background: var(--brand-primary-soft); transform: translateX(2px); }
.action__icon {
  width: 38px; height: 38px; border-radius: 11px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
}
.action__icon svg { width: 19px; height: 19px; }
.action__icon--brand { background: var(--brand-primary-soft); color: var(--brand-ink); }
.action__icon--cyan { background: rgba(103, 232, 249, .16); color: #0891B2; }
.action__icon--coral { background: rgba(251, 146, 60, .16); color: #C2410C; }
.action__icon--purple { background: rgba(192, 132, 252, .16); color: #7E22CE; }
.action__text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.action__text strong { font-size: 14px; font-weight: 600; color: var(--text); }
.action__text span { font-size: 12.5px; color: var(--muted); }

.mini {
  padding: 10px 12px; border-radius: 10px;
  background: var(--bg-subtle); border: 1px solid var(--border);
}
.mini__head { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
.mini__folio { font-size: 13px; font-weight: 600; color: var(--text); }
.mini__total { font-size: 13px; font-weight: 600; color: var(--brand-ink); }
.mini__text { display: block; margin-top: 2px; font-size: 12px; color: var(--muted); }
</style>
