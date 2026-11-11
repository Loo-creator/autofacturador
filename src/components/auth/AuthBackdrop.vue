<script setup>
/**
 * Fondo animado de las páginas de autenticación (login y registro).
 *
 * Vive en App.vue, NO dentro de cada vista: así, al navegar de /login a /registro
 * el componente no se desmonta, las figuras siguen moviéndose y la transición
 * se siente continua ("transición mágica").
 *
 * El movimiento es ALEATORIO: en cada carga se sortea para cada figura su
 * duración, su fase inicial y la amplitud de su recorrido, así que las figuras
 * nunca siguen el mismo patrón.
 */
import { ref, onMounted } from 'vue'

defineProps({
  eyebrow: { type: String, default: 'Facturación inteligente' },
  title: { type: String, default: 'La forma más fácil de facturar!' },
  subtitle: { type: String, default: 'Emite, gestiona y descarga tus CFDI 4.0 en un espacio claro, seguro y hecho para todos.' },
  noteTitle: { type: String, default: 'Timbrado al instante' },
  noteText: { type: String, default: 'Válida, emite y comparte sin fricción.' }
})

/** Configuración aleatoria por figura (duración, fase y amplitud). */
const figuras = ref([])

const TIPOS = ['drift', 'drift', 'drift', 'float', 'float', 'float', 'spin', 'spin', 'spin']

function aleatorio(min, max) { return min + Math.random() * (max - min) }

onMounted(() => {
  figuras.value = TIPOS.map((tipo, i) => ({
    id: `fig-${i}`,
    tipo,
    dur: `${aleatorio(3.2, 7).toFixed(2)}s`,
    delay: `${-aleatorio(0, 6).toFixed(2)}s`,
    ax: aleatorio(0.55, 1.45).toFixed(2),
    ay: aleatorio(0.55, 1.45).toFixed(2),
  }))
})
</script>

