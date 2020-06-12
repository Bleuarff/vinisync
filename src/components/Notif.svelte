<!-- Noification bar -->

<script>
  export let delay = 2500


  let messages = []

  export function show({text, err}){
    const msg = {text: text, error: !!err, id: Math.random().toString(36).substring(2)}
    messages = [...[msg], ...messages]
    setTimeout(() => {
      const idx = messages.findIndex(x => x.id === msg.id)

      if (idx !== -1){
        messages = [...messages.slice(0, idx), ...messages.slice(idx+1)]
      }
    }, delay)
  }
</script>

<div id="notifs">
  {#each messages as msg}
    <div class="notif" class:error={msg.error}>
      <span class="msg">{msg.text}</span>
    </div>
  {/each}
</div>

<style>
  #notifs{
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100vw;
    padding: 0;
    margin: 0;
    color: white;
  }

  .notif{
    padding: 5px 1px;
    width: 100%;
    padding: 5px 1em;
    background: #188630;
  }

  .notif.error{
    background: #be1c1c;
  }
</style>
