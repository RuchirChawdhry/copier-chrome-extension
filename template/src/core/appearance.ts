import { createLogger } from './logger';
import { type Appearance, preferences } from './preferences';

const logger = createLogger('appearance');

function applyAppearance(value: Appearance): void {
  if (value === 'system') delete document.documentElement.dataset.appearance;
  else document.documentElement.dataset.appearance = value;
}

export function initializeAppearance(): () => void {
  return preferences.observe('appearance', applyAppearance, () => logger.warn('Unable to load appearance'));
}
