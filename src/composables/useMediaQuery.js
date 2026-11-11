import { ref, onMounted, onBeforeUnmount } from 'vue'

/**
 * Media query reactiva para Vue 3.
 * @param {string} query  ej. '(max-width: 768px)'
 */
export function useMediaQuery(query) {
  const matches = ref(false)
  let mql = null

  const update = () => { matches.value = !!mql?.matches }

  onMounted(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    mql = window.matchMedia(query)
    update()
    mql.addEventListener?.('change', update)
  })

  onBeforeUnmount(() => mql?.removeEventListener?.('change', update))

  return matches
}
