<script>
  import {onMount} from 'svelte'
  import Download from '../components/Download.svelte'
  import LocationManager from '../components/LocationManager.svelte'
  import { createEventDispatcher } from 'svelte'
  import router from 'page'
  const dispatch = createEventDispatcher();
  import { DateTime } from 'luxon'

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
  })

  function forward(event) {
		dispatch('notif', event.detail);
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
    <span>{createDate && createDate.toLocaleString(DateTime.DATE_HUGE)} à {createDate && createDate.toLocaleString(DateTime.TIME_24_SIMPLE)}</span>
</div>

<style>
  #profile{
    margin: 4em -.5em 2em -.5em;
    border-radius: 3px;
    border: 1px solid var(--dark-blue);
    padding: 1em;
  }

  #profile span{
    display: inline-block;
    margin-left: 1em;
    margin-bottom: .7em;
  }

  label{
    font-size: .9em;
  }
  h2{
    margin-bottom: .8em;
  }
</style>
