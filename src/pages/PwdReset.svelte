<script>
  import  { onMount, createEventDispatcher } from 'svelte'
  import { send } from '../fetch.js'
  import Credentials from '../components/Credentials.svelte'
  const dispatch = createEventDispatcher()

  export let params
  let email,
      requestCreated = false, // true when request for pwd reset is ok
      reqId, // id of the reset request
      notfound = false, // when server finds no request for given id
      resetDone = false

  onMount(async () => {
    reqId = params.id

    if (reqId){
      try{
        // query server for email
        const pwdreq = await send('/api/pwdreset/' + reqId)
        email = pwdreq && pwdreq.email
        notfound = !pwdreq || !email
      }
      catch(ex){
        console.error(ex)
        // dispatch('notif', {err: true, text: ex.message})
        notfound = true
      }
    }
  })

  // Send a reset request
  async function sendReset(e){
    debugger
    e.preventDefault()
    e.stopPropagation()

    if (!email) return

    // send to server
    try{
      await send('/api/pwdreset', 'POST', {email: email})
      requestCreated = true
    }
    catch(ex){
      console.error(ex)
      dispatch('notif', {text: 'Erreur', err: true})
    }
  }

  // sends new pwd to server
  async function resetPwd(e){
    try{
      await send('/api/user/pwd', 'POST', {email: email, reqid: reqId, pwd: e.detail.pwd})
      // on confirm, show link to signin page.
      resetDone = true
    }
    catch(ex){
      console.error(ex)
      dispatch('notif', {text: 'Erreur', err: true})
    }
  }

  function forward(event) {
		dispatch('notif', event.detail);
	}
</script>

<h2>Réinitialisation de votre mot de passe</h2>

{#if !reqId}
  <p>
  Saisissez votre adresse mail, et nous vous enverrons un message pour rétablir votre mot de passe.
  </p>

  <input type="email" bind:value={email}>
  <button on:click={sendReset} disabled={!email}>Envoyer</button>

  {#if requestCreated}
    <p>Un mail a été envoyé à <span class="bold">{email}</span>. Cliquez sur le lien qu'il contient dans les prochaines 24h.</p>
  {/if}
{:else if !notfound}
  {#if !resetDone}
    <p>Veuillez créer un nouveau mot de passe:</p>
    <Credentials mode='reset' on:submit={resetPwd} on:notif={forward}></Credentials>
  {:else}
    <p>Votre mot de passe a été modifié. Vous pouvez dès maintenant <a href="/signin">vous connecter</a>.</p>
  {/if}
{:else}
  <p>Votre demande est introuvable. Les demandes de réinitialisation ne sont valides que 24h.</p>
{/if}


<style>
  input{
    width: 100%;
    max-width: 25em;
  }

  .bold{
    font-weight: bold;
  }
</style>
