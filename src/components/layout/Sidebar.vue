<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import BrandMark from '@/components/ui/BrandMark.vue'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

const route = useRoute()
const auth = useAuthStore()
const ui = useUiStore()

const openGroup = ref('')

const icons = {
  dashboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/></svg>`,
  doc: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M9 13h6M9 17h4"/></svg>`,
  box: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4a2 2 0 001-1.73z"/><path d="M3.3 7l8.7 5 8.7-5M12 22V12"/></svg>`,
  cart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.7 13.4a2 2 0 002 1.6h9.7a2 2 0 002-1.6L23 6H6"/></svg>`,
  globe: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 010 20M12 2a15 15 0 000 20"/></svg>`,
  x: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 9l6 6"/></svg>`,
  settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1 1 0 00.2 1.1l.1.1a2 2 0 01-2.8 2.8l-.1-.1a1 1 0 00-1.1-.2 1 1 0 00-.6.9V20a2 2 0 01-4 0v-.1a1 1 0 00-.7-.9 1 1 0 00-1.1.2l-.1.1a2 2 0 01-2.8-2.8l.1-.1a1 1 0 00.2-1.1 1 1 0 00-.9-.6H4a2 2 0 010-4h.1a1 1 0 00.9-.7 1 1 0 00-.2-1.1l-.1-.1a2 2 0 012.8-2.8l.1.1a1 1 0 001.1.2h.1a1 1 0 00.6-.9V4a2 2 0 014 0v.1a1 1 0 00.6.9 1 1 0 001.1-.2l.1-.1a2 2 0 012.8 2.8l-.1.1a1 1 0 00-.2 1.1v.1a1 1 0 00.9.6H20a2 2 0 010 4h-.1a1 1 0 00-.9.6z"/></svg>`,
  users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>`,
  building: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/></svg>`,
  audit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="9"/></svg>`,
  palette: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a9 9 0 100 18h1.5a2.5 2.5 0 000-5H12a2 2 0 010-4h1a6 6 0 000-9z"/><circle cx="7.5" cy="10.5" r="1"/><circle cx="9.5" cy="7.5" r="1"/><circle cx="14.5" cy="7.5" r="1"/></svg>`,
  list: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>`,
  user: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20a8 8 0 0116 0"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>`
}

const menus = {
  admin: [
    { to: '/admin', label: 'Dashboard', icon: 'dashboard' },
    { to: '/admin/negocios', label: 'Negocios', icon: 'building' },
    { to: '/admin/usuarios', label: 'Usuarios', icon: 'users' },
    {
      key: 'operacion',
      label: 'Operación',
      icon: 'cart',
      children: [
        { to: '/negocio/facturas', label: 'Facturas', icon: 'doc' },
        { to: '/negocio/ventas', label: 'Tickets y ventas', icon: 'cart' },
        { to: '/negocio/productos', label: 'Productos', icon: 'box' },
        { to: '/negocio/factura-global', label: 'Factura global', icon: 'globe' },
        { to: '/negocio/cancelaciones', label: 'Cancelaciones', icon: 'x' },
        { to: '/negocio/config', label: 'Config. fiscal', icon: 'settings' },
      ]
    },
    {
      key: 'portal-cliente',
      label: 'Portal cliente',
      icon: 'user',
      children: [
        { to: '/cliente', label: 'Resumen', icon: 'dashboard' },
        { to: '/cliente/solicitar', label: 'Facturar', icon: 'plus' },
        { to: '/cliente/facturas', label: 'Mis facturas', icon: 'doc' },
        { to: '/cliente/cancelaciones', label: 'Cancelaciones', icon: 'x' },
        { to: '/cliente/datos', label: 'Mis datos', icon: 'user' },
      ]
    },
    {
      key: 'config-admin',
      label: 'Configuración',
      icon: 'settings',
      children: [
        { to: '/admin/negocios', label: 'Configuración de negocios', icon: 'building' },
      ]
    }
  ],
  negocio: [
    { to: '/negocio', label: 'Dashboard', icon: 'dashboard' },
    { to: '/negocio/facturas', label: 'Facturas', icon: 'doc' },
    { to: '/negocio/productos', label: 'Productos', icon: 'box' },
    { to: '/negocio/ventas', label: 'Ventas', icon: 'cart' },
    { to: '/negocio/factura-global', label: 'Factura global', icon: 'globe' },
    { to: '/negocio/cancelaciones', label: 'Cancelaciones', icon: 'x' },
    { to: '/negocio/config', label: 'Configuración', icon: 'settings' }
  ],
  cliente: [
    { to: '/cliente', label: 'Resumen', icon: 'dashboard' },
    { to: '/cliente/solicitar', label: 'Facturar', icon: 'plus' },
    { to: '/cliente/facturas', label: 'Mis facturas', icon: 'doc' },
    { to: '/cliente/cancelaciones', label: 'Cancelaciones', icon: 'x' },
    { to: '/cliente/datos', label: 'Mis datos', icon: 'user' }
  ]
}

