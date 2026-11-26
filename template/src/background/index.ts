import { createLogger } from '../core/logger';
import { registerRouter } from '../core/router';
import { registerExampleBadge } from '../example/badge';
import { registerExampleCommands } from '../example/commands';
import { dispatchExample } from '../example/handlers';
import { registerExampleMenus } from '../example/menus';
import { connectDevReload } from './dev-reload';

if (__DEV_RELOAD_PORT__) connectDevReload(__DEV_RELOAD_PORT__);
registerRouter(dispatchExample);
registerExampleMenus(__FEATURES__);
if (__FEATURES__.toolbarBadge) registerExampleBadge();
if (__FEATURES__.keyboardShortcuts) registerExampleCommands();
createLogger('worker').debug('Service worker initialized');
