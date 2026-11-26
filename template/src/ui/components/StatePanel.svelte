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
  class={[
    'flex items-center gap-2 rounded-lg border bg-card p-3 text-sm',
    kind === 'error'
      ? 'border-destructive text-destructive'
      : 'border-border text-muted-foreground',
  ]}
  role={kind === 'error' ? 'alert' : 'status'}
  aria-busy={kind === 'loading'}
>
  {#if kind === 'loading'}
    <span
      class="size-4 shrink-0 animate-spin rounded-full border-2 border-border border-t-primary motion-reduce:animate-none"
      aria-hidden="true"
    ></span>
  {/if}
  <span class="min-w-0 flex-1">{message}</span>
  {#if retry}
    <Button onclick={retry}>Retry</Button>
  {/if}
</div>
