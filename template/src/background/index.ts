import { createLogger } from '../core/logger';
import { registerRouter } from '../core/router';
import { dispatchExample } from '../example/handlers';
import { registerExampleMenus } from '../example/menus';
import { connectDevReload } from './dev-reload';

if (__DEV_RELOAD_PORT__) connectDevReload(__DEV_RELOAD_PORT__);
registerRouter(dispatchExample);
registerExampleMenus(__FEATURES__);
createLogger('worker').debug('Service worker initialized');
