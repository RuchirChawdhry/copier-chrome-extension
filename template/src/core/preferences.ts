import { createStorage } from './storage';

export type Appearance = 'system' | 'light' | 'dark';

export const preferences = createStorage<{ 'ui.theme': Appearance }>({
  'ui.theme': {
    default: () => 'system',
    validate: (value): value is Appearance =>
      value === 'system' || value === 'light' || value === 'dark',
  },
});
