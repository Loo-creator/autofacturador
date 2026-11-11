# Autofacturación

[![Deploy to GitHub Pages](https://github.com/actions/workflows/deploy.yml/badge.svg)](https://github.com/<TU_USUARIO>/<TU_REPO>/actions/workflows/deploy.yml)

Portal de autofacturación **CFDI 4.0** (SPA) construido con **Vue 3 (Composition API + `<script setup>`)**, **Vite**, **Pinia** y **Vue Router**. UI en CSS puro con identidad **coral + morado**.

## Publicar en GitHub Pages

El proyecto ya viene preparado para desplegarse como **sitio estático** en GitHub Pages
(Vite + rutas relativas, sin servidor).

**1. Sube el código a un repositorio** (rama `main`):

```bash
git init
git add .
git commit -m "Autofacturación CFDI 4.0"
git branch -M main
git remote add origin https://github.com/<TU_USUARIO>/<TU_REPO>.git
git push -u origin main
```

**2. Activa GitHub Pages** en el repo:
`Settings → Pages → Source → *GitHub Actions*`.

**3. Listo.** Cada `push` a `main` despliega automáticamente (workflow
`.github/workflows/deploy.yml`) y la app queda en:

```
https://<TU_USUARIO>.github.io/<TU_REPO>/
```

> **Rutas relativas:** `vite.config.js` usa `base: './'` y el router `createWebHistory(import.meta.env.BASE_URL)`,
> por eso funciona igual en la raíz del dominio (`usuario.github.io`) que en un subpath
> (`usuario.github.io/repo/`). No hay que cambiar nada al publicar.

**Despliegue manual** (sin Actions):

```bash
npm run build
npx gh-pages -d dist      # o: npm i -D gh-pages && npx gh-pages -d dist
```

**Nota**: los datos son **mock en `localStorage`** (cliente). Todo funciona sin backend;
para conectar una API real, pon `VITE_USE_MOCKS=false` y `VITE_API_BASE_URL` en `.env`.

## Requisitos y ejecución

```bash
npm install
npm run dev
```

Build de producción:

```bash
npm run build
npm run preview
```

## Credenciales demo

| Rol | Correo | Contraseña | Acceso |
|---|---|---|---|
| Admin | `admin@autofacturacion.mx` | `admin123` | `/admin` |
| Negocio | `negocio@demo.mx` | `negocio123` | `/negocio` (Negocio 1) |
| Cliente | `cliente@demo.mx` | `cliente123` | `/cliente` |

> El correo del admin también responde a `admin@Autofacturación.mx` (la comparación de correo
> ignora acentos y mayúsculas). En la pantalla de login hay botones **“Entrar como …”** de un clic
> y un botón **“Reparar datos de demostración”** que reconstruye la base local si el navegador
> conserva una DB de una versión anterior del mock (donde admin/negocio no existían).

También disponible:
- **Facturar sin registrarse** (`/facturar-express`): **una sola pantalla** con el folio del ticket + los datos fiscales y la vista previa del CFDI en vivo → emite y descarga XML/PDF.
- **Crear cuenta** (`/registro`): wizard en 3 pasos (datos personales, fiscales CFDI 4.0 con validación RFC/CP, negocio).

> Tip: el flujo express trae chips de folios de prueba. `2001` = ticket válido, `2005` = ya facturado,
> `2004` = expirado (45 días), `2102` = mes de compra cerrado, `9999` = folio inexistente.
> RFC de prueba con CSF: `PELJ8001019A1` (Juan Pérez López) · `GARM850215AB2` (María García Ruiz).

## Arquitectura

```
src/
├── main.js, App.vue
├── router/           # Guards por rol (admin/negocio/cliente)
├── stores/           # Pinia: auth, negocios, clientes, facturas, productos, ui
├── mocks/            # Datos semilla + dbSeed (con migración) + api.mock (localStorage)
├── services/         # Capa única de datos (HOY mocks, MAÑANA APIs reales, misma firma)
├── composables/      # useAuth, useCfdi, useToast, useTheme, useTicket, useEmision, useMediaQuery
├── components/
│   ├── ui/           # BaseModal, DataTable, FilterBar, ContentView, FilterToolbar,
│   │                 # FilterDrawer, ActionMenu, FacturaAcciones, SelectField,
│   │                 # StatCard, StatusBadge, Toast, InlineBanner, EmptyState
│   ├── layout/       # AppLayout (grid principal), Sidebar, TopbarNav
│   └── cfdi/         # FormFactura, ConceptoRow, ResumenTotales, CancelacionModal,
│                     # FacturaGlobalWizard, ValidacionRfcInput, TicketStatusCard, VistaPreviaCfdi
├── views/
│   ├── auth/         # Login, RegisterWizard, FacturarExpress
│   ├── admin/        # Dashboard, Negocios, Usuarios
│   ├── negocio/      # Dashboard, Productos, Ventas, Facturas, Cancelaciones, FacturaGlobal, ConfigFiscal
│   └── cliente/      # Portal, MisFacturas, Solicitar, Cancelaciones, DatosFiscales
├── styles/           # tokens.css, base.css, components.css
└── utils/            # formatters, satCatalogs, rfcValidator, cfdiGenerator,
                      # ticketPolicy, csfValidator
```

### Select propio (`ui/SelectField.vue`)

El `<select>` nativo no se puede estilizar: la lista la dibuja el sistema operativo, el anillo
de foco se duplica con el estado `:focus` y el color de marca aparece a la vez en el texto y
en el borde. `SelectField.vue` reemplaza **los 31 selects de la app** por un listbox propio:

- La lista se pinta con el sistema de diseño (**Teleport al body**, `position: fixed`) → nunca
  la recorta un contenedor con `overflow: hidden`.
- **Un solo indicador de foco** (borde + halo suave, sin `outline` duplicado).
- El texto del campo conserva su color; sólo la opción seleccionada usa la tinta de marca.
- **Teclado completo**: flechas, `Home`/`End`, `Enter`/Espacio, `Escape`, `Tab` y búsqueda
  opcional. `role="combobox"`/`listbox`, `aria-expanded`, `aria-selected`.
- Si no hay espacio debajo, la lista **se voltea hacia arriba**.

```html
<SelectField v-model="form.regimen">
  <option v-for="r in REGIMENES" :key="r.id" :value="r.id">{{ r.id }} - {{ r.nombre }}</option>
</SelectField>
```

También acepta la prop `options` (`[{ value, label }]`) y emite `change` con **el valor**
(no con el evento nativo).

- Prop `flush`: el trigger no dibuja borde, fondo ni chevron → se integra en un contenedor que
  ya los aporta (evita el "doble borde" de la barra de filtros).
- La lista nunca se ve reducida: **mínimo 200px de alto y 220px de ancho**, máximo 360px, con
  scroll si hay más opciones.
- El indicador de foco es **único**: los inputs dentro de un control con borde no repiten el
  halo (`.fb-input:focus { box-shadow: none !important }`), así no se ve borde + halo + borde.

## Sistema de layout (AppLayout)

El layout es un **CSS Grid de dos columnas** con la regla de oro: la columna de contenido
ocupa el 100% del ancho y alto disponible a la derecha del sidebar, sin espacios muertos.

```
.app-layout              grid-template-columns: var(--sidebar-w) minmax(0, 1fr)
                         height: 100dvh · overflow: hidden
.app-layout__main        grid-template-rows: auto minmax(0, 1fr)
.app-layout__content     overflow-y: auto · padding: 32px · background: var(--app-bg)
.app-layout__inner       width: 100% · max-width: 1600px · margin: 0 auto
```

- El scroll vive **dentro** de la columna de contenido (la topbar queda fija, no hay doble scrollbar).
- El ancho se limita a 1600px sólo en ultra-wide; en pantallas normales ocupa el 100%.
- El colapso del sidebar (260px ⇄ 80px) transiciona `grid-template-columns` en 300ms.
- **Móvil (≤1024px):** el sidebar pasa a drawer (overlay + backdrop) y se abre con el botón
  hamburguesa del topbar. Contenido al 100% con padding 16px.

### Barra de filtros (`ui/FilterBar.vue`)

Barra horizontal única, full-width, glass (`blur(12px)` + borde luminoso), con **CSS Grid**
`2fr 1fr 1fr 2fr 1fr auto` y gap 16px. Campos: Búsqueda/UUID, Tipo de CFDI, Estatus,
Rango de fechas (desde/hasta) y Monto, más el botón "Buscar" sólido de 48px.

Usa **Container Queries** (`container-type: inline-size`), por lo que reacciona al ancho real
del contenido y no al de la ventana: al colapsar el sidebar, la barra vuelve a una sola fila.

Los labels y los campos son configurables por vista (`tipo-label`, `estatus-label`,
`fecha-label`, `monto-label`, `show-tipo`, `show-estatus`, `show-fechas`, `show-monto`) y la
rejilla se recalcula sola (`--fb-cols`) para que nunca queden huecos. Ejemplos:

### Sección del cliente

El cliente se recorre desde el **sidebar** (5 entradas) y cada vista tiene sus propias
sub-pestañas donde lo necesita:

| Sección | Ruta | Contenido |
|---|---|---|
| Resumen | `/cliente` | KPIs, últimos comprobantes y accesos directos |
| Facturar | `/cliente/solicitar` | Alta de factura por folio de ticket |
| Mis facturas | `/cliente/facturas` | Historial con filtros, estado y descarga |
| Cancelaciones | `/cliente/cancelaciones` | Solicitudes y estatus |
| Mis datos | `/cliente/datos` | Datos fiscales, correo y contraseña (sub-pestañas) |

**Dentro de "Mis datos"** hay sub-pestañas para que cada acción quede ordenada y sin
mezclas: *Datos fiscales* (identificación + domicilio, con validación contra la CSF),
*Correo* y *Contraseña*. El componente `AccountSecurity` acepta la prop `solo`
(`'correo' | 'contrasena' | 'todo'`) para poder mostrarse por separado. La pestaña
*Seguridad* del negocio usa las mismas sub-pestañas.

### Menú "Opciones" en todas las tablas

Cada tabla con acciones usa el mismo menú (`ui/ActionMenu.vue`), con iconos, descripción
por opción y agrupación por sección:

| Tabla | Opciones |
|---|---|
| **Facturas** (negocio/admin) | Descargar XML · Descargar PDF · Enviar por correo · Solicitar cancelación |
| **Mis facturas** (cliente) | Descargar XML · Descargar PDF · Enviar por correo |
| **Usuarios** (admin) | Editar usuario · Suspender/Reactivar acceso · Ver detalle |
| **Negocios** (admin) | Editar · Suspender/Reactivar · Ver detalle · Eliminar |
| **Productos** (negocio) | Editar · Activar/Desactivar · Eliminar |
| **Tickets/Ventas** (negocio) | Ver detalle · Recordar al cliente · Exportar |

Las acciones de **editar** y **suspender** son reales (persisten en la base mock):
`saveCliente` hace upsert tanto en `clientes` como en `usuarios`, y `toggleUsuarioActivo`
activa/suspende el acceso de cualquier usuario.

### Estados y acciones en las tablas

`components/ui/StatusBadge.vue` da el color de cada estado (vigente, cancelada, pendiente,
aprobada, rechazada, por facturar, expirado, mes cerrado, factura global…) y se usa en
Facturas, Mis facturas, Ventas, Cancelaciones y Auditoría.

`components/ui/FacturaAcciones.vue` agrupa las acciones del comprobante en un menú
**"Opciones"**: descargar **XML**, descargar **PDF**, **enviar por correo** y **solicitar
cancelación** (sólo habilitada en CFDI vigentes, y abre el modal con el motivo SAT).

El menú (`components/ui/ActionMenu.vue`) es una lista flotante con el diseño del sistema:
se posiciona con `fixed` (no la recorta ningún contenedor), se voltea si no hay espacio,
agrupa las opciones por sección y es navegable con teclado (flechas, `Enter`, `Escape`, `Tab`).
El admin y el negocio usan la misma vista de Facturas, así que ambos tienen las 4 acciones.

| Vista | Campos |
|---|---|
| `negocio/Facturas` | Búsqueda/UUID · Tipo de CFDI · Estatus · Rango de fechas · Monto |
| `negocio/Ventas` | Búsqueda/Folio · Forma de pago · Estado del ticket · Fecha de compra · Monto |
| `negocio/FacturaGlobal` | Búsqueda/Folio · Periodicidad · Estado del CFDI · Fecha de emisión · Monto consolidado |
| `negocio/Cancelaciones` | Búsqueda/Folio · Motivo SAT · Estatus de la solicitud · Fecha de solicitud · Monto |
| `cliente/Cancelaciones` | Búsqueda/Folio · Motivo de la solicitud · Estado del comprobante · Fecha de emisión · Monto |

### Factura global

`negocio/FacturaGlobal` lista las consolidaciones ya emitidas (con filtros y vista tabla/cards) y
permite generar una nueva mediante el wizard:

1. **Periodo**: rango de fechas (desde/hasta) + periodicidad + mes/año que se informan.
2. **Consolidación**: tickets reales del negocio **dentro del rango y aún disponibles** (los ya
   facturados o consolidados se muestran aparte como informativo).
3. **Timbrado**: CFDI global con RFC genérico `XAXX010101000`.

Al timbrar, los folios consolidados se **bloquean** (`bloquearTicketsPorGlobal`): ya no pueden
facturarse de forma individual, tal como ocurre al cerrar el mes en Liverpool.

### Temas de color y contraseña (Configuración)

- **Apariencia**: modo claro/oscuro + color de marca. Hay 7 paletas predefinidas y un selector
  de color libre; el accent se aplica **en vivo** a las variables CSS del sistema de diseño
  (`--brand-primary`, `--brand-primary-hover`, `--brand-primary-soft`, `--accent*`) y se persiste
  en `localStorage` (`ff_accent`, `ff_theme`). También se guarda en `negocios.branding.accent`
  para el white-label por negocio.
- **Contraseña**: exige la contraseña actual, valida mínimo 6 caracteres y confirma la nueva.
  El cambio se aplica sobre el usuario en la base mock y entra en vigor en el siguiente ingreso.

| Ancho del contenedor | Layout |
|---|---|
| > 1120px | 6 columnas (1 fila) |
| ≤ 1120px | 2 columnas (2 filas) |
| ≤ 620px | 1 columna, controles táctiles, botón a 100% |

### Resultados (`ui/ContentView.vue`)

Alterna entre **tabla** (`table-layout: auto`, 100% de ancho) y **cards**
(`repeat(auto-fill, minmax(280px, 1fr))`, gap 24px, altura uniforme). En ≤768px la tabla
se convierte automáticamente en cards apiladas. La preferencia del usuario se persiste en
`localStorage` (`ff_content_view`).

## Mocks ↔ APIs reales

- **Todas** las operaciones de datos pasan por `src/services/*.service.js` y retornan `Promise<{ ok, data, error }>`.
- Cada función incluye JSDoc `@future` con el endpoint real esperado (ej. `GET /api/v1/negocios/:id/facturas`).
- Los services consumen `src/mocks/*` y `api.mock.js` (latencia simulada + persistencia en `localStorage` clave `Autofacturación_db_v1`).
- Variables de entorno (`.env`):
  - `VITE_USE_MOCKS=true|false` (bandera prevista para alternar implementación)
  - `VITE_API_BASE_URL=/api/v1`
- **Para migrar a APIs reales:** reimplementar las funciones en `services/` usando `fetch/axios` contra `VITE_API_BASE_URL` manteniendo la misma firma y contrato `{ ok, data, error }`. Los stores/componentes no requieren cambios.

## Datos semilla

- 3 negocios genéricos: Negocio 1, Negocio 2, Negocio 3 (nombres y logos parametrizables).
- 5 clientes (incluye público en general `XAXX010101000`).
- 20 productos/servicios con claves SAT, unidad, IVA e IEPS.
- 30 facturas históricas en estados: vigente, cancelada, pendiente de cancelación, y tipos variados (ingreso, egreso, pago, traslado, nómina, global, etc.).
- **12 tickets de venta** (`mocks/tickets.mock.js`) con fecha relativa a hoy, para que el demo nunca caduque.
- **6 constancias de situación fiscal** (`mocks/csf.mock.js`), incluido un caso de homonimia y uno de CSF suspendida.

## Módulo de tickets y validación fiscal (nuevo)

Comportamiento alineado con los portales reales (Walmart, Coppel, Soriana, Liverpool):

| Concepto | Regla implementada | Dónde |
|---|---|---|
| Ventana de facturación | 30 días naturales por defecto, configurable por negocio | `utils/ticketPolicy.js` |
| Mismo mes de compra | El negocio puede exigirlo (`politicaFacturacion.exigeMismoMes`) | `negocios.mock.js` |
| Folio ya consumido | Un ticket = un CFDI; el segundo intento se rechaza (`TICKET_ALREADY_INVOICED`) | `services/factura.service.js` |
| Cierre de mes | Los folios consolidados en factura global quedan bloqueados | `ticket.service.bloquearTicketsPorGlobal` |
| Coincidencia con CSF | RFC, Razón Social, CP y Régimen deben coincidir; detecta homonimia y CSF desactualizada | `utils/csfValidator.js` |

Estados de ticket: `disponible`, `facturado`, `expirado`, `mes_cerrado`, `facturado_global`, `no_encontrado`.
Códigos de error: `TICKET_NOT_FOUND`, `TICKET_ALREADY_INVOICED`, `TICKET_EXPIRED`, `MONTH_CLOSED`, `TICKET_BLOCKED`.

### Notas de persistencia

- La semilla de la base mock vive en un único lugar (`mocks/dbSeed.js`). Antes cada servicio definía la suya y
  se pisaban entre sí (una carga `clientes: []` borraba el catálogo de clientes).
- `ensureDb()` **migra** la base persistida en cada acceso: repone los usuarios demo (admin/negocio) si
  faltan, reconstruye colecciones vacías y **no pisa** las facturas/auditoría del usuario.
  Esto evita que un `localStorage` viejo deje al admin y al negocio sin poder ingresar.
- Al timbrar, la factura y el estado del ticket se guardan en una sola escritura de `localStorage`
  (evita el "lost update" entre servicios).

## Módulo CFDI 4.0

Tipos/casos soportados en UI y mocks:
- **A. Ingreso (I)** estándar con usos CFDI G01,G03,D01,D10,P01,S01,CP01.
- **B. Factura global** (RFC genérico XAXX010101000, periodicidad diaria/semanal/mensual/bimestral, consolidación).
- **C. Egreso / Nota de crédito (E)** con CFDI relacionado.
- **D. Complemento de Pago (REP, P/PPD)**.
- **E. Traslado (T)**.
- **F. Nómina (N)** mock (percepciones/deducciones).
- **G–K.** Casos específicos: educativo (D10, 86121500), arrendamiento, honorarios (retenciones ISR/IVA), gastos médicos (D01, 85121800), transporte/fletes (Carta Porte simplificada).
- **L. Cancelación** motivos SAT 01–04 con flujo solicitud (cliente) → aprobación/rechazo (negocio) → acuse mock.
- **M/N.** Sustitución y reexpedición vía `CfdiRelacionados` (tipos relación 01–04).

Campos CFDI 4.0 contemplados: Emisor/Receptor (RFC, régimen, CP), Conceptos (ClaveProdServ, ClaveUnidad, Cantidad, Descripción, ValorUnitario, Importe, Descuento, ObjetoImp, Impuestos), Totales, Moneda, TipoCambio, FormaPago, MétodoPago, CondicionesDePago, Exportación, InformaciónGlobal, CfdiRelacionados.

Validaciones: RFC (moral/física/genérico por regex), CP (5 dígitos), correo, compatibilidad
régimen/uso CFDI, montos y conceptos.

### Reglas fiscales del SAT (`utils/cfdiValidations.js`)

El flujo de facturación aplica las mismas reglas que el SAT/PAC valida al timbrar:

| Regla | Ejemplo de rechazo |
|---|---|
| El **RFC determina el tipo de persona** | RFC de 13 (física) con régimen 601 (moral) |
| El **régimen corresponde al tipo** | Persona moral → sólo 601 y 603; persona física → 605, 612, 616, 620, 626 |
| El **uso de CFDI está permitido** para el régimen | `D01` (honorarios médicos) en un moral; `S01` en el 612; `I01` sólo en moral; `CP01`/`CN01` sólo en el 605 |
| El **RFC genérico/estanjero** sólo en factura global | `XAXX010101000` en una factura normal → rechazado |
| La **razón social** es coherente | RFC de persona moral con "SA de CV" ausente; RFC físico con "SA de CV" |
| **CP y correo** obligatorios y con formato válido | El correo es donde se recibe el comprobante |

Además, el formulario **filtra las opciones**: el régimen sólo ofrece los que corresponden al
tipo de persona del RFC y el uso de CFDI sólo los permitidos por ese régimen. Los errores se
muestran junto al campo y **bloquean la emisión** con el motivo exacto.

### Consulta de CSF (como el CSAT del SAT)

La verificación contra la Constancia de Situación Fiscal sigue el comportamiento del SAT:

| Caso | Resultado |
|---|---|
| RFC en el catálogo de demostración | Compara campo por campo (razón social, CP, régimen) y detecta homonimia |
| RFC con estructura válida **fuera del catálogo** | **No bloquea**: avisa que no se pudo verificar, conserva los datos capturados y sugiere el régimen según el tipo de persona |
| RFC con estructura inválida | Error de formato (12 moral / 13 física) |

El catálogo (`mocks/csf.mock.js`) trae 9 constancias de ejemplo, incluidas personas morales,
personas físicas, regímenes RES, un caso de homonimia y uno de CSF suspendida.

Además: **validación en tiempo real contra la Constancia de Situación Fiscal** (RFC, Razón Social, CP y Régimen),
con comparativo campo por campo, detección de homonimia y aviso de CSF con más de 60 días.

## Descargas

- **XML CFDI 4.0 (mock)**: generado con estructura SAT simplificada (Comprobante/Emisor/Receptor/Conceptos/Impuestos/TimbreFiscalDigital).
- **PDF simulado**: representación impresa en texto formateado descargable como Blob (sin dependencias externas).

> Ambos son simulados para demostración; no tienen validez fiscal ni timbrado real.

## Verificación

El proyecto trae un arnés de pruebas que corre en Node (sin navegador) usando
`@vue/server-renderer` + el compilador de Vue:

- **Smoke test**: renderiza las **21 vistas** y captura los *warnings* de Vue (0 esperados).
- **Análisis estático con el compilador**: el template compilado expone `_ctx.X` para todo lo
  que **no** está en el scope del `<script setup>`. Comparando contra las props declaradas se
  detectan referencias no definidas (el bug `buscar is not defined` era de esta clase).
- **Auditoría de props**: Vue **ignora en silencio** las props que no existen, así que un
  `:show-monto` mal escrito deja de filtrar sin avisar. El auditor compara cada `:prop` y cada
  `@event` contra las props/emits declarados por el componente.
- Verifica además que las rutas del menú existan en el router, que los accesos a store sean
  válidos y que no haya imports sin usar.

```bash
npm run build            # compila
# las pruebas se ejecutan bundlando el arnés con vite (build SSR) y ejecutándolo con node
```

## Certificados CSD

La pestaña **Configuración → Certificados CSD** gestiona los 3 elementos que exige el SAT
para firmar, y funciona en dos modos:

- **Ver**: número de certificado, emisor, archivos `.cer` y `.key` registrados, estado
  (activa / por vencer / vencido / sin certificado), barra de progreso de la vigencia y
  días restantes. La contraseña se muestra enmascarada con un botón *Ver/Ocultar*.
- **Registrar**: los 3 campos (**.cer**, **.key** y **contraseña de la llave privada**),
  con drag & drop, validación de extensión, nombre/tamaño del archivo y botón para quitarlo.

La contraseña **nunca se guarda en texto plano**: sólo se registra que está definida
(`passwordDefinida`), igual que en los PAC. El certificado se persiste en
`negocios.certificado`.

### Contraste y hovers por tema

El modo oscuro invierte la luminancia de la marca (`--brand-primary` pasa de índigo oscuro a
índigo claro), por lo que el texto blanco sobre superficies de marca **desaparecía**. Se
resolved con tokens de contraste:

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `--accent-contrast` | `#FFFFFF` | `#0B0F14` | texto sobre fondos sólidos de marca |
| `--danger-contrast` | `#FFFFFF` | `#0B0F14` | texto sobre fondo de peligro |
| `--brand-ink` | `#4F46E5` | `#A5B4FC` | texto de marca sobre fondos suaves |

Todos los hovers (pills, chips, sidebar, botones, scrollbars) usan esos tokens en vez de
colores fijos, así que **cambian con el tema**. Además, en el login cada rol tiene un color
vívido (degradados, puntos) y una **tinta accesible** para texto e iconos (`--role-ink`),
porque el coral `#FB923C` sobre blanco no alcanzaba el contraste mínimo.

## Datos fiscales y seguridad de la cuenta

`cliente/datos` reparte la información en **3 bloques** (no una rejilla plana):

| Bloque | Contenido |
|---|---|
| **Identificación fiscal** | RFC con **validación en vivo contra la CSF** (con comparativo campo por campo) + nombre/razón social, con badge de estado *Verificado / Con observaciones / No coincide* |
| **Domicilio fiscal** | Código postal, régimen fiscal, teléfono y correo (sólo lectura: se cambia en Seguridad) |
| **Seguridad de la cuenta** | Cambio de correo y cambio de contraseña |

- El RFC usa `ValidacionRfcInput`, el mismo componente que valida contra la Constancia de
  Situación Fiscal en el flujo express → los datos no pueden quedar inconsistentes.
- El admin y el negocio **no emiten CFDI como receptor**, así que la vista se adapta y les
  muestra sólo la sección de seguridad (el negocio configura los datos del emisor en
  Configuración).

### `ui/AccountSecurity.vue`

Panel reutilizable (lo usan el cliente y la pestaña *Seguridad* del negocio) con:

- **Cambiar correo**: correo actual (lectura), nuevo, confirmar y contraseña actual para
  confirmar la identidad. Valida formato, unicidad y que no sea el mismo.
- **Cambiar contraseña**: actual, nueva y confirmar, con **medidor de fuerza** (longitud,
  mayúsculas/minúsculas, dígitos y símbolos) y requisitos mínimos (6+ caracteres, letras
  y números).

Al cambiar el correo, el usuario en sesión se actualiza al instante (`auth.setUser`) y el
correo nuevo queda activo para el siguiente ingreso.

El rol **admin tiene acceso total**: el guard del router le permite entrar a cualquier ruta
(admin, negocio y cliente) y el sidebar le muestra todas las secciones agrupadas:

- **Plataforma**: Dashboard · Negocios · Usuarios
- **Operación**: Facturas · Tickets y ventas · Productos · Factura global · Cancelaciones · Config. fiscal
- **Portal cliente**: Mi portal · Mis facturas · Solicitar factura · Cancelaciones · Mis datos
- **Configuración**: configuración de negocios

Cuando el admin no tiene negocio asignado, las vistas de negocio muestran **todos** los
registros (con un aviso `ScopeBanner`) y la Configuración ofrece un **selector de negocio**.
Las vistas de cliente dejan de filtrar por RFC (`auth.rfcPropio === null` para el admin), así
que el admin ve el comprobante de cualquier cliente.

## Diseño

- **Identidad única: coral + morado.** No hay sistema de temas ni selector de paletas: la paleta
  es fija y todos los degradados van de coral a morado.
  - `--brand-primary: #FB923C` (coral vivo) para todo lo interactivo, con **texto blanco**.
  - `--grad-brand` y `--grad-cta`: `#FB923C → #C084FC` (coral → morado) para el logo, las
    barras, los botones de acción y las líneas de los campos.
  - Halos, sombras y focus rings en coral: la app es 100% coral + morado, sin restos de índigo.
- Tipografía ampliada: escala base de 17px, títulos de 30px y espaciado mayor en tarjetas y
  secciones, para leer sin forzar el zoom del navegador.
- **Degradados y figuras decorativas** por token (`--grad-*`, `--blob-*`, `--shape-*`) con la
  misma identidad coral/morado; el modo oscuro los hace más luminosos.
- Todas las superficies transicionan en 350ms, así que el cambio de tema se ve como una
  metamorfosis progresiva y no como un salto.
- **Un solo tema (claro)**: no hay selector de tema; la app usa exclusivamente el modo claro.
- Modo oscuro completo: todos los componentes usan tokens (`--surface`, `--control-bg`,
  `--badge-*-bg`, `--glass-panel`…), sin colores claros hardcodeados.
  **Sin velos**: los paneles de auth no usan `backdrop-filter` (difuminar las figuras detrás es
  justo lo que el ojo lee como "bruma"), el fondo de la app y el hero no llevan gradientes a
  pantalla completa y las manchas de color se pintan con `radial-gradient` en vez de `filter: blur()`
  (un círculo difuminado a 46px es humo, no una figura).
- **Pocos degradados**: sólo quedan los funcionales (shimmer de carga, track del slider) y el
  ambiente del fondo. El logo, el favicon, los botones, el switch de tema, las líneas de los
  campos y las barras de progreso son **coral sólido**.
- **Login/Registro**: las figuras animadas ocupan la **izquierda** y el formulario la
  **derecha** (grid `1fr 1fr`). El fondo animado vive en `App.vue` (`components/auth/AuthBackdrop.vue`),
  así que **no se desmonta** al ir de /login a /registro: las figuras siguen moviéndose y la
  transición entre ambas se siente continua ("transión mágica": slide + blur + fade).
  El panel del form ocupa todo el alto (`100dvh`) y el formulario reparte los campos en el
  espacio sobrante; si la ventana es muy baja, el panel scrollea.
  **El movimiento es aleatorio**: en cada carga se sortea para cada figura su duración
  (3.2–7s), su fase inicial y la amplitud de su recorrido (`--ax` / `--ay`), así que las
  9 figuras nunca repiten el mismo patrón.
- **Jerarquía de botones**: el primario usa el **color vivo del rol** (coral/naranja) con
  tinta oscura (contraste 8.3:1), ancho completo, 56px y con icono; los secundarios son
  outline que se rellenan al hover; el acceso rápido son 3 botones con icono, color del rol y
  su correo (entran con un clic).
- El fondo animado es `position: fixed` (para que no se reinicie al navegar) pero **su contenido
  se confina a la mitad izquierda**, así que el hero y las figuras nunca se enciman con el
  formulario de la derecha. En móvil el hero se oculta y los blobs se atenúan.
- **Las figuras decorativas se mueven de verdad** y son **lo único que se mueve**: 3 blobs que
  derivan, rotan y escalan (>100px por ciclo, 5–7s) + **6 formas** (semicírculo, triángulo, anillo,
  puntos, cuadro y arco; 4–9s). Recorren **toda la pantalla** del login (izquierda y derecha) y
  pasan por detrás del formulario. El hero, la nota de cristal y el badge quedan quietos.
  Todo con `translate3d` + `will-change` (GPU) y respetando `prefers-reduced-motion`.
- CSS puro (sin frameworks de utilidades), componentes con estados y transiciones 150–200ms,
  responsive 640/768/1024/1280.

## Notas

- Persistencia mock en `localStorage`: para reiniciar datos borra la clave `Autofacturación_db_v1` desde DevTools.
- Sin dependencias de UI externas; iconografía SVG/textual inline.
- Proyecto listo para `npm install && npm run dev` sin errores.
