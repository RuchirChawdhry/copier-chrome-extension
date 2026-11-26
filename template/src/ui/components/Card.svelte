<script lang="ts">
  import type { Snippet } from 'svelte';
  let { children, title }: { children: Snippet; title?: string } = $props();
</script>

<section class="card">
  {#if title}<h2 class="card-title">{title}</h2>{/if}
  {@render children()}
</section>
