<script>
import { onMount } from 'svelte'
import FormText from '../components/FormText.svelte'
import Apogee from '../components/Apogee.svelte'
import Cepages from '../components/Cepages.svelte'
import Color from '../components/Color.svelte'
import { repo } from '../storage.js'
import syncMgr from '../syncMgr.js'
import Utils from '../utils.js'
import { v4 as uuid} from 'uuid'
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

let edit = false,
    refEntry // clone of the entry fresh out of db, to get diff of modifications

$: serialized = JSON.stringify(entry)

onMount(async () => {
  await repo.open()

  refEntry = null
  edit = !params.id
  if (params.id){
    entry = await repo.getOne('entries', params.id)
    if (entry){
      refEntry = Utils.deepClone(entry)
      syncMgr.checkUpdates(params.id)
      .then(async updated => {
        if (updated)
          entry = await repo.getOne('entries', params.id)
      })
    }
  }
})

// validation, save logic & sync
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
    if (params.id){ // update existing entry
      // timestamp validation: make sure the reference data before modification
      //  is the last version (not updated in background during edition process).
      const dbRef = await repo.getOne('entries', params.id)
      if (dbRef && (refEntry.lastUpdateDate < dbRef.lastUpdateDate))
        throw new Error('DB OBJECT EDITED SINCE YOU OPENED IT') // TODO:save for resolution?
      await repo.updateDoc('entries', entry)
      msg = 'Mise à jour OK'
    }
    else{ // create new entry
      entry.id = uuid()
      entry = await repo.insertOne('entries', entry)
      msg = 'Bouteille ajoutée'
      router(`/entry/${entry.id}`) // soft redirect: address bar updated but
    }

    console.log('sync update')
    syncMgr.syncIt(entry, refEntry, 'entry', 'entries')

    edit = false
    refEntry = Utils.deepClone(entry) // refresh reference object after a save
    dispatch('notif', {text: msg})
  }
  catch(ex){
    console.error(ex)
    dispatch('notif', {text: 'Echec de save', err: true})
  }
}

function sanitizeEntry(){
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

</script>

<a href="/wines" class="back">liste</a>

<div id="entry">
<!-- <p>{serialized}</p> -->

{#if entry}
    <!-- {#if edit || entry.wine.name}<label>Cuvée</label><input bind:value={entry.wine.name} type="text" readonly={!edit}>{/if} -->
    <FormText bind:value={entry.wine.name} readonly={!edit} label="Cuvée" placeholder="Vigneron Inconnu"></FormText>
    <FormText bind:value={entry.wine.producer} readonly={!edit} label="Producteur" placeholder="Guigal"></FormText>
    <FormText bind:value={entry.wine.appellation} readonly={!edit} label="Appellation" placeholder="Jasnières"></FormText>
    <div class="line">
      {#if edit || entry.wine.year}
      <div class="year">
        <FormText bind:value={entry.wine.year} readonly={!edit} label="Millésime" type="year"></FormText>
      </div>
      {/if}
      <div>
        <FormText bind:value={entry.wine.country} readonly={!edit} label="Pays" type="text"></FormText>
      </div>
    </div>

    <Apogee bind:start={entry.wine.apogeeStart} bind:end={entry.wine.apogeeEnd} readonly={!edit}></Apogee>

    <label>Bouteilles</label><input type="number" bind:value={entry.count} disabled={!edit}>

    <Cepages bind:cepages={entry.wine.cepages} readonly={!edit}></Cepages>

    <FormText bind:value={entry.wine.containing} readonly={!edit} label="Contenance" placeholder="75" type="containing"></FormText>

    <Color bind:value={entry.wine.color} readonly={!edit}></Color>

    {#if edit || entry.wine.sweet || entry.wine.sparkling}
    <div id="attributes">
      {#if edit || entry.wine.sweet}
      <div class="attr">
        <input type="checkbox" bind:checked={entry.wine.sweet} id="sweet" disabled={!edit}>
        <label for="sweet">Moelleux, Liquoreux</label>
      </div>
      {/if}
      {#if edit || entry.wine.sparkling}
      <div class="attr">
        <input type="checkbox" bind:checked={entry.wine.sparkling} id="sparkling" disabled={!edit}>
        <label for="sparkling">Pétillant</label>
      </div>
      {/if}
    </div>
    {/if}

    <label>Emplacement</label>
    {#if edit}
      <input type="text" bind:value={entry.location} placeholder="Armoire">
    {:else}
      <span>{entry.location}</span>
    {/if}

    <div>
      {#if edit}
        <button on:click="{save}">Save</button>
        {#if params.id}
        <button on:click="{()=>{ edit = false }}">Annuler</button>
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

  .line{
    display: flex;
    width: 100%;
    flex-flow: row nowrap;
    justify-content: space-between;
  }

  .line :last-child{
    width: auto;
  }

  .year{
    max-width: 9em;
    padding-right: 3em;
  }

  @media(min-width: 500px){
    .line{
      justify-content: flex-start;
    }
    .line :first-child{
      width: 30%;
    }
  }

  #attributes{
    display: flex;
    flex-flow: column nowrap;
    align-items: flex-start;
    margin: 20px 0;
    padding-left: 10px;
  }

  .attr{
    margin-bottom: 10px;
  }

  #attributes label{
    display: inline-block;
  }


  .timestamps{
    position: absolute;
    width: 100%;
    bottom: 0;
    font-size: .8em;
    text-align: center;
  }
</style>