<template>
  <section class="stage" aria-hidden="true">
    <div class="scene">
      <!-- Figuras: sólo coral y morado, con movimiento aleatorio -->
      <div
        v-for="(f, i) in figuras"
        :key="f.id"
        :class="['fig', `fig--${f.tipo}`, `fig--${i}`]"
        :style="{ '--dur': f.dur, '--delay': f.delay, '--ax': f.ax, '--ay': f.ay }"
      ></div>

      <div class="hero-copy">
        <span class="eyebrow">{{ eyebrow }}</span>
        <h1>{{ title }}</h1>
        <p>{{ subtitle }}</p>
      </div>

      <div class="glass-note">
        <span class="note-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M13 2L3 14h7l-1 8 10-12h-7z" /></svg>
        </span>
        <div>
          <p class="note-title">{{ noteTitle }}</p>
          <p class="note-text">{{ noteText }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.stage {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
  background-color: var(--bg);
}

.scene { position: relative; z-index: 1; width: 100%; height: 100%; }

/* ── Figuras ──────────────────────────────────────────────────────────────
   Todas comparten 3 trayectorias; lo que cambia en cada carga es la duración,
   la fase inicial y la amplitud (--ax / --ay) → el movimiento es aleatorio. */
.fig {
  position: absolute;
  pointer-events: none;
  will-change: transform;
  animation-duration: var(--dur, 4s);
  animation-delay: var(--delay, 0s);
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
  animation-direction: alternate;
}

.fig--drift { animation-name: figDrift; }
.fig--float { animation-name: figFloat; }
.fig--spin { animation-name: figSpin; }

/* Manchas de color (pintadas, no difuminadas: sin "humo") */
.fig--0, .fig--3, .fig--6 {
  width: 360px; height: 360px; border-radius: 50%;
  background: radial-gradient(circle at 50% 50%, rgba(251, 146, 60, .42) 0%, rgba(251, 146, 60, .26) 42%, rgba(251, 146, 60, 0) 70%);
  top: -70px; left: -70px;
}
.fig--1, .fig--4, .fig--7 {
  width: 320px; height: 320px; border-radius: 50%;
  background: radial-gradient(circle at 50% 50%, rgba(192, 132, 252, .40) 0%, rgba(192, 132, 252, .24) 42%, rgba(192, 132, 252, 0) 70%);
  bottom: 2%; left: 30%;
}
.fig--2, .fig--5, .fig--8 {
  width: 340px; height: 340px; border-radius: 50%;
  background: radial-gradient(circle at 50% 50%, rgba(168, 85, 247, .38) 0%, rgba(168, 85, 247, .22) 42%, rgba(168, 85, 247, 0) 70%);
  top: 22%; left: 62%;
}

/* Formas geométricas nítidas */
.fig--3 {
  width: 210px; height: 105px; border-radius: 210px 210px 0 0;
  background: rgba(251, 146, 60, .30);
  top: 6%; left: 36%;
}
.fig--4 {
  width: 0; height: 0;
  border-left: 84px solid transparent; border-right: 84px solid transparent;
  border-bottom: 142px solid rgba(192, 132, 252, .28);
  bottom: 12%; left: 52%;
}
.fig--5 {
  width: 168px; height: 168px; border-radius: 50%;
  border: 22px solid rgba(168, 85, 247, .30);
  top: 50%; left: 12%;
}
.fig--6 {
  width: 168px; height: 168px; border-radius: 20px;
  background-image: radial-gradient(rgba(251, 146, 60, .30) 2px, transparent 2px);
  background-size: 16px 16px;
  left: 20%; bottom: 12%;
}
.fig--7 {
  width: 118px; height: 118px; border-radius: 26px;
  background: rgba(192, 132, 252, .28);
  bottom: 22%; left: 78%;
}
.fig--8 {
  width: 186px; height: 186px; border-radius: 50%;
  border: 24px solid rgba(251, 146, 60, .26);
  border-left-color: transparent;
  border-bottom-color: transparent;
  top: 10%; left: 76%;
}

/* ── Trayectorias (la amplitud sale de --ax / --ay) ─────────────────────── */
@keyframes figDrift {
  0%   { transform: translate3d(0, 0, 0) rotate(0deg) scale(1); }
  30%  { transform: translate3d(calc(var(--ax, 1) * -140px), calc(var(--ay, 1) * 96px), 0) rotate(24deg) scale(1.26); }
  62%  { transform: translate3d(calc(var(--ax, 1) * 72px), calc(var(--ay, 1) * 164px), 0) rotate(-16deg) scale(.88); }
  100% { transform: translate3d(calc(var(--ax, 1) * 116px), calc(var(--ay, 1) * -82px), 0) rotate(34deg) scale(1.18); }
}
@keyframes figFloat {
  0%   { transform: translate3d(0, 0, 0) rotate(0deg); }
  45%  { transform: translate3d(calc(var(--ax, 1) * 30px), calc(var(--ay, 1) * -72px), 0) rotate(14deg); }
  100% { transform: translate3d(calc(var(--ax, 1) * -26px), calc(var(--ay, 1) * -34px), 0) rotate(-11deg); }
}
@keyframes figSpin {
  0%   { transform: rotate(0deg) translate3d(0, 0, 0) scale(1); }
  50%  { transform: rotate(180deg) translate3d(calc(var(--ax, 1) * 42px), calc(var(--ay, 1) * -70px), 0) scale(1.18); }
  100% { transform: rotate(360deg) translate3d(0, 0, 0) scale(1); }
}

/* ── Texto ──────────────────────────────────────────────────────────────── */
.hero-copy {
  position: absolute;
  z-index: 2;
  left: 8%;
  bottom: 12%;
  max-width: 520px;
}
.eyebrow {
  display: inline-block;
  padding: 7px 14px;
  border-radius: 999px;
  background: var(--surface);
  border: 1px solid var(--border);
  font-size: 13px;
  font-weight: 700;
  color: var(--brand-primary);
  margin-bottom: 18px;
}
.hero-copy h1 {
  margin: 0 0 16px;
  font-size: 46px;
  line-height: 1.1;
  font-weight: 800;
  color: var(--text);
  letter-spacing: -0.02em;
}
.hero-copy p {
  margin: 0;
  font-size: 18px;
  color: var(--text-soft);
  line-height: 1.6;
  max-width: 460px;
}

.glass-note {
  position: absolute;
  z-index: 2;
  top: 8%;
  left: 8%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 18px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: var(--shadow-md);
}
.note-icon {
  width: 38px; height: 38px; border-radius: 10px;
  background: var(--brand-primary-soft);
  color: var(--brand-ink);
  display: inline-flex; align-items: center; justify-content: center;
}
.note-icon svg { width: 19px; height: 19px; }
.note-title { margin: 0; font-size: 15px; font-weight: 700; color: var(--text); }
.note-text { margin: 2px 0 0; font-size: 13px; color: var(--muted); }

/* El hero se queda en la mitad izquierda para no chocar con el formulario */
@media (min-width: 900px) {
  .hero-copy, .glass-note { max-width: 44%; }
}

/* En móvil el texto estorba al formulario: sólo quedan las figuras */
@media (max-width: 899px) {
  .hero-copy, .glass-note { display: none; }
  .fig { opacity: .55; }
}

@media (prefers-reduced-motion: reduce) {
  .fig { animation: none !important; }
}
</style>