const items = computed(() => menus[auth.role] || [])

function isActive(to) { return route.path === to }
function isGroupActive(item) { return item.children?.some(c => isActive(c.to)) }

function toggleGroup(key) {
  openGroup.value = openGroup.value === key ? '' : key
}

watch(() => route.path, () => {
  const group = items.value.find(i => i.children && isGroupActive(i))
  if (group) openGroup.value = group.key
}, { immediate: true })
</script>

<template>
  <Teleport to="body">
    <Transition name="sidebar-fade">
      <div v-if="ui.mobileNavOpen" class="sidebar-backdrop" @click="ui.closeMobileNav()"></div>
    </Transition>
  </Teleport>

  <aside class="sidebar" :class="{ collapsed: ui.sidebarCollapsed, 'is-open': ui.mobileNavOpen }">
    <div class="brand">
      <BrandMark :size="38" />
      <div v-if="!ui.sidebarCollapsed" class="brand-text">
        <span class="brand-name">Autofacturación</span>
        <span class="brand-sub">CFDI 4.0</span>
      </div>
      <button class="brand-close" type="button" aria-label="Cerrar menú" @click="ui.closeMobileNav()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
      </button>
    </div>

    <nav class="nav" aria-label="Navegación principal">
      <template v-for="item in items" :key="item.key || item.to">
        <div v-if="item.children" class="nav-group">
          <button
            type="button"
            class="nav-item nav-parent"
            :class="{ active: isGroupActive(item), open: openGroup === item.key }"
            @click="toggleGroup(item.key)"
            :aria-expanded="openGroup === item.key"
          >
            <span class="icon" v-html="icons[item.icon]" aria-hidden="true"></span>
            <span v-if="!ui.sidebarCollapsed" class="label">{{ item.label }}</span>
            <span v-if="!ui.sidebarCollapsed" class="chev" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>
            </span>
            <span v-if="ui.sidebarCollapsed" class="tooltip">{{ item.label }}</span>
          </button>
          <div class="submenu" :class="{ open: openGroup === item.key && !ui.sidebarCollapsed }">
            <div class="submenu-inner">
              <RouterLink
                v-for="child in item.children"
                :key="child.to"
                :to="child.to"
                class="sub-item"
                :class="{ active: isActive(child.to) }"
              >
                <span class="sub-dot" aria-hidden="true"></span>
                <span>{{ child.label }}</span>
              </RouterLink>
            </div>
          </div>
        </div>

        <RouterLink
          v-else
          :to="item.to"
          class="nav-item"
          :class="{ active: isActive(item.to) }"
        >
          <span class="active-bar" aria-hidden="true"></span>
          <span class="icon" v-html="icons[item.icon]" aria-hidden="true"></span>
          <span v-if="!ui.sidebarCollapsed" class="label">{{ item.label }}</span>
          <span v-if="ui.sidebarCollapsed" class="tooltip">{{ item.label }}</span>
        </RouterLink>
      </template>
    </nav>

    <button class="collapse-btn" type="button" @click="ui.toggleSidebar()" :aria-label="ui.sidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <path v-if="ui.sidebarCollapsed" d="M9 6l6 6-6 6" />
        <path v-else d="M15 6l-6 6 6 6" />
      </svg>
    </button>
  </aside>
</template>

<style scoped>
.sidebar {
  position: relative;
  height: 100%;
  width: 260px;
  padding: 18px 14px;
  display: flex; flex-direction: column; gap: 18px;
  background: var(--glass-panel);
  backdrop-filter: var(--blur-panel);
  -webkit-backdrop-filter: var(--blur-panel);
  border-right: 1px solid var(--glass-line);
  box-shadow: 4px 0 24px rgba(17,24,39,0.05);
  transition: background-color .35s ease, border-color .35s ease;
  transition: width .3s cubic-bezier(.4,0,.2,1), padding .3s cubic-bezier(.4,0,.2,1), transform .28s cubic-bezier(.4,0,.2,1);
  z-index: 30;
  overflow: hidden;
  font-family: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif;
}
.sidebar.collapsed { width: 80px; padding: 18px 10px; }

.brand-close {
  display: none;
  margin-left: auto;
  width: 32px; height: 32px; border-radius: 9px;
  border: 1px solid var(--control-border); background: var(--control-bg);
  color: var(--muted); cursor: pointer;
  align-items: center; justify-content: center;
}
.brand-close svg { width: 16px; height: 16px; }
.brand-close:hover { color: var(--text); background: var(--control-hover-bg); }

.brand { display: flex; align-items: center; gap: 12px; padding: 4px 6px; }
.brand-text { display: flex; flex-direction: column; line-height: 1.1; }
.brand-name { font-size: 16px; font-weight: 700; color: var(--text); }
.brand-sub { font-size: 12px; color: var(--muted); font-weight: 500; }

