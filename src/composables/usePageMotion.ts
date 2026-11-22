import { onBeforeUnmount, onMounted } from 'vue';
/** Pause decorative CSS and active Web Animations while the page is hidden. */
export function usePageMotion() {
  const paused = new Set<Animation>();
  function update() {
    document.documentElement.classList.toggle('advent-page-hidden', document.hidden);
    if (document.hidden) {
      for (const animation of document.getAnimations()) {
        if (animation instanceof CSSAnimation || animation instanceof CSSTransition || animation.playState !== 'running') continue;
        animation.pause(); paused.add(animation);
      }
    } else {
      for (const animation of paused) {
        const target = (animation.effect as KeyframeEffect | null)?.target;
        if (target?.isConnected && animation.playState === 'paused') animation.play();
      }
      paused.clear();
    }
  }
  onMounted(() => { update(); document.addEventListener('visibilitychange', update); });
  onBeforeUnmount(() => { document.removeEventListener('visibilitychange', update); document.documentElement.classList.remove('advent-page-hidden'); paused.clear(); });
}
