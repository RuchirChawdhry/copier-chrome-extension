<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';

  let {
    children,
    primary = false,
    busy = false,
    disabled = false,
    class: className = '',
    ...rest
  }: HTMLButtonAttributes & {
    children?: Snippet;
    primary?: boolean;
    busy?: boolean;
  } = $props();
</script>

<button
  {...rest}
  type={rest.type ?? 'button'}
  class={['inline-flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50', primary ? 'border-primary bg-primary text-primary-foreground hover:opacity-90' : 'border-input bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground', className]}
  disabled={disabled || busy}
  aria-busy={busy}
>
  {@render children?.()}
</button>
