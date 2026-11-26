<script lang="ts">
  import { errorMessage } from '../../core/logger';
  import { observePermission, permissions } from '../../core/permissions';
  import Button from './Button.svelte';
  import Card from './Card.svelte';
  import StatePanel from './StatePanel.svelte';
  import Status from './Status.svelte';
  import { onMount } from 'svelte';

  const permission = { permissions: ['notifications'] };
  let ready = $state(false);
  let granted = $state(false);
  let busy = $state(false);
  let error = $state('');
  let status = $state('');
  let stop = () => {};

  function load() {
    stop();
    ready = false;
    error = '';
    stop = observePermission(permission, (value) => {
      granted = value;
      ready = true;
      error = '';
    }, (cause) => { error = errorMessage(cause); });
  }
  onMount(() => { load(); return () => stop(); });

  async function change() {
    busy = true;
    error = '';
    status = '';
    try {
      // Request is issued directly in the click handler, before any await.
      const result = granted ? await permissions.remove(permission) : await permissions.request(permission);
      granted = await permissions.contains(permission);
      status = result ? (granted ? 'Access granted' : 'Access removed') : 'Permission not changed';
    } catch (cause) {
      error = errorMessage(cause);
    } finally {
      busy = false;
    }
  }
</script>

<Card title="Optional notifications">
  <p>Demonstrates requesting browser permission only when you choose to grant access. No notifications are sent.</p>
  {#if !ready}
    <StatePanel kind={error ? 'error' : 'loading'} message={error || 'Checking permission…'} retry={error ? load : undefined} />
  {:else}
    <p>Access: {granted ? 'Granted' : 'Not granted'}</p>
    <Button onclick={change} {busy}>{granted ? 'Remove notification access' : 'Grant notification access'}</Button>
    <Status message={error || status} kind={error ? 'error' : 'info'} />
  {/if}
</Card>
