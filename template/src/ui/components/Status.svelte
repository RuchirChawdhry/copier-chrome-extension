<script lang="ts">
  let {
    message,
    kind = 'success',
  }: { message: string; kind?: 'success' | 'error' | 'info' } = $props();
</script>

{#if message}
  <p
    class={['text-sm', kind === 'error' ? 'text-destructive' : 'text-muted-foreground']}
    role={kind === 'error' ? 'alert' : 'status'}
  >
    {message}
  </p>
{/if}