.nav { display: flex; flex-direction: column; gap: 6px; flex: 1; overflow-y: auto; overflow-x: visible; padding: 4px 0; }
.nav-item, .sub-item {
  position: relative;
  display: flex; align-items: center; gap: 12px;
  width: 100%; padding: 10px 12px;
  border-radius: 12px;
  color: var(--text-soft); font-size: 15px; font-weight: 500;
  text-decoration: none; border: none; background: transparent;
  cursor: pointer; transition: all .2s ease;
}
.sidebar.collapsed .nav-item { justify-content: center; padding: 10px; }
.nav-item:hover { background: var(--brand-primary-soft); color: var(--text); }
.nav-item.active { background: var(--brand-primary-soft); color: var(--brand-ink); font-weight: 600; }

.icon { width: 20px; height: 20px; flex-shrink: 0; display: inline-flex; color: inherit; transition: transform .25s cubic-bezier(.34,1.56,.64,1); }
.icon :deep(svg) { width: 20px; height: 20px; }
.nav-item:hover .icon { transform: scale(1.1); }
.label { white-space: nowrap; }

.active-bar {
  position: absolute; left: 0; top: 50%; transform: translateY(-50%) scaleY(0);
  width: 3px; height: 60%; border-radius: 0 4px 4px 0; background: var(--brand-primary);
  transition: transform .2s ease; transform-origin: center;
}
.nav-item.active .active-bar { transform: translateY(-50%) scaleY(1); }
.sidebar.collapsed .active-bar { display: none; }

.nav-parent .chev { margin-left: auto; width: 16px; height: 16px; color: #9CA3AF; transition: transform .25s ease; }
.nav-parent .chev :deep(svg) { width: 16px; height: 16px; }
.nav-parent.open .chev { transform: rotate(180deg); }

.submenu {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows .3s cubic-bezier(.4,0,.2,1);
}
.submenu.open { grid-template-rows: 1fr; }
.submenu-inner { overflow: hidden; display: flex; flex-direction: column; gap: 2px; padding-left: 8px; }
.sub-item { padding: 9px 12px 9px 36px; font-size: 14px; color: var(--muted); border-radius: 10px; }
.sub-item:hover { color: var(--text); background: var(--brand-primary-soft); }
.sub-item.active { color: var(--brand-ink); background: var(--brand-primary-soft); font-weight: 600; }
.sub-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; opacity: .5; }

.tooltip {
  position: absolute; left: calc(100% + 10px); top: 50%; transform: translateY(-50%) translateX(4px);
  background: var(--text); color: var(--surface); font-size: 13px; font-weight: 600;
  padding: 6px 10px; border-radius: 8px; white-space: nowrap;
  opacity: 0; pointer-events: none; transition: all .18s ease;
  box-shadow: 0 8px 20px rgba(0,0,0,0.18); z-index: 50;
}
.tooltip::before {
  content: ""; position: absolute; left: -4px; top: 50%; transform: translateY(-50%) rotate(45deg);
  width: 8px; height: 8px; background: var(--text);
}
.sidebar.collapsed .nav-item:hover .tooltip { opacity: 1; transform: translateY(-50%) translateX(0); }

.collapse-btn {
  margin-top: auto; align-self: flex-start;
  width: 36px; height: 36px; border-radius: 10px;
  border: 1px solid var(--control-border); background: var(--control-bg);
  color: var(--muted); display: inline-flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all .2s ease;
}
.sidebar.collapsed .collapse-btn { align-self: center; }
.collapse-btn:hover { background: var(--control-hover-bg); color: var(--text); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
.collapse-btn:active { transform: scale(0.96); }
.collapse-btn svg { width: 18px; height: 18px; }

.nav::-webkit-scrollbar { width: 4px; }
.nav::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 4px; }

@media (max-width: 1024px) {
  /* El sidebar pasa a drawer: fuera de pantalla, se abre con el botón del topbar */
  .sidebar {
    position: fixed;
    top: 0; left: 0; bottom: 0;
    z-index: 120;
    width: 280px;
    height: 100vh;
    height: 100dvh;
    transform: translateX(-100%);
    background: var(--glass-panel-strong);
    box-shadow: 12px 0 40px rgba(15, 23, 42, .28);
    border-right: 1px solid var(--glass-line);
  }
  .sidebar.collapsed { width: 280px; padding: 18px 14px; }
  .sidebar.is-open { transform: translateX(0); }
  .brand-close { display: inline-flex; }
  .collapse-btn { display: none; }
}

.sidebar-backdrop {
  position: fixed;
  inset: 0;
  z-index: 110;
  background: var(--overlay);
  backdrop-filter: var(--blur-soft);
  -webkit-backdrop-filter: var(--blur-soft);
}
.sidebar-fade-enter-active, .sidebar-fade-leave-active { transition: opacity .25s ease; }
.sidebar-fade-enter-from, .sidebar-fade-leave-to { opacity: 0; }
</style>
