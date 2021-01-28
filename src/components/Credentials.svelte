<script>
  import { createEventDispatcher } from 'svelte'
  const dispatch = createEventDispatcher()
  const PWD_MIN_LENGTH = 12

  export let mode = 'create'

  let email = '', pwd, pwd2
  let isValidPwd = false,
      isValidEmail = false

  $: isValidPwd = pwd && pwd2 && pwd.length >= PWD_MIN_LENGTH && pwd === pwd2
  $: isValidEmail = email && email.match(/.+@.+/)
  $: disabled = mode === 'create' ? !isValidEmail || !isValidPwd : !isValidPwd
  $: ctaText = mode === 'create' ? 'Créer mon compte': 'Réinitialiser'

  function submit(e){
    e.preventDefault()
    if (mode === 'create' && !isValidEmail){
      dispatch('notif', {text: `Email invalide`, err: true})
      return
    }
    if (!isValidPwd){
      dispatch('notif', {text: `Mot de passe invalide`, err: true})
      return
    }

    dispatch('submit', {email: email, pwd: pwd})
  }
</script>

<form>
  {#if mode === 'create'}
    <label>Email</label>
    <input type="email" bind:value={email}>
  {/if}

  <label>Mot de passe</label>
  <input type="password" bind:value={pwd}>
  {#if !pwd || pwd.length < PWD_MIN_LENGTH}
    <span class="pwd-err">{PWD_MIN_LENGTH} caractères minimum</span>
  {/if}

  <label>Confirmation du mot de passe</label>
  <input type="password" bind:value={pwd2}>
  {#if (pwd || pwd2) && pwd !== pwd2}
    <span class="pwd-err">Confirmation incorrecte</span>
  {/if}

  <button on:click={submit} disabled={disabled}>{ctaText}</button>
</form>
<style>
input{
  width: 100%;
  max-width: 25em;
}

button:disabled{
  opacity: .5;
}

label, button{
  margin-top: 1.2em;
}

.pwd-err{
  display: block;
  font-size: .8em;
  position: realtive;
}

button{
  display: block;
  color: white;
  background: #ba0e0e;
  border: 1px solid white;
  border-radius: 4px;
  font-size: 1.3em;
}
</style>
