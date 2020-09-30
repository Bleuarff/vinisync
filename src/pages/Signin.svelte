<script>
  import { onMount } from 'svelte'
  import { repo } from '../storage.js'
  import Utils from '../utils.js'
  import { v4 as uuid} from 'uuid'
  import router from 'page'
  import moment from 'moment'
  import { send } from '../fetch.js'
  import { createEventDispatcher } from 'svelte'
  const dispatch = createEventDispatcher()

  let email
  let pwd

  async function signin(e){
    e.preventDefault()

    try{
      const user = await send('/api/signin', 'POST', {
        email: email,
        pwd: pwd
      })
      dispatch('notif', {text: 'Connexion OK'})

      localStorage.clear()
      localStorage.setItem('user', JSON.stringify(user))
      localStorage.setItem('lastSync', '1900-01-01T00:00:00.000Z')
      localStorage.setItem('devid', uuid())

      await repo.open()
      await repo.deleteAll('entries')
      await repo.deleteAll('images')
      await repo.deleteAll('history')
      await repo.deleteAll('conflicts')
      await repo.deleteAll('updates')
      return router('/wines')
    }
    catch(ex){
      console.error(ex)
      dispatch('notif', {text: ex.message, err: true, confirm: true})
    }
  }

</script>

<a href="/signup">Créer un compte</a>
<h2>Connexion</h2>

<form>
  <label>Email</label>
  <input type="email" bind:value={email}>

  <label>Mot de passe</label>
  <input type="password" bind:value={pwd}>

  <div></div>
  <button on:click={signin} disabled="{!email || !pwd}">Connexion</button>
</form>
