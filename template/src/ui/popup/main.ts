import { initializeAppearance } from '../../core/appearance';
import { mount } from 'svelte';
import App from './App.svelte';

const target = document.querySelector('#app');
if (!target) throw new Error('Popup mount point not found');
void initializeAppearance();
target.replaceChildren();
mount(App, { target });
