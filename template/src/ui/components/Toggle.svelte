<script lang="ts">
  let {
    checked = $bindable(false),
    label,
    disabled = false,
  }: { checked?: boolean; label: string; disabled?: boolean } = $props();
</script>

<label class="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
  <input
    class="relative h-5 w-9 shrink-0 cursor-pointer appearance-none rounded-full border border-input bg-muted transition-colors checked:bg-primary disabled:opacity-50 after:absolute after:top-0.5 after:left-0.5 after:size-3.5 after:rounded-full after:bg-foreground after:transition-transform checked:after:translate-x-4 checked:after:bg-primary-foreground"
    type="checkbox"
    role="switch"
    aria-checked={checked}
    bind:checked
    {disabled}
  >
  <span>{label}</span>
</label>
