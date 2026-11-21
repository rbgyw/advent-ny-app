import { shallowRef, type ComponentPublicInstance } from 'vue';
/** Resolve component roots for DOM APIs such as ResizeObserver. */
export function useElementRef() {
  const element = shallowRef<HTMLElement>();
  function bind(value: Element | ComponentPublicInstance | null) {
    const root = value && '$el' in value ? value.$el : value;
    element.value = root instanceof HTMLElement ? root : undefined;
  }
  return { element, bind };
}
