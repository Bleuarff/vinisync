<script>
  import { onMount } from 'svelte'
  import { repo } from '../storage.js'
  export let params

  let updates = []

  onMount(async () => {
    console.debug('history mount')
    await repo.open()
    load()
  })

  export async function load(){
    if (params.id){

    }
    else{
      updates = await repo.getAll('history')
    }
  }
</script>

<div id="history">

  {#if updates && updates.length > 0}
  {#each updates as update}
    <div>POUET
    </div>
  {/each}

  {:else}
    <div class="empty">
      Aucune modification enregistrée.
    </div>
  {/if}
</div>

<style>
  .empty{
    margin: 3em 1em 1em 1em;
    padding: 2em;
    text-align: center;
    border: 1px solid var(--main-color);
  }
</style>
