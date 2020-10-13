<script>
  import Download from '../components/Download.svelte'
  import LocationManager from '../components/LocationManager.svelte'
  import { createEventDispatcher } from 'svelte'
  const dispatch = createEventDispatcher();

  function forward(event) {
		dispatch('notif', event.detail);
	}
</script>

<h1>Paramètres</h1>

<Download></Download>

<LocationManager on:notif={forward}></LocationManager>
