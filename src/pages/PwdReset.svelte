<script>
  import { send } from '../fetch.js'
  import { createEventDispatcher } from 'svelte'
  const dispatch = createEventDispatcher();

  let email = ''

  async function sendReset(e){
    e.preventDefault()
    e.stopPropagation()

    if (!email) return

    // send to server
    try{
      await send('/api/pwdreset', 'POST', {email: email})
    }
    catch(ex){
      console.error(ex)
      dispatch('notif', {text: 'Erreur', err: true})
    }
  }
</script>

<h2>Réinitialisation du mot de passe</h2>

<p>
Saisissez votre adresse mail, et nous vous enverrons un message pour rétablir votre mot de passe.
</p>

<input type="email" bind:value={email}>
<button on:click={sendReset} disabled={!email}>Envoyer</button>



<style>
  input{
    width: 100%;
    max-width: 25em;
  }
</style>
