import { setCountBadge } from '../core/badge';
import { createLogger } from '../core/logger';
import { exampleStorage } from './storage';

export function registerExampleBadge(): void {
  const logger = createLogger('worker:badge');
  const fail = () => logger.warn('Unable to update badge');
  exampleStorage.observe('example.links', (items) => {
    void setCountBadge(items.length).catch(fail);
  }, fail);
}
