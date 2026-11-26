<script lang="ts">
  import { onMount } from 'svelte';
  import features from '../../../features.json';
  import { createLogger, errorMessage } from '../../core/logger';
  import { type Appearance, preferences } from '../../core/preferences';
  import Button from '../components/Button.svelte';
  import Card from '../components/Card.svelte';
  import Dialog from '../components/Dialog.svelte';
  import PermissionPanel from '../components/PermissionPanel.svelte';
  import StatePanel from '../components/StatePanel.svelte';
  import Status from '../components/Status.svelte';
  import Tabs from '../components/Tabs.svelte';

  let appearance = $state<Appearance>('system');
  let status = $state('');
  let error = $state('');
  let ready = $state(false);
  let busy = $state(false);
  let dirty = $state(false);
  let active = $state('general');
  let helpOpen = $state(false);
  let stop = () => {};
  const logger = createLogger('settings');
  const title = chrome.runtime.getManifest().name;
  const browserFeatures = features.optionalPermissions || features.keyboardShortcuts || features.toolbarBadge || features.contentScript;
  const tabs = [{ id: 'general', label: 'General' }, { id: 'browser', label: 'Browser' }];

  function load() {
    stop();
    ready = false;
    error = '';
    stop = preferences.observe('ui.theme', (value) => {
      if (!dirty) appearance = value;
      ready = true;
      error = '';
    }, (cause) => {
      logger.warn('Unable to load settings');
      error = errorMessage(cause);
    });
  }
  onMount(() => { load(); return () => stop(); });

  async function save() {
    busy = true;
    error = '';
    try {
      await preferences.set('ui.theme', appearance);
      dirty = false;
      status = 'Saved';
    } catch (cause) {
      logger.warn('Unable to save settings');
      error = errorMessage(cause);
    } finally { busy = false; }
  }
</script>

{#snippet general()}
  <Card title="Appearance">
    {#if !ready}
      <StatePanel kind={error ? 'error' : 'loading'} message={error || 'Loading preferences…'} retry={error ? load : undefined} />
    {:else}
      <label for="appearance">Preferred appearance</label>
      <select id="appearance" bind:value={appearance} disabled={busy} onchange={() => { status = ''; dirty = true; }}>
        <option value="system">Follow system</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
      <div class="actions">
        <Button primary onclick={save} {busy}>{busy ? 'Saving…' : 'Save settings'}</Button>
      </div>
      <Status message={error || status} kind={error ? 'error' : 'success'} />
    {/if}
  </Card>
{/snippet}

{#snippet browser()}
  {#if features.optionalPermissions}<PermissionPanel />{/if}
  {#if features.keyboardShortcuts}
    <Card title="Keyboard shortcuts">
      <p>Save the active page with Alt+Shift+S (suggested; change it in your browser's extension shortcut settings).</p>
    </Card>
  {/if}
  {#if features.toolbarBadge}<Card title="Toolbar badge"><p>The toolbar icon shows the saved-link count.</p></Card>{/if}
  {#if features.contentScript}<Card title="Content script"><p>The example runs only on https://example.com/ in an isolated world.</p></Card>{/if}
  <Button onclick={() => { helpOpen = true; }}>About browser access</Button>
{/snippet}

<main data-ready="true">
  <h1>{title} · Settings</h1>
  <p>Preferences for your extension. This page is independent from the popup and sidebar bundles.</p>
  {#if browserFeatures}
    <Tabs id="settings" {tabs} bind:active>
      {#snippet children(section)}
        {#if section === 'general'}{@render general()}{:else}{@render browser()}{/if}
      {/snippet}
    </Tabs>
  {:else}
    {@render general()}
  {/if}
  <Dialog id="browser-access-title" title="Browser access" bind:open={helpOpen}>
    <p>Optional permissions are requested only when you grant access. Enabled content scripts run on their explicitly declared sites.</p>
  </Dialog>
</main>
