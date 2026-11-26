<script lang="ts">
  import type { Snippet } from 'svelte';
  import Button from './Button.svelte';

  let {
    open = $bindable(false),
    id,
    title,
    children,
  }: {
    open?: boolean;
    id: string;
    title: string;
    children: Snippet;
  } = $props();
  let dialog: HTMLDialogElement;
  $effect(() => {
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  });
</script>

<dialog
  class="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg border border-border bg-popover p-5 text-popover-foreground shadow-xl backdrop:bg-black/60"
  bind:this={dialog}
  aria-labelledby={id}
  onclose={() => {
    open = false;
  }}
>
  <h2 class="mb-3 text-base font-semibold" {id}>{title}</h2>
  {@render children()}
  <div class="mt-4 flex justify-end gap-2">
    <Button
      onclick={() => {
        open = false;
      }}
      >Close</Button
    >
  </div>
</dialog>
