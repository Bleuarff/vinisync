<script>
  import { onMount, createEventDispatcher } from 'svelte'
  import { repo } from '../storage.js'
  import Utils from '../utils.js'
  import { v4 as uuid} from 'uuid'
  import router from 'page'
  import moment from 'moment'
  import { send } from '../fetch.js'
  import Credentials from '../components/Credentials.svelte'
  const dispatch = createEventDispatcher()

  async function createUser(e){
    console.debug('try create user')

    try{
      const user =  await send('/api/user', 'PUT', {
        email: e.detail.email,
        pwd: e.detail.pwd
      })
      dispatch('notif', {text: 'Compte créé'})

      localStorage.clear()
      localStorage.setItem('user', JSON.stringify(user))
      localStorage.setItem('lastSync', '1900-01-01T00:00:00.000Z')
      localStorage.setItem('devid', uuid())

      await repo.open()
      await repo.deleteAllTables()
      return router('/wines')
    }
    catch(ex){
      console.log(ex)
      dispatch('notif', {text: ex.message, err: true, confirm: true})
    }
  }

  function forward(event) {
		dispatch('notif', event.detail);
	}
</script>

<div class="nav">
  <a href="/signin">Se connecter</a>
</div>

<h2>Création d'un compte</h2>

<Credentials on:submit={createUser} on:notif={forward}></Credentials>

<p class="rgpd-notif">Promis on ne fait rien de vos information, elle ne seront pas vendues.</p>

<style>
  .nav{
    display: flex;
    flex-direction: row-reverse;
  }
</style>
