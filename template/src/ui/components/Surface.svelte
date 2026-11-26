<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    title,
    description,
    label,
    wide = false,
    ready = true,
    badge,
    children,
  }: {
    title: string;
    description?: string;
    label: string;
    wide?: boolean;
    ready?: boolean;
    badge?: string;
    children: Snippet;
  } = $props();
</script>

<main
  data-ready="true"
  data-data-ready={ready}
  class={wide
    ? 'mx-auto flex max-w-3xl flex-col gap-5 p-6'
    : 'mx-auto flex max-w-xl flex-col gap-4 p-4'}
>
  <header
    class="flex items-start justify-between gap-3 border-b border-border pb-4"
  >
    <div class="min-w-0">
      <p
        class="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground"
      >
        {label}
      </p>
      <h1
        class="break-words text-lg font-semibold leading-tight tracking-tight"
      >
        {title}
      </h1>
      {#if description}
        <p class="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      {/if}
    </div>
    {#if badge !== undefined}
      <span
        class="shrink-0 rounded-md bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground"
        >{badge}</span
      >
    {/if}
  </header>
  {@render children()}
</main>
