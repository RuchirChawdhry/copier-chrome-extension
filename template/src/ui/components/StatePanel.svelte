<script lang="ts">
  import Button from './Button.svelte';

  let {
    kind,
    message,
    retry,
  }: {
    kind: 'loading' | 'empty' | 'error';
    message: string;
    retry?: () => void;
  } = $props();
</script>

<div
  class="state-panel"
  class:error={kind === 'error'}
  role={kind === 'error' ? 'alert' : 'status'}
  aria-busy={kind === 'loading'}
>
  {#if kind === 'loading'}
    <span class="spinner" aria-hidden="true"></span>
  {/if}
  <span>{message}</span>
  {#if retry}
    <Button onclick={retry}>Retry</Button>
  {/if}
</div>
