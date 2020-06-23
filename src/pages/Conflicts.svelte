<script>
  import {onMount} from 'svelte'
  import { repo } from '../storage.js'
  import moment from 'moment'

  let conflicts = []

  onMount(async () => {
    await repo.open()
    load()
  })

  async function load(){
    // get conflicts docs
    conflicts = repo.getAll('conflicts')
  }
</script>

<h2>Conflits</h2>

{#if conflicts.length}
  {#each conflicts as conflict}

  {/each}

{:else}
  <span class="empty">Pas de conflits.</span>
{/if}

<style>

  .empty{
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);

  }
</style>
