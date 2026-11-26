<script lang="ts">
  import { createLogger, errorMessage } from '../../core/logger';
  import { watchStorage } from '../../core/reactive-storage';
  import { send } from '../../example/messages';
  import { exampleStorage } from '../../example/storage';

  const logger = createLogger('sidebar');
  const items = watchStorage(
    exampleStorage.defaultValue('savedItems'),
    (update, fail) => exampleStorage.observe('savedItems', update, fail),
  );
  let error = $state('');

  const title = chrome.runtime.getManifest().name;

  async function remove(id: string) {
    error = '';
    try {
      await send('items.remove', { id });
    } catch (cause) {
      logger.warn('Remove failed');
      error = errorMessage(cause);
    }
  }
</script>

<main data-ready="true">
  <div class="header">
    <h1>{title}</h1>
    <span class="count">{$items.value.length}</span>
  </div>
  <p class="muted">
    A lightweight sidebar workspace. Replace this sample list with your
    product's domain.
  </p>
  {#if error || $items.error}
    <p role="alert" class="error">{error || $items.error}</p>
  {/if}
  {#if !$items.ready && !$items.error}
    <p class="muted">Loading saved items…</p>
  {:else if !$items.value.length}
    <section class="card">
      <p>
        Nothing saved yet. Right-click a webpage or use the toolbar popup to add
        something.
      </p>
    </section>
  {:else}
    <ul class="list">
      {#each $items.value as item (item.id)}
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
            <span class="muted truncate">{item.url}</span>
          </div>
          <button
            type="button"
            aria-label={'Remove ' + item.title}
            onclick={() => remove(item.id)}
          >
            Remove
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</main>
