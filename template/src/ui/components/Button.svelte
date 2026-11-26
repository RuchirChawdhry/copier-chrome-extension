<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';

  let { children, primary = false, busy = false, disabled = false, class: className = '', ...rest }: HTMLButtonAttributes & {
    children?: Snippet;
    primary?: boolean;
    busy?: boolean;
  } = $props();
</script>

<button {...rest} type={rest.type ?? 'button'} class={className} class:primary disabled={disabled || busy} aria-busy={busy}>
  {@render children?.()}
</button>
