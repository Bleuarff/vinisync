<script>
import { onMount } from 'svelte'
import { repo } from '../storage.js'
import router from 'page'
import { createEventDispatcher } from 'svelte'
const dispatch = createEventDispatcher();

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
  offeredBy: '',
  creationDate: '',
  lastUpdateDate: ''
}

let edit = false

let cepageText = entry.wine.cepages.join(', ') //intermediate for cepage text input values
$: serialized = JSON.stringify(entry)

onMount(async () => {
  await repo.open()

  edit = !params.id
  if (params.id)
    entry = await repo.getOne('entries', params.id)
})

async function save(){
  try{
    sanitizeEntry()
  }
  catch(ex){
    dispatch('notif', {text: ex.message, err: true})
    return
  }

  try{
    let msg
    if (params.id){
      await repo.updateEntry(entry)
      msg = 'Mise à jour OK'
    }
    else{
      const id = await repo.addEntry(entry)
      msg = 'Bouteille ajoutée'
      router(`/entry/${id}`) // soft redirect: address bar updated but
    }
    edit = false
    dispatch('notif', {text: msg})
  }
  catch(ex){
    console.error(ex)
    dispatch('notif', {text: 'Echec de save', err: true})
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
      dispatch('notif', {text: 'Erreur de suppression', err: true})
    }
  }
}

</script>

<a href="/wines" class="back">liste</a>

<div id="entry">
<!-- <p>{serialized}</p> -->

{#if entry}
    {#if edit || entry.wine.name}<label>Cuvée</label><input bind:value={entry.wine.name} type="text" disabled={!edit}>{/if}
    {#if edit || entry.wine.producer}<label>Producteur</label> <input type="text" bind:value={entry.wine.producer} disabled={!edit}>{/if}
    {#if edit || entry.wine.appellation}<label>Appellation</label><input type="text" bind:value={entry.wine.appellation} disabled={!edit}>{/if}
    {#if edit || entry.wine.year}<label>Millésime</label><input type="number" bind:value={entry.wine.year} disabled={!edit}>{/if}
    {#if edit || entry.wine.country}<label>Pays</label><input type="text" bind:value={entry.wine.country} disabled={!edit}>{/if}

    <label>Apogée</label>
    <div class="apogee">
      <span>de</span>
      <input type="number" bind:value={entry.wine.apogeeStart} disabled={!edit}>
      <span>à</span>
      <input type="number" bind:value={entry.wine.apogeeEnd} disabled={!edit}>
    </div>

    <label>Bouteilles</label><input type="number" bind:value={entry.count} disabled={!edit}>

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
      <input type="checkbox" bind:value={entry.wine.sparkling} id="sparkling"><label for="sparkling">Pétillant</label>
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

  {#if params.id}
    <div class="timestamps">creation {entry.creationDate.substring(0, 16)} - MaJ {entry.lastUpdateDate.substring(0, 16)}</div>
  {/if}
</div>

<style>
  #entry{
    width: 100%;
    position: relative;
    padding-bottom: 2em;
    margin-top: 1.2em;
  }

  label{
    display: block;
    font-size: .8em;
    user-select: none;
  }

  input{
    border: none;
    border-bottom: 1px solid var(--main-color-light);
    border-radius: 0;
    padding-top: 1px;
    padding-bottom: 3px;
  }

  input[type="text"]:focus{
    border-color: #bb072d;
  }

  input[disabled]{
    background: white;
    color: #333;
    border-bottom-color: transparent;
  }

  .apogee{
    display: flex;
    flex-flow: row nowrap;
    justify-content: flex-start;
  }

  .apogee > span {
    flex: 0 1 auto;
    /* min-width: 1em;
    max-width: 50%; */
  }
  .apogee > input {
    flex: 1 0 auto;
    max-width: 7em;
    text-align: center;
    /* min-width: 1em;
    max-width: 50%; */
  }

  .timestamps{
    position: absolute;
    width: 100%;
    bottom: 0;
    font-size: .8em;
    text-align: center;
  }
</style>
