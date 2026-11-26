<script lang="ts">
  import { onMount } from 'svelte';
  import type { SavedItem } from '../../core/items';
  import { getItems, subscribeToItems } from '../../core/storage';
  import { sendCommand } from '../../core/client';
  let items = $state<SavedItem[]>([]);
  let error = $state('');

  const title = chrome.runtime.getManifest().name;

  async function refresh() { items = await getItems(); }

  onMount(() => {
    void refresh();
    return subscribeToItems(() => { void refresh(); });
  });

  async function remove(id: string) {
    error = '';
    try { await sendCommand({ type: 'items.remove', id }); }
    catch (cause) { error = cause instanceof Error ? cause.message : String(cause); }
  }
</script>

<main data-ready="true">
  <div class="header">
    <h1>{title}</h1>
    <span class="count">{items.length}</span>
  </div>
  <p class="muted">A lightweight sidebar workspace. Replace this sample list with your product's domain.</p>
  {#if error}<p role="alert" class="error">{error}</p>{/if}
  {#if !items.length}
    <section class="card"><p>Nothing saved yet. Right-click a webpage or use the toolbar popup to add something.</p></section>
  {:else}
    <ul class="list">
      {#each items as item (item.id)}
        <li>
          <div class="item-content">
            <a class="truncate" href={item.url} target="_blank" rel="noreferrer" title={item.url}>{item.title}</a>
            <span class="muted truncate">{item.url}</span>
          </div>
          <button aria-label={'Remove ' + item.title} onclick={() => remove(item.id)}>Remove</button>
        </li>
      {/each}
    </ul>
  {/if}
</main>
