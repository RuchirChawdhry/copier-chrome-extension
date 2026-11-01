<script lang="ts">
  import { onMount } from 'svelte';
  import { APPEARANCE_KEY, type Appearance } from '../../core/storage';

  let appearance = $state<Appearance>('system');
  let status = $state('');
  const title = chrome.runtime.getManifest().name;

  onMount(() => {
    void chrome.storage.local.get(APPEARANCE_KEY).then((stored) => {
      const value = stored[APPEARANCE_KEY];
      if (value === 'system' || value === 'light' || value === 'dark') appearance = value;
    });
  });

  async function save() {
    await chrome.storage.local.set({ [APPEARANCE_KEY]: appearance });
    status = 'Saved';
  }
</script>

<main data-ready="true">
  <h1>{title} · Settings</h1>
  <p>Preferences for your extension. This page is independent from the popup and sidebar bundles.</p>
  <section class="card">
    <label for="appearance">Preferred appearance</label>
    <select id="appearance" bind:value={appearance} onchange={() => { status = ''; }}>
      <option value="system">Follow system</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
    <div class="actions"><button class="primary" onclick={save}>Save settings</button></div>
    {#if status}<p role="status">{status}</p>{/if}
  </section>
</main>
