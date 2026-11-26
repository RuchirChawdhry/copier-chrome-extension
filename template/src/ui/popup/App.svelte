<script lang="ts">
  import { onMount } from 'svelte';
  import features from '../../../features.json';
  import { createLogger, errorMessage } from '../../core/logger';
  import { watchStorage } from '../../core/reactive-storage';
  import { send } from '../../example/messages';
  import { exampleStorage } from '../../example/storage';
  import Button from '../components/Button.svelte';
  import Card from '../components/Card.svelte';
  import StatePanel from '../components/StatePanel.svelte';

  const logger = createLogger('popup');
  const items = $derived.by(() => {
    // Recreate the readable subscription on explicit retry.
    return makeItems(attempt);
  });
  function makeItems(_attempt: number) {
    return watchStorage(
      exampleStorage.defaultValue('example.links'),
      (update, fail) => exampleStorage.observe('example.links', update, fail),
    );
  }
  let attempt = $state(0);
  let tabReady = $state(false);
  let tab = $state<chrome.tabs.Tab | null>(null);
  let windowId = $state<number | null>(null);
  let busy = $state(false);
  let error = $state('');

  const title = chrome.runtime.getManifest().name;

  function loadTab() {
    tabReady = false;
    error = '';
    void chrome.tabs
      .query({ active: true, currentWindow: true })
      .then((tabs) => {
        tab = tabs[0] ?? null;
        windowId = tab?.windowId ?? null;
        tabReady = true;
      })
      .catch((cause: unknown) => {
        logger.warn('Active tab lookup failed');
        error = errorMessage(cause);
      });
  }
  onMount(loadTab);

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
    <span class="count">{$items.ready ? $items.value.length : '—'} saved</span>
  </div>
  <p class="muted">Quick actions, right where you need them.</p>
  <div class="actions">
    <Button
      primary
      {busy}
      onclick={saveCurrent}
      disabled={!tabReady || !tab?.url || !/^https?:/.test(tab.url)}
    >
      {busy ? 'Saving…' : 'Save current page'}
    </Button>
    {#if features.sidebar}
      <Button onclick={openSidebar} disabled={windowId === null}>
        Open sidebar
      </Button>
    {/if}
    {#if features.settings}
      <Button
        onclick={() => {
          void chrome.runtime
            .openOptionsPage()
            .catch(() => logger.error('Unable to open settings'));
        }}
      >
        Settings
      </Button>
    {/if}
  </div>
  {#if error}
    <StatePanel
      kind="error"
      message={error}
      retry={!tabReady ? loadTab : undefined}
    />
  {/if}
  {#if !tabReady && !error}
    <StatePanel kind="loading" message="Checking active tab…" />
  {/if}
  {#if $items.error}
    <StatePanel
      kind="error"
      message={$items.error}
      retry={() => {
        attempt += 1;
      }}
    />
  {:else if !$items.ready}
    <StatePanel kind="loading" message="Loading saved links…" />
  {:else if $items.value.length}
    <Card title="Recently saved">
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
    </Card>
  {:else}
    <StatePanel kind="empty" message="No saved links yet." />
  {/if}
</main>
