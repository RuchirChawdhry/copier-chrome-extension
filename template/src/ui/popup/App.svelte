<script lang="ts">
  import { onMount } from 'svelte';
  import features from '../../../features.json';
  import type { SavedItem } from '../../core/items';
  import { getItems, subscribeToItems } from '../../core/storage';
  import { sendCommand } from '../../core/client';

  let items = $state<SavedItem[]>([]);
  let tab = $state<chrome.tabs.Tab | null>(null);
  let windowId = $state<number | null>(null);
  let busy = $state(false);
  let error = $state('');

  const title = chrome.runtime.getManifest().name;

  async function refresh() {
    items = await getItems();
  }

  onMount(() => {
    void refresh();
    void chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      tab = tabs[0] ?? null;
      windowId = tab?.windowId ?? null;
    });
    return subscribeToItems(() => { void refresh(); });
  });

  async function saveCurrent() {
    if (!tab?.url) return;
    busy = true;
    error = '';
    try {
      await sendCommand({ type: 'items.add', url: tab.url, title: tab.title });
      await refresh();
    } catch (cause) {
      error = cause instanceof Error ? cause.message : String(cause);
    } finally {
      busy = false;
    }
  }

  function openSidebar() {
    if (windowId !== null) {
      // Call directly inside the user gesture; no service-worker round-trip.
      void chrome.sidePanel.open({ windowId }).catch((cause: unknown) => {
        error = cause instanceof Error ? cause.message : String(cause);
      });
    }
  }
</script>

<main data-ready="true">
  <div class="header">
    <h1>{title}</h1>
    <span class="count">{items.length} saved</span>
  </div>
  <p class="muted">Quick actions, right where you need them.</p>
  <div class="actions">
    <button class="primary" onclick={saveCurrent} disabled={!tab?.url || busy}>
      {busy ? 'Saving…' : 'Save current page'}
    </button>
    {#if features.sidebar}
      <button onclick={openSidebar} disabled={windowId === null}>Open sidebar</button>
    {/if}
    {#if features.settings}
      <button onclick={() => chrome.runtime.openOptionsPage()}>Settings</button>
    {/if}
  </div>
  {#if error}<p role="alert" class="error">{error}</p>{/if}
  {#if items.length}
    <section class="card">
      <strong class="muted">Recently saved</strong>
      <ul class="list">
        {#each items.slice(0, 3) as item (item.id)}
          <li><a class="truncate" href={item.url} target="_blank" rel="noreferrer" title={item.url}>{item.title}</a></li>
        {/each}
      </ul>
    </section>
  {/if}
</main>
