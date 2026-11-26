<script lang="ts">
  let {
    checked = $bindable(false),
    label,
    disabled = false,
  }: { checked?: boolean; label: string; disabled?: boolean } = $props();
</script>

<label class="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
  <input
    class="peer sr-only"
    type="checkbox"
    role="switch"
    aria-checked={checked}
    bind:checked
    {disabled}
  >
  <span aria-hidden="true" class="relative h-5 w-9 shrink-0 rounded-full border border-input bg-muted transition-colors peer-checked:bg-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring peer-disabled:opacity-50 after:absolute after:top-0.5 after:left-0.5 after:size-3.5 after:rounded-full after:bg-foreground after:transition-transform peer-checked:after:translate-x-4 peer-checked:after:bg-primary-foreground"></span>
  <span>{label}</span>
</label>
