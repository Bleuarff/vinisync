<script>
  import { onMount } from 'svelte'
  import { repo } from '../storage.js'
  import Utils from '../utils.js'
  import { v4 as uuid} from 'uuid'
  import router from 'page'
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
      await repo.deleteAllTables()
      return router('/wines')
    }
    catch(ex){
      console.error(ex)
      dispatch('notif', {text: ex.message, err: true, confirm: true})
    }
  }

</script>

<div class="nav">
  <a href="/signup">Créer un compte</a>
</div
>
<h2>Connexion</h2>

<form>
  <label>Email</label>
  <input type="email" bind:value={email}>

  <label>Mot de passe</label>
  <input type="password" bind:value={pwd}>

  <div></div>
  <button on:click={signin} disabled="{!email || !pwd}">Connexion</button>
  <a href="/pwd-reset">Mot de passe oublié ?</a>
</form>

<style>
  input{
    width: 100%;
    max-width: 25em;
  }

  label, button{
    margin-top: 1.2em;
  }

  button{
    color: white;
    background: #ba0e0e;
    border: 1px solid white;
    border-radius: 4px;
    font-size: 1.3em;
  }

  .nav{
    display: flex;
    flex-direction: row-reverse;
  }
</style>
