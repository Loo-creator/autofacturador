import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// Auth
import Login from '@/views/auth/Login.vue'
import RegisterWizard from '@/views/auth/RegisterWizard.vue'
import FacturarExpress from '@/views/auth/FacturarExpress.vue'

// Admin
import AdminDashboard from '@/views/admin/Dashboard.vue'
import AdminNegocios from '@/views/admin/Negocios.vue'
import AdminUsuarios from '@/views/admin/Usuarios.vue'

// Negocio
import NegocioDashboard from '@/views/negocio/Dashboard.vue'
import NegocioProductos from '@/views/negocio/Productos.vue'
import NegocioVentas from '@/views/negocio/Ventas.vue'
import NegocioFacturas from '@/views/negocio/Facturas.vue'
import NegocioFacturaGlobal from '@/views/negocio/FacturaGlobal.vue'
import NegocioCancelaciones from '@/views/negocio/Cancelaciones.vue'
import NegocioConfig from '@/views/negocio/ConfigFiscal.vue'

// Cliente
import ClientePortal from '@/views/cliente/Portal.vue'
import ClienteMisFacturas from '@/views/cliente/MisFacturas.vue'
import ClienteSolicitar from '@/views/cliente/Solicitar.vue'
import ClienteCancelaciones from '@/views/cliente/Cancelaciones.vue'
import ClienteDatos from '@/views/cliente/DatosFiscales.vue'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'login', component: Login, meta: { public: true } },
  { path: '/registro', name: 'registro', component: RegisterWizard, meta: { public: true } },
  { path: '/facturar-express', name: 'express', component: FacturarExpress, meta: { public: true } },

  { path: '/admin', component: AdminDashboard, meta: { role: 'admin' } },
  { path: '/admin/negocios', component: AdminNegocios, meta: { role: 'admin' } },
  { path: '/admin/usuarios', component: AdminUsuarios, meta: { role: 'admin' } },

  { path: '/negocio', component: NegocioDashboard, meta: { role: 'negocio' } },
  { path: '/negocio/productos', component: NegocioProductos, meta: { role: 'negocio' } },
  { path: '/negocio/ventas', component: NegocioVentas, meta: { role: 'negocio' } },
  { path: '/negocio/facturas', component: NegocioFacturas, meta: { role: 'negocio' } },
  { path: '/negocio/factura-global', component: NegocioFacturaGlobal, meta: { role: 'negocio' } },
  { path: '/negocio/cancelaciones', component: NegocioCancelaciones, meta: { role: 'negocio' } },
  { path: '/negocio/config', component: NegocioConfig, meta: { role: 'negocio' } },

  { path: '/cliente', component: ClientePortal, meta: { role: 'cliente' } },
  { path: '/cliente/facturas', component: ClienteMisFacturas, meta: { role: 'cliente' } },
  { path: '/cliente/solicitar', component: ClienteSolicitar, meta: { role: 'cliente' } },
  { path: '/cliente/cancelaciones', component: ClienteCancelaciones, meta: { role: 'cliente' } },
  { path: '/cliente/datos', component: ClienteDatos, meta: { role: 'cliente' } },

  { path: '/:pathMatch(.*)*', redirect: '/login' }
]

const router = createRouter({
  // Hash history funciona con `base: './'` tanto en la raíz como en un subpath
  // de GitHub Pages (donde createWebHistory recibiría la base inválida '/.').
  history: createWebHashHistory(),
  routes,
  scrollBehavior() { return { top: 0 } }
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.public) {
    if (auth.isAuthenticated && to.path === '/login') {
      const home = auth.role === 'admin' ? '/admin' : auth.role === 'negocio' ? '/negocio' : '/cliente'
      return home
    }
    return true
  }
  if (!auth.isAuthenticated) return { path: '/login', query: { redirect: to.fullPath } }

  // El administrador tiene acceso total: puede ver todas las secciones
  // (admin, negocio y cliente) sin restricciones de rol.
  if (auth.role === 'admin') return true

  if (to.meta.role && to.meta.role !== auth.role) {
    const home = auth.role === 'negocio' ? '/negocio' : '/cliente'
    return home
  }
  return true
})

export default router
