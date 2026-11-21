import { defineComponent, h, shallowRef, type Component } from 'vue';
import { useScreenReadiness } from '../composables/useScreenReadiness';
import AsyncLoadError from '../components/ui/AsyncLoadError.vue';

export function asyncScreen(loader: () => Promise<{ default: Component }>) {
  let module: Promise<{ default: Component }> | undefined;
  return defineComponent({
    inheritAttrs: false,
    setup(_props, { attrs, slots }) {
      const { track } = useScreenReadiness();
      const screen = shallowRef<Component>();
      const failed = shallowRef(false);
      void track((module ??= loader()).then(result => {
        screen.value = result.default;
      }, () => {
        module = undefined;
        failed.value = true;
      }));
      return () => screen.value ? h(screen.value, attrs, slots) : failed.value ? h(AsyncLoadError) : null;
    },
  });
}
