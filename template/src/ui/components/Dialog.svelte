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
  bind:this={dialog}
  aria-labelledby={id}
  onclose={() => {
    open = false;
  }}
>
  <h2 {id}>{title}</h2>
  {@render children()}
  <div class="actions">
    <Button
      onclick={() => {
        open = false;
      }}
      >Close</Button
    >
  </div>
</dialog>
