<script lang="ts">
  import { createLogger, errorMessage } from '../../core/logger';
  import { watchStorage } from '../../core/reactive-storage';
  import { send } from '../../example/messages';
  import { exampleStorage } from '../../example/storage';
  import Button from '../components/Button.svelte';
  import SearchField from '../components/SearchField.svelte';
  import StatePanel from '../components/StatePanel.svelte';
  import Toggle from '../components/Toggle.svelte';

  const logger = createLogger('sidebar');
  let attempt = $state(0);
  let query = $state('');
  let showUrls = $state(true);
  let removing = $state<string | null>(null);
  const items = $derived.by(() => makeItems(attempt));
  function makeItems(_attempt: number) {
    return watchStorage(
      exampleStorage.defaultValue('example.links'),
      (update, fail) => exampleStorage.observe('example.links', update, fail),
    );
  }
  const filtered = $derived(
    $items.value.filter((item) =>
      (item.title + ' ' + item.url)
        .toLowerCase()
        .includes(query.toLowerCase().trim()),
    ),
  );
  let error = $state('');

  const title = chrome.runtime.getManifest().name;

  async function remove(id: string) {
    error = '';
    removing = id;
    try {
      await send('items.remove', { id });
    } catch (cause) {
      logger.warn('Remove failed');
      error = errorMessage(cause);
    } finally {
      removing = null;
    }
  }
</script>

<main data-ready="true" data-data-ready={$items.ready}>
  <div class="header">
    <h1>{title}</h1>
    <span class="count">{$items.ready ? $items.value.length : '—'}</span>
  </div>
  <p class="muted">
    A lightweight sidebar workspace. Replace this sample list with your
    product's domain.
  </p>
  {#if error}
    <StatePanel kind="error" message={error} />
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
    <StatePanel kind="loading" message="Loading saved items…" />
  {:else if !$items.value.length}
    <StatePanel
      kind="empty"
      message="Nothing saved yet. Save a page to get started."
    />
  {:else}
    <SearchField bind:value={query} label="Search saved links" />
    <Toggle bind:checked={showUrls} label="Show link addresses" />
    {#if !filtered.length}
      <StatePanel kind="empty" message="No matching links." />
    {/if}
    <ul class="list">
      {#each filtered as item (item.id)}
        <li>
          <div class="item-content">
            <a
              class="truncate"
              href={item.url}
              target="_blank"
              rel="noreferrer"
              title={item.url}
              >{item.title}</a
            >
            {#if showUrls}
              <span class="muted truncate">{item.url}</span>
            {/if}
          </div>
          <Button
            busy={removing === item.id}
            disabled={removing !== null}
            aria-label={'Remove ' + item.title}
            onclick={() => remove(item.id)}
          >
            Remove
          </Button>
        </li>
      {/each}
    </ul>
  {/if}
</main>
