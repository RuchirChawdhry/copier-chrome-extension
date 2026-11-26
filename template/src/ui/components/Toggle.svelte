<script lang="ts">
  let { checked = $bindable(false), label, disabled = false }: { checked?: boolean; label: string; disabled?: boolean } = $props();
</script>

<label class="toggle">
  <input type="checkbox" role="switch" bind:checked {disabled} />
  <span>{label}</span>
</label>
