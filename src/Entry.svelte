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

let cepageText = entry.wine.cepages.join(', ') //intermediate for cepage text input values
$: serialized = JSON.stringify(entry)

onMount(async () => {
  await repo.open()

  edit = !params.id
  if (params.id)
    entry = await repo.getEntry(params.id)
})


async function save(){
  try{
    sanitizeEntry()
    if (params.id){
      // TODO update
    }
    else //save
      await repo.addEntry(entry)

    saved = true
  }
  catch(ex){
    // TODO show error
  }

}

function sanitizeEntry(){
  entry.wine.cepages = cepageText.split(',').filter(c => !!c).map(c => c.trim())

  // TODO: check for mandatory fields
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

  <label>Cepages</label>
    {#if edit}
      <input type="text" bind:value={cepageText} placeholder="muscat, sauvignon, malbec">
    {:else}
      {#each entry.wine.cepages as cepage}
        <span>{cepage}</span>
      {/each}
    {/if}

  <label>Contenance</label>
  {#if edit}
    <input type="text" v:bind={entry.wine.containing} placeholder="0.75">
  {:else}
    <span>{entry.wine.containing}</span>
  {/if}

  <label>Couleur</label>
  {#if edit}
    <input type="text" v:bind={entry.wine.color} placeholder="rouge">
  {:else}
    <span>{entry.wine.color}</span>
  {/if}

  <div id="attrs">
    <input type="checkbox" v:bind={entry.wine.sweet} id="sweet"><label for="sweet">Moelleux, Liquoreux</label>
    <input type="checkbox" v:bind={entry.wine.sparkling} name="sparkling"><label for="sparkling">Pétillant</label>
  </div>

  <label>Emplacement</label>
  {#if edit}
    <input type="text" v:bind={entry.location} placeholder="rouge">
  {:else}
    <span>{entry.location}</span>
  {/if}


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
