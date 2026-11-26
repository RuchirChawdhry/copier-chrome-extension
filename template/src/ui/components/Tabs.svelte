<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    id,
    tabs,
    active = $bindable(),
    children,
  }: {
    id: string;
    tabs: { id: string; label: string }[];
    active: string;
    children: Snippet<[string]>;
  } = $props();
  function navigate(event: KeyboardEvent, index: number) {
    const next = (
      {
        ArrowLeft: (index - 1 + tabs.length) % tabs.length,
        ArrowRight: (index + 1) % tabs.length,
        Home: 0,
        End: tabs.length - 1,
      } as Record<string, number>
    )[event.key];
    if (next === undefined) return;
    event.preventDefault();
    active = tabs[next].id;
    document.getElementById(`${id}-tab-${active}`)?.focus();
  }
</script>

<div class="flex gap-1 rounded-lg border border-border bg-muted p-1" role="tablist" aria-label="Settings sections">
  {#each tabs as tab, index (tab.id)}
    <button
      class="min-h-8 flex-1 cursor-pointer rounded-md px-3 text-sm font-medium text-muted-foreground hover:text-foreground aria-selected:bg-card aria-selected:text-foreground aria-selected:shadow-sm"
      type="button"
      role="tab"
      id={`${id}-tab-${tab.id}`}
      aria-selected={active === tab.id}
      aria-controls={`${id}-panel`}
      tabindex={active === tab.id ? 0 : -1}
      onclick={() => {
        active = tab.id;
      }}
      onkeydown={(event) => navigate(event, index)}
    >
      {tab.label}
    </button>
  {/each}
</div>
<div class="flex flex-col gap-3" role="tabpanel" id={`${id}-panel`} aria-labelledby={`${id}-tab-${active}`}>
  {@render children(active)}
</div>
