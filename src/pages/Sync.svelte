<script>
  import { onMount } from 'svelte'
  import {repo } from '../storage.js'
  import { createEventDispatcher } from 'svelte'
  const dispatch = createEventDispatcher();
  export let params = {}

  let config = {
    enabled: false, // whether sync is activate on this device
    email: '',
    userkey: ''
  }

  let isLink = false // true to sync with existing & future device(s) with same userkey

  onMount(async () => {
    console.log('mount /sync')
    try{
      await repo.open()
      config = (await repo.getOne('config', 'sync')) || config
    }
    catch(ex){
      console.error('Get sync config error')
    }
    // debugger
  })

  // activate sync
  function setSync(){
    if (!/.+@.+/.test(config.email))
      dispatch('notif', {text: 'email invalide', err: true})

    if (!/.+/.test(config.userkey))
      dispatch('notif', {text: 'clef de sync invalide', err: true})
  }

</script>

<h2>Sync</h2>

{#if config.enabled}
  <p>La synchronisation est activée pour cet appareil.</p>
  <!-- TODO: show sync details -->

{:else}
  <div>
    <p class="desc">
      Pour activer la synchronisation, entrez votre email.<br>
      Pour synchroniser avec un appareil utilisant déjà Vinisync, cochez la case
       correspondante et entrez votre clef utilisateur.
    </p>

    <div class="sync-link">
      <input type="checkbox" bind:checked={isLink} id="isLink">
      <label for="isLink">Synchroniser avec une instance existante</label>
    </div>

    <label for="email">Email</label>
    <input type="email" bind:value={config.email} placeholder="barney@poivrot.com">

    {#if isLink}
      <label for="">Clef</label>
      <input type="text" bind:value={config.userkey}>
    {/if}

    <div class="submit-ctnr">
      <button on:click={setSync}>Synchroniser</button>
    </div>
  </div>
{/if}

<style>
  label[for="isLink"]{
    display: inline;
  }

  .desc{
    text-align: justify;
  }

  .sync-link{
    margin-bottom: 1em;
  }

  .submit-ctnr{
    margin-top: 2em;
  }
</style>
