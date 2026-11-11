<script setup>
/**
 * Marca de la marca (logo).
 *
 * Antes era una letra "F" de texto dentro de un cuadro con degradado: dependía de la
 * fuente del sistema, no tenía el mismo peso óptico que el resto del UI y el blanco
 * perdía contraste en la parte brillante del degradado (sobre todo en modo oscuro).
 *
 * Ahora es un SVG geométrico (la "F" + dos líneas de factura) con:
 *  - silueta independiente de la tipografía
 *  - color sólido (sin degradado ni overlay) para que nunca se vea velado
 *  - brillo diagonal + borde interior (efecto cristal)
 *  - el mismo componente en sidebar, login y flujo express
 */
const props = defineProps({
  size: { type: Number, default: 40 },
  label: { type: String, default: 'Autofacturación' },
  // Permite sobrescribir el degradado (ej. el color del rol seleccionado en el login).
  gradient: { type: String, default: '' }
})
</script>

<template>
  <span
    class="bm"
    :style="{ '--bm': `${props.size}px`, '--bm-grad': props.gradient || 'var(--grad-brand)' }"
    role="img"
    :aria-label="props.label"
  >
    <svg class="bm__glyph" viewBox="11 9 32 32" aria-hidden="true" focusable="false">
      <path class="bm__f" d="M15 13h14v6H21v4h7v6h-7v9h-6z" />
      <path class="bm__lines" d="M33 24.5h7.5M33 30.5h7.5" />
    </svg>
  </span>
</template>

<style scoped>
.bm {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--bm);
  height: var(--bm);
  border-radius: calc(var(--bm) * .31);
  /* Color sólido, sin overlay ni degradado */
  background: var(--bm-grad, var(--accent-coral));
  flex-shrink: 0;
  overflow: hidden;
  isolation: isolate;
  box-shadow:
    0 6px 16px rgba(251, 146, 60, .34),
    0 2px 4px rgba(15, 23, 42, .16);
  transition:
    transform .28s cubic-bezier(.34, 1.56, .64, 1),
    box-shadow .3s ease,
    background .35s ease;
}

.bm__glyph {
  position: relative;
  z-index: 2;
  width: 76%;
  height: 76%;
}

.bm__f {
  fill: #fff;
}

.bm__lines {
  stroke: #fff;
  stroke-width: 2.4;
  stroke-linecap: round;
  opacity: .55;
}

/* Modo oscuro: el degradado es más saturado, la sombra acompaña */

/* Interacción sutil al pasar el mouse (sólo donde tiene sentido) */
:global(a:hover) .bm, :global(.brand:hover) .bm {
  transform: translateY(-1px) scale(1.03);
}
</style>
