import { defineAsyncComponent, h, type Component } from 'vue';
import LoadingState from '../components/ui/LoadingState.vue';
import TaskLoading from '../components/ui/TaskLoading.vue';
import AsyncLoadError from '../components/ui/AsyncLoadError.vue';
export function asyncScreen(loader: () => Promise<{ default: Component }>, kind: 'task' | 'illustration' = 'task') {
  const loadingComponent = kind === 'task' ? TaskLoading : { render: () => h(LoadingState, { label: 'Загружаем календарь…', compact: true }) };
  return defineAsyncComponent({ loader, loadingComponent, errorComponent: AsyncLoadError, delay: 0 });
}
