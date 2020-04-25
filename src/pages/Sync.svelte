<script>
  import { onMount } from 'svelte'
  import {repo } from '../storage.js'
  import { createEventDispatcher } from 'svelte'
  const dispatch = createEventDispatcher();
  export let params = {}

  let config = {
    enabled: false, // whether sync is activate on this device
    email: 'a@a',
    userkey: ''
  }

  let userkey = ''
  let isLink = false // true to sync with existing & future device(s) with same userkey
  $: hr_key = userkey.substring(0,4) + '-' + userkey.substring(4,8) + '-' + userkey.substring(8,10)

  onMount(async () => {
    console.log('mount /sync')
    try{
      await repo.open()
      config = (await repo.getOne('config', 'sync')) || config
    }
    catch(ex){
      console.error('Get sync config error')
    }
  })

  // activate sync
  function setSync(){
    if (!/.+@.+/.test(config.email))
      dispatch('notif', {text: 'email invalide', err: true})

    if (config.userkey && !/.+/.test(config.userkey))
      dispatch('notif', {text: 'clef de sync invalide', err: true})

    if (!config.userkey)
      userkey = createUserKey()
  }

  // generates a random 4 bytes key + checksum
  function createUserKey(){
    let array = new Uint8Array(4);
    window.crypto.getRandomValues(array);
    // console.debug(array)
    let key = ''
    for (let i = 0; i < 4; i++){
      key += array[i].toString(16).toUpperCase().padStart(2, '0')
    }
    const checksum = getcheckSum(key)
    return key + checksum
  }

  // computes a checksum:
  // takes key chars 2 by 2, get corresponding number and sums them.
  // we do a modulo 256 to get a uint8 number, returned as hex
  function getcheckSum(key){
    let sum = 0
    for (let i = 0; i < 8; i+=2){
      const val = parseInt(key.substring(i, i+2), 16)
      sum += val
    }
    const remainder = sum % 256
    const checksum = remainder.toString(16).toUpperCase().padStart(2, 0)
    return checksum
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

    Votre cle: {hr_key}
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
