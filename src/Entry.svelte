<script>
import { onMount } from 'svelte'
import { repo } from './storage.js'
import router from 'page'

export let params
let entry = {
  wine: {
    appellation: '',
    producer: '',
    name: '',
    year: null,
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
  creationDate: '',
  lastUpdateDate: ''
}

let edit = false
let showSave = false
let error = null

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
    error = null
  }
  catch(ex){
    console.log('Validation error: ' + ex.message)
    error = ex.message
    return
  }

  try{
    if (params.id)
      await repo.updateEntry(entry)
    else{
      const id = await repo.addEntry(entry)
      return router(`entry/${id}`)
    }

    showSave = true
    setTimeout(() => { showSave = false}, 2500)
    console.debug(`${entry.id} saved`)
  }
  catch(ex){
    console.error(`${entry.id || 'new entry'} save error`)
    error = 'Save error'
  }
}

function sanitizeEntry(){
  entry.wine.cepages = cepageText.split(',').filter(c => !!c).map(c => c.trim())

  if (!entry.wine.name && !entry.wine.producer)
    throw new Error('Producteur ou cuvée obligatoire')

  if (entry.wine.year && (entry.wine.year < 1700 || entry.wine.year > (new Date()).getFullYear()))
    throw new Error('Millésime invalide')
}

async function increment(){
  entry.count = entry.count + 1
  await save()
}
async function decrement(){
  entry.count = Math.max(0, entry.count - 1)
  await save()
}

async function deleteEntry(){
  const res = confirm("Supprimer ?")
  if (res){
    try{
      await repo.deleteEntry(entry.id)
      router('/wines')
    }
    catch(ex){
      console.error(ex)
      error = 'Error de suppression'
    }
  }
}

</script>

<!-- <p>{serialized}</p> -->
<a href="/wines">back to list</a>
<h1>Entry</h1>

{#if entry}
  <label>Cuvée</label><input bind:value={entry.wine.name} type="text">
  <label>Producteur</label> <input type="text" bind:value={entry.wine.producer}>
  <label>Appellation</label><input type="text" bind:value={entry.wine.appellation}>
  <label>Millésime</label><input type="number" bind:value={entry.wine.year}>
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
    <input type="text" bind:value="{entry.wine.containing}" placeholder="0.75">
  {:else}
    <span>{entry.wine.containing}</span>
  {/if}

  <label>Couleur</label>
  {#if edit}
    <input type="text" bind:value={entry.wine.color} placeholder="rouge">
  {:else}
    <span>{entry.wine.color}</span>
  {/if}

  <div id="attrs">
    <input type="checkbox" bind:value={entry.wine.sweet} id="sweet"><label for="sweet">Moelleux, Liquoreux</label>
    <input type="checkbox" bind:value={entry.wine.sparkling} name="sparkling"><label for="sparkling">Pétillant</label>
  </div>

  <label>Emplacement</label>
  {#if edit}
    <input type="text" bind:value={entry.location} placeholder="rouge">
  {:else}
    <span>{entry.location}</span>
  {/if}

  <div>
    {#if edit}
      <button on:click="{save}">Save</button>
      {#if params.id}
      <button on:click="{()=>{ edit = false }}">Annuler</button>
      <button on:click="{deleteEntry}">Supprimer</button>
      {/if}
    {:else}
      <button on:click="{()=>{ edit = true }}">Edit</button>
      <button on:click="{increment}">+1</button>
      <button on:click="{decrement}">-1</button>
    {/if}
  </div>

{:else}
  <p>Cannot retrieve entry {params.id}</p>
{/if}

{#if showSave}
  <div class="toast saved">Entry saved</div>
{/if}

{#if error}
  <div class="toast error">{error}</div>
{/if}

{#if params.id}
  <p class="timestamps">creation {entry.creationDate.substring(0, 16)} - MaJ {entry.lastUpdateDate.substring(0, 16)}</p>
{/if}

<style>
  .toast{
    color: white;
    padding: 4px 1em;
  }
  .saved{
    background: #00771a;
  }
  .error{
    background: #ed2c2c;
  }

  label{
    display: inline;
  }

  .timestamps{
    font-size: .8em;
  }
</style>
