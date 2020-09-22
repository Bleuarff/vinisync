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

  const PWD_MIN_LENGTH = 10

  let email = ''
  let pwd
  let pwd2
  let isValidPwd = false
  let isValidEmail = false

  $: isValidPwd = pwd && pwd2 && pwd.length >= PWD_MIN_LENGTH && pwd === pwd2
  $: isValidEmail = email && email.match(/.+@.+/)


  async function createUser(e){
    e.preventDefault()
    console.log('try create user')
    if (!isValidEmail){
      dispatch('notif', {text: `Email invalide`, err: true})
      return
    }
    if (!isValidPwd){
      dispatch('notif', {text: `Mot de passe invalide`, err: true})
      return
    }

    try{
      const res =  await send('/api/user', 'PUT', {
        email: email,
        pwd: pwd
      })
      dispatch('notif', {text: 'Compte créé'})
      return router('/wines')
    }
    catch(ex){
      console.log(ex)
      dispatch('notif', {text: ex.message, err: true, confirm: true})
    }
  }

</script>

<h2>Création d'un compte</h2>

<form>
  <label>Email</label>
  <input type="text" bind:value={email}>

  <label>Mot de passe</label>
  <input type="password" bind:value={pwd}>
  {#if !pwd || pwd.length < PWD_MIN_LENGTH}
    <span class="pwd-err">{PWD_MIN_LENGTH} charactères minimum</span>
  {/if}

  <label>Confirmation du mot de passe</label>
  <input type="password" bind:value={pwd2}>
  {#if (pwd || pwd2) && pwd !== pwd2}
    <span class="pwd-err">Confirmation incorrecte</span>
  {/if}

  <p class="rgpd-notif">Promis on ne fait rien de vos information, elle ne seront pas vendues.</p>

  <button on:click={createUser} disabled={!isValidPwd || !email}>Créer</button>
</form>

<style>
</style>
