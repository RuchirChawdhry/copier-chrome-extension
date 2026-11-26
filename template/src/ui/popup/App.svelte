<script lang="ts">
  import { onMount } from 'svelte';
  import features from '../../../features.json';
  import { createLogger, errorMessage } from '../../core/logger';
  import { watchStorage } from '../../core/reactive-storage';
  import { send } from '../../example/messages';
  import { exampleStorage } from '../../example/storage';

  const logger = createLogger('popup');
  const items = watchStorage(
    exampleStorage.defaultValue('example.links'),
    (update, fail) => exampleStorage.observe('example.links', update, fail),
  );
  let tab = $state<chrome.tabs.Tab | null>(null);
  let windowId = $state<number | null>(null);
  let busy = $state(false);
  let error = $state('');

  const title = chrome.runtime.getManifest().name;

  onMount(() => {
    void chrome.tabs
      .query({ active: true, currentWindow: true })
      .then((tabs) => {
        tab = tabs[0] ?? null;
        windowId = tab?.windowId ?? null;
      })
      .catch(() => {
        logger.warn('Active tab lookup failed');
      });
  });

  async function saveCurrent() {
    if (!tab?.url) return;
    busy = true;
    error = '';
    try {
      await send('items.add', { url: tab.url, title: tab.title });
    } catch (cause) {
      logger.warn('Save failed');
      error = errorMessage(cause);
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
    <span class="count">{$items.value.length} saved</span>
  </div>
  <p class="muted">Quick actions, right where you need them.</p>
  <div class="actions">
    <button
      type="button"
      class="primary"
      onclick={saveCurrent}
      disabled={!tab?.url || busy}
    >
      {busy ? 'Saving…' : 'Save current page'}
    </button>
    {#if features.sidebar}
      <button type="button" onclick={openSidebar} disabled={windowId === null}>
        Open sidebar
      </button>
    {/if}
    {#if features.settings}
      <button
        type="button"
        onclick={() => {
          void chrome.runtime
            .openOptionsPage()
            .catch(() => logger.error('Unable to open settings'));
        }}
      >
        Settings
      </button>
    {/if}
  </div>
  {#if error || $items.error}
    <p role="alert" class="error">{error || $items.error}</p>
  {/if}
  {#if $items.value.length}
    <section class="card">
      <strong class="muted">Recently saved</strong>
      <ul class="list">
        {#each $items.value.slice(0, 3) as item (item.id)}
          <li>
            <a
              class="truncate"
              href={item.url}
              target="_blank"
              rel="noreferrer"
              title={item.url}
              >{item.title}</a
            >
          </li>
        {/each}
      </ul>
    </section>
  {/if}
</main>
