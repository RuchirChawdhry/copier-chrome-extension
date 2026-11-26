import { mount } from 'svelte';
import { initializeAppearance } from '../../core/appearance';
import { createLogger } from '../../core/logger';
import App from './App.svelte';

const target = document.querySelector('#app');
if (!target) throw new Error('Sidebar mount point not found');
void initializeAppearance();
target.replaceChildren();
mount(App, { target });
createLogger('sidebar').debug('UI mounted');
