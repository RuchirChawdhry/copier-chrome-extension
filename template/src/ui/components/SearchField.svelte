<script lang="ts">
  let {
    value = $bindable(''),
    label = 'Search',
    placeholder = 'Search…',
  }: { value?: string; label?: string; placeholder?: string } = $props();
</script>

<input
  class="h-9 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground"
  type="search"
  aria-label={label}
  {placeholder}
  bind:value
>
