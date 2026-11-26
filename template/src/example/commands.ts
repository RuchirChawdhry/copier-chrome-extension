import { createLogger } from '../core/logger';
import { saveItem } from './handlers';

export function registerExampleCommands(): void {
  const logger = createLogger('worker:commands');
  chrome.commands.onCommand.addListener((command, tab) => {
    if (command === 'save-active-page' && tab?.url)
      void saveItem({ url: tab.url, title: tab.title }).catch(() =>
        logger.warn('Unable to save active page'),
      );
  });
}
