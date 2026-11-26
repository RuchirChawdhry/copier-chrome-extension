<script lang="ts">
  import type { Snippet } from 'svelte';

  let { children, title }: { children: Snippet; title?: string } = $props();
</script>

<section
  class="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 text-card-foreground"
>
  {#if title}
    <h2 class="text-sm font-semibold tracking-tight">{title}</h2>
  {/if}
  {@render children()}
</section>
