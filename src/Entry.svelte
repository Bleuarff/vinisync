<script>
import { onMount } from 'svelte'
import { repo } from './storage.js'

export let params
let entry = {
  wine: {
    appellation: '',
    producer: '',
    name: '',
    year: '',
    country: 'France',
    apogeeStart: null,
    apogeeEnd: null,
    cepages: [],
    containing: '0.75',
    color: '',
    sweet: false,
    sparkling: false
  },
  count: 6,
  location: '',
}

let edit = false
let saved = false

$: serialized = JSON.stringify(entry)

onMount(async () => {
  await repo.open()

  edit = !params.id
  if (params.id)
    entry = await repo.getEntry(params.id)
})

async function save(){
  await repo.addEntry(entry)
  saved = true
}


</script>

<!-- <p>{serialized}</p> -->
<a href="/wines">back to list</a>
<h1>Entry</h1>

{#if entry}
  <label>Cuvée</label><input bind:value={entry.wine.name} type="text">
  <label>Producteur</label> <input type="text" bind:value={entry.wine.producer}>
  <label>Appellation</label><input type="text" bind:value={entry.wine.appellation}>
  <label>Millésime</label><input type="text" bind:value={entry.wine.year}>
  <label>Pays</label><input type="text" bind:value={entry.wine.country}>

  <label>Apogée</label>
  de <input type="text" bind:value={entry.wine.apogeeStart}> à
  <input type="text" bind:value={entry.wine.apogeeEnd}>
  <label>Bouteilles</label><input type="number" bind:value={entry.count}>

  {#if edit}
    <div>
      <button on:click="{save}">Save</button>
    </div>
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

  label{
    display: inline;
  }
</style>
