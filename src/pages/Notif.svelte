<!-- Noification bar -->

<script>
  export let msg = ''
  export let delay = 2500

  let hidden = true
  let error = false

  export function show({text, err}){
    msg = text
    error = !!err
    hidden = false
    setTimeout(() => {
      hidden = true
      msg = ''
    }, delay)
  }
</script>

<div class="notif" class:hidden class:error>
  <span class="msg">{msg}</span>
</div>

<style>
  .notif{
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100vw;
    padding: 5px 1em;
    color: white;
    background: #188630;
  }

  .notif.error{
    background: #be1c1c;
  }
</style>
