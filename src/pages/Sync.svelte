<script>
  import { onMount } from 'svelte'
  import { repo } from '../storage.js'
  import { send } from '../fetch.js'
  import syncMgr from '../syncMgr.js'
  import { v4 as uuid } from 'uuid'
  import { createEventDispatcher } from 'svelte'
  const dispatch = createEventDispatcher();
  export let params = {}

  let config = {
    key: 'sync',
    enabled: false, // whether sync is activate on this device
    email: 'a@a',
    userkey: '',
    lastSync: '1970-01-01T00:00:00.000Z', // ts of last sync. Different than ts of last update received.
    devid: '' // unique node id - to filter-out updates by self
  }
  let firstSync = false

  let isLink = false // true to sync with existing & future device(s) with same userkey
  let showKey = false // true to show userkey

  $:readableUserkey = config.userkey ?
      config.userkey.substring(0,4) + '-' + config.userkey.substring(4,8) + '-' + config.userkey.substring(8,10) : ''


  onMount(async () => {
    console.log('mount /sync')
    try{
      await repo.open()
      config = (await repo.getOne('config', config.key)) || config
    }
    catch(ex){
      console.error('Get sync config error')
    }
  })

  // activate sync
  async function setSync(){
    if (!/.+@.+/.test(config.email))
      dispatch('notif', {text: 'email invalide', err: true})

    if (config.userkey){
      config.userkey = config.userkey.replace(/[\s-]+/g, '')
      if (!verifyChecksum(config.userkey))
        dispatch('notif', {text: 'clef de sync invalide', err: true})
    }

    if (!config.devid)
      config.devid = uuid()

    if (config.userkey)
      await useSync()
    else
      await createSync()
  }

  async function useSync(){
    config.enabled = true
    await repo.insertOne('config', config)
    await repo.deleteAll('entries') // delete all local entries

    syncMgr.checkUpdates() // request updates from server
    // config.enabled = true // TODO: activate sync in the future
  }

  async function createSync(){
    config.userkey = createUserKey()
    console.debug(`userkey: ${config.userkey}`)

    try{
      const data = await send('/api/sync', 'POST', {email: config.email, userkey: config.userkey })
      config.enabled = true
      await repo.insertOne('config', config)
      firstSync = true
      syncMgr.start()
    }
    catch(ex){
      let msg
      if (ex.status === 400)
        msg = ex.reason
      if (ex.status === 403)
        msg = 'Cet email est enregistré avec une autre clé.'

      dispatch('notif', {text: msg || ex.message, err: true})
    }
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
    const checksum = computeChecksum(key)
    return key + checksum
  }

  // computes a checksum:
  // takes key chars 2 by 2, get corresponding number and sums them.
  // we do a modulo 256 to get a uint8 number, returned as hex
  function computeChecksum(key){
    let sum = 0
    for (let i = 0; i < 8; i+=2){
      const val = parseInt(key.substring(i, i+2), 16)
      sum += val
    }
    const remainder = sum % 256
    const checksum = remainder.toString(16).toUpperCase().padStart(2, 0)
    return checksum
  }

  // returns whether the key is valid, i.e. the checksum is valid
  function verifyChecksum(key){
    const base = key.substring(0, 8),
          checksum = key.substring(8, 10)

    const computedChecksum = computeChecksum(base)
    return checksum === computedChecksum
  }

  // copy userkey to clipboard
  // IDEA: share btns (email, whatsapp) ?
  function copyKey(){
    // creates text box with value to copy
    var nd = document.createElement('input')
    nd.setAttribute('type', 'text')
    nd.classList.add('copy', 'invisible')
    nd.value = readableUserkey
    document.body.appendChild(nd)
    nd.focus()
    nd.setSelectionRange(0, readableUserkey.length)
    document.addEventListener('copy', onCopy)
    document.execCommand('copy')
  }

  // Removes textbox after a copy event
  function onCopy(){
    setTimeout(() => {
      document.querySelector('.copy').remove()
      document.removeEventListener('copy', onCopy)
    }, 20)
  }

</script>

<a href="/wines" class="back">liste</a>
<h2>Sync</h2>

{#if config.enabled}
  <p>
    La synchronisation est activée pour cet appareil.<br>
    Pour synchroniser un autre appareil, aller sur la page de synchro et rentrer l'email associé et votre clé.
  </p>
  <p>Email associé: {config.email}</p>
  <button on:click="{() => {showKey = !showKey}}">{showKey ? 'Masquer' : 'Voir'} la clé</button>
  {#if showKey}
    <p>
      Votre cle: {readableUserkey}
      <button on:click={copyKey}>Copier</button>
    </p>
  {/if}
  <!-- TODO: show sync details: last sync, # devices, etc. -->

  {#if firstSync}
  <p>Sychronisation en cours...</p>
  {/if}

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
      <p class="warning">&#x26a0; Ceci effacera votre cave actuelle !
        <!-- TODO: afficher nb ref & bouteilles ? -->
      </p>
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

  .warning{
    background: #d21a30;
    color: white;
    padding: 4px 1em;
    font-size: 1.1em;
  }
</style>
