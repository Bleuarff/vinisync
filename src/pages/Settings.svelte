<script>
  import {onMount} from 'svelte'
  import Download from '../components/Download.svelte'
  import LocationManager from '../components/LocationManager.svelte'
  import { repo } from '../storage.js'
  import { createEventDispatcher } from 'svelte'
  import router from 'page'
  const dispatch = createEventDispatcher();
  import { DateTime } from 'luxon'
  import syncMgr from '../syncMgr.js'
  import { clearKey } from '../fetch.js'

  let email
  let createDate

  onMount(() => {
    try{
      const user = JSON.parse(localStorage.getItem('user'))

      if (!user)
        return router('/')

      email = user.email
      createDate = DateTime.fromISO(user.createDate).setLocale(document.documentElement.lang)
    }
    catch(ex){
      console.error(ex)
    }
    document.title += ' Paramètres'
  })

  function forward(event) {
		dispatch('notif', event.detail);
	}

  async function clearAll(){
    const confirmed = confirm('Supprimer toutes les données sur cet appareil ?')

    if (!confirmed)
      return

    try{
      await repo.open()
      await repo.clearAll()
      localStorage.clear() // delete all localStorage
      syncMgr.clear() // clear cached data in sync logic
      clearKey() // deletes crypto key used to sign messages
      return router('/')
    }
    catch(ex){
      console.error(ex)
      dispatch('notif', {text: 'Erreur de suppression', err: true})
    }
  }
</script>

<h1>Paramètres</h1>

<Download></Download>

<LocationManager on:notif={forward}></LocationManager>

<div id="profile">
  <h2>Profil</h2>
    <!-- TODO: make it editable -->
    <label>email</label>
    <span>{email}</span>

    <label>Créé le</label>
    <span>{createDate && createDate.toFormat('cccc dd LLLL à HH:mm')}</span>
</div>

<div class="danger">
  <p>Ce bouton supprime toutes les données sur cet appareil. Vous les récuperez en vous reconnectant.</p>
  <button on:click={clearAll}>Supprimer les données locales</button>
</div>

<div id="version">build __BUILD__@__BUILDDATE__</div>

<style type="text/less">
  #profile{
    margin: 4em -.5em 2em -.5em;
    border-radius: 3px;
    border: 1px solid var(--dark-blue);
    padding: 1em;

    span{
      display: inline-block;
      margin-left: 1em;
      margin-bottom: .7em;
    }
  }

  label{
    font-size: .9em;
  }
  h2{
    margin-bottom: .8em;
  }

  .danger{
    padding: .5em;
    border-radius: 4px;
    border: 1px solid red;
    /* color: white; */
  }

  .danger button{
    color: red;
    text-align: center;
  }

  #version{
    font-size: .8em;
    text-align: center;
    margin-top: 10rem;
  }
</style>
