<script>
import { onMount } from 'svelte'
import { repo } from './storage.js'

export let params
let entry = {}

let edit = false
let saved = false

onMount(async () => {
  await repo.open()
  edit = !params.id
  if (params.id)
    entry = await repo.getOne(params.id)
})

async function save(){
  await repo.addEntry(entry)
  saved = true
}


</script>

<a href="/wines">back to list</a>
<h1>Entry</h1>

{#if entry}
  <label>Cuvée</label><input bind:value={entry.name} type="text">
  <label>Producteur</label> <input type="text" bind:value={entry.producer}>

  <!-- <p>{serialized}</p> -->
  {#if edit}
    <button on:click="{save}">Save</button>
  {/if}
{:else}
  <p>Cannot retrieve entry {params.id}</p>
{/if}

{#if saved}
  <div id="toast">Entry saved</div>
{/if}

<style>
  #toast{
    color: white;
    background: #00771a;
  }
</style>
