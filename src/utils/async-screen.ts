import { defineComponent, h, shallowRef, type Component } from 'vue';
import { useScreenReadiness } from '../composables/useScreenReadiness';
import { reportNavigationFailure, reportResourceFailure } from './resource-diagnostics';
import AsyncLoadError from '../components/ui/AsyncLoadError.vue';

class ModuleTimeout extends Error {}
function loadWithTimeout(loader: () => Promise<{ default: Component }>) {
  return new Promise<{ default: Component }>((resolve, reject) => {
    const timer = setTimeout(() => reject(new ModuleTimeout()), 25_000);
    Promise.resolve().then(loader).then(resolve, reject).finally(() => clearTimeout(timer));
  });
}

export function asyncScreen(loader: () => Promise<{ default: Component }>) {
  let module: Promise<{ default: Component }> | undefined;
  return defineComponent({
    inheritAttrs: false,
    setup(_props, { attrs, slots }) {
      const { track } = useScreenReadiness();
      const screen = shallowRef<Component>();
      const failed = shallowRef(false);
      void track((module ??= loadWithTimeout(loader)).then(result => {
        screen.value = result.default;
      }, error => {
        if (error instanceof ModuleTimeout) reportResourceFailure('module', 'timeout', undefined, true);
        else reportNavigationFailure(error);
        module = undefined;
        failed.value = true;
      }));
      return () => screen.value ? h(screen.value, attrs, slots) : failed.value ? h(AsyncLoadError) : null;
    },
  });
}
