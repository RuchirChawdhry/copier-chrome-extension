<script lang="ts">
  let {
    message,
    kind = 'success',
  }: { message: string; kind?: 'success' | 'error' | 'info' } = $props();
</script>

{#if message}
  <p
    class="status-message"
    class:error={kind === 'error'}
    role={kind === 'error' ? 'alert' : 'status'}
  >
    {message}
  </p>
{/if}
