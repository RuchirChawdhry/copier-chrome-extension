import { createLogger } from '../core/logger';

// Isolated-world sample; runs only on the opt-in manifest match.
// Replace this marker with your product's page integration.
document.documentElement.dataset.extensionExample = 'ready';
createLogger('content').debug('Content script initialized');
