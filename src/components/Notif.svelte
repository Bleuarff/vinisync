<!-- Noification bar -->

<script>
  export let delay = 4000
  let messages = []

  // show new message
  export function show({text, err, confirm}){
    const msg = {
      text: text,
      error: !!err,
      confirm: !!confirm,
      id: Math.random().toString(36).substring(2)
    }

    messages = [...[msg], ...messages]

    // no confirm: auto-close notif
    if (!msg.confirm)
      setTimeout(() => { close(msg.id) }, delay)
  }

  //remove msg from
  function close(id){
    messages = messages.filter(x => x.id !== id)
  }
</script>

<div id="notifs">
  {#each messages as msg}
    <div class="notif" class:error={msg.error}>
      <span class="msg">{msg.text}</span>
      {#if msg.confirm}
        <span on:click={close(msg.id)} class="confirm-cta">OK</span>
      {/if}
    </div>
  {/each}
</div>

<style>
  #notifs{
    --confirm-color: #f2e788;

    position: fixed;
    bottom: 0;
    left: 0;
    width: 100vw;
    padding: 0;
    color: white;
    max-width: var(--global-max-width);
    margin: auto;
  }

  .notif{
    width: 100%;
    padding: 1em;
    background: #188630;

    display: flex;
    flex-flow: row nowrap;
    justify-content: space-between;
  }

  .notif:not(:first-child){
    border-top: 1px solid rgba(0, 0, 0, .2);
  }

  .notif:first-child{
    border-top-left-radius: 3px;
    border-top-right-radius: 3px;
  }

  .notif.error{
    background: #be1c1c;
  }

  .msg{
    flex: 1 0;
  }

  .confirm-cta{
    flex: 0 1;
    color: var(--confirm-color);
    cursor: pointer;
    padding: 0 0 0 2em;
  }
</style>
