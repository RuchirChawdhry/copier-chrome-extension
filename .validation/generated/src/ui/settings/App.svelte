<script lang="ts">
  import { onMount } from 'svelte';
  import { createLogger, errorMessage } from '../../core/logger';
  import { type Appearance, preferences } from '../../core/preferences';

  let appearance = $state<Appearance>('system');
  let status = $state('');
  let error = $state('');
  let ready = $state(false);
  let dirty = $state(false);
  const logger = createLogger('settings');
  const title = chrome.runtime.getManifest().name;

  onMount(() =>
    preferences.observe(
      'appearance',
      (value) => {
        if (!dirty) appearance = value;
        ready = true;
      },
      (cause) => {
        logger.warn('Unable to load settings');
        error = errorMessage(cause);
      },
    ),
  );

  async function save() {
    error = '';
    try {
      await preferences.set('appearance', appearance);
      dirty = false;
      status = 'Saved';
    } catch (cause) {
      logger.warn('Unable to save settings');
      error = errorMessage(cause);
    }
  }
</script>

<main data-ready="true">
  <h1>{title} · Settings</h1>
  <p>
    Preferences for your extension. This page is independent from the popup and
    sidebar bundles.
  </p>
  <section class="card">
    <label for="appearance">Preferred appearance</label>
    <select
      id="appearance"
      bind:value={appearance}
      disabled={!ready}
      onchange={() => {
        status = '';
        dirty = true;
      }}
    >
      <option value="system">Follow system</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
    <div class="actions">
      <button type="button" class="primary" onclick={save} disabled={!ready}>
        Save settings
      </button>
    </div>
    {#if error}
      <p role="alert" class="error">{error}</p>
    {/if}
    {#if status}
      <p role="status">{status}</p>
    {/if}
  </section>
</main>
