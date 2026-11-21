import { defineAsyncComponent, type Component } from 'vue';
import LoadingState from '../components/ui/LoadingState.vue';
import AsyncLoadError from '../components/ui/AsyncLoadError.vue';
export function asyncScreen(loader: () => Promise<{ default: Component }>) {
  return defineAsyncComponent({ loader, loadingComponent: LoadingState, errorComponent: AsyncLoadError, delay: 150 });
}
