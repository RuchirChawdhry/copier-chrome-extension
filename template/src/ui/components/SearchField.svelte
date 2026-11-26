<script lang="ts">
  let { value = $bindable(''), label = 'Search', placeholder = 'Search…' }: { value?: string; label?: string; placeholder?: string } = $props();
</script>

<input class="search-field" type="search" aria-label={label} {placeholder} bind:value />
