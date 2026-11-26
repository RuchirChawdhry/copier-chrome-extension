import { readable } from 'svelte/store';
import { errorMessage } from './logger';

type StorageState<T> = { value: T; ready: boolean; error: string };

export function watchStorage<T>(
  initial: T,
  observe: (onChange: (value: T) => void, onError: (error: unknown) => void) => () => void,
) {
  return readable<StorageState<T>>({ value: initial, ready: false, error: '' }, (set) =>
    observe(
      (value) => set({ value, ready: true, error: '' }),
      (error) => set({ value: initial, ready: false, error: errorMessage(error) }),
    ),
  );
}
