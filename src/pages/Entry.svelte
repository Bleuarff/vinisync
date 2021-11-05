<script>
import { onMount } from 'svelte'
import FormText from '../components/FormText.svelte'
import Apogee from '../components/Apogee.svelte'
import Cepages from '../components/Cepages.svelte'
import Color from '../components/Color.svelte'
import ImageEdit from '../components/ImageEdit.svelte'
import Location from '../components/Location.svelte'
import { repo } from '../storage.js'
import syncMgr from '../syncMgr.js'
import Utils from '../utils.js'
import { v4 as uuid} from 'uuid'
import router from 'page'
import { DateTime } from 'luxon'
import { createEventDispatcher } from 'svelte'
const dispatch = createEventDispatcher();

export let params
const COUNT_CHANGE_DELAY = 800 // delay before saving after a +/- 1, but still accepting count updates

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
    containing: '75',
    color: '',
    sweet: false,
    sparkling: false
  },
  count: 6,
  location: [],
  offeredBy: '',
  creationDate: '',
  lastUpdateDate: ''
}

let edit = false,
    refEntry, // clone of the entry fresh out of db, to get diff of modifications
    imageEditor,
    countChangeTimeoutId, // shared timeout id for increment/decrement operations
    backToHistory =  false,
    backToEmptyList = false

$: backUrl = backToHistory ? 'javascript:history.back()' : `/wines${backToEmptyList ? '/oldref' : ''}`

onMount(async () => {
  await repo.open()
  load()
  window.scrollTo(0, 0)
})

export async function load(){
  refEntry = null
  edit = !params.id
  if (params.id){
    entry = await repo.findById('entries', params.id)
    if (entry){
      refEntry = Utils.deepClone(entry)
      imageEditor.load(entry.id)
      syncMgr.checkUpdates(params.id)
      .then(async updated => {
        if (updated){
          entry = await repo.findById('entries', params.id)
          console.debug('entry updated: reload picture')
          imageEditor.load(entry.id)
        }
      })

      document.title += ` ${entry.wine.name || entry.wine.producer}${entry.wine.year ?  ' ' + entry.wine.year : ''} [${entry.count}]`
    }
    else{
      dispatch('notif', {text: `L'entrée n'existe pas`, err: true})
      return router('/wines')
    }
  }

  backToHistory = location.search.includes('fh=1')
  backToEmptyList = location.search.includes('fe=1')
}

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
    let msg = '',
        hasModif = true

    if (params.id){ // update existing entry
      // compute diff with ref doc. Skip save & sync if no modification
      const diff = await Utils.getDiff(entry, refEntry)
      hasModif = diff !== null

      if (hasModif){
        // timestamp validation: make sure the reference data before modification
        //  is the last version (not updated in background during edition process).
        const dbRef = await repo.findById('entries', params.id)

        if (dbRef && (refEntry.lastUpdateDate < dbRef.lastUpdateDate))
          throw new Error('DB OBJECT EDITED SINCE YOU OPENED IT')

        entry = await repo.updateDoc('entries', entry)
        msg = 'Mise à jour OK'
      }
    }
    else{ // create new entry
      entry.id = uuid()
      entry = await repo.insertOne('entries', entry)
      msg = 'Bouteille ajoutée'
      router(`/entry/${entry.id}`) // soft redirect: address bar updated but that's all
    }

    const imgOk = await imageEditor.save(entry.id)
    if (!imgOk)
      msg += '\nErreur sauvegarde de l\'image'

    if (hasModif){
      console.log('sync update: entry')
      syncMgr.syncIt(entry, refEntry, 'entry')
    }

    edit = false
    refEntry = Utils.deepClone(entry) // refresh reference object after a save

    if (msg)
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
  entry.count += 1

  if (!countChangeTimeoutId){
    countChangeTimeoutId = setTimeout(async () => {
      countChangeTimeoutId = null
      await save()
    }, COUNT_CHANGE_DELAY)
  }
}

async function decrement(){
  entry.count = Math.max(0, entry.count - 1)

  if (!countChangeTimeoutId){
    countChangeTimeoutId = setTimeout(async () => {
      countChangeTimeoutId = null
      await save()
    }, COUNT_CHANGE_DELAY)
  }
}

function sanitizeAppellation(e){
  if (entry.wine.country === 'France'){
    let val = e.detail.value
                  .normalize('NFC')
                  .replace(/\bst(e)?\b/ig, 'saint$1')
                  .replace(/\bsaint(e)?\b[^-]\b/g, 'Saint$1-')
                  .replace(/' +/g, '\'')

                  // \b is not enough for word boundary, accented chars are not considered letters,
                  // so use negative lookbehind.
                  .replace(/(?<![a-z\u00C0-\u017F])\b([a-z])(?=[a-z\u00C0-\u017F]+)/g, (m, l) => l.toUpperCase() ) // Capitalize words
                  // lowercase commmon prepositions when not in starting position.
                  .replace(/(?<!^)\b(et|au|aux|du|de|des|le|la|les|en|lès)\b/gi, (m, l) => l.toLowerCase() )

    console.debug(`${e.detail.value} -> ${val}`)
    entry.wine.appellation = val
  }
}

// toggles edit mode off
function quitEdit(e){
  edit = false
  entry = Utils.deepClone(refEntry)
  imageEditor.clearEdit()
}

</script>

<div class="nav">
  <a href="{backUrl}" class="back">{backToHistory ? 'historique général' : 'liste'}</a>
  {#if params.id}
    <a href="/history/{params.id}" class="forward">historique</a>
  {/if}
</div>

<div id="entry">
  {#if entry}
    <div class="top">
      <ImageEdit entryId={params.id} edit={edit} bind:this={imageEditor}></ImageEdit>
      <div class="headers">
        {#if !edit}
          {#if entry.wine.name}<div class="big">{entry.wine.name}</div>{/if}
          {#if entry.wine.producer}<div class="big">{entry.wine.producer}</div>{/if}
        {:else}
          <FormText bind:value={entry.wine.name} readonly={!edit} label="Cuvée" placeholder="Vigneron Inconnu"></FormText>
          <FormText bind:value={entry.wine.producer} readonly={!edit} label="Producteur" placeholder="Guigal"></FormText>
        {/if}
      </div>
    </div>

    <FormText bind:value={entry.wine.appellation} readonly={!edit} on:change={sanitizeAppellation} label="Appellation" placeholder="Jasnières"
      datasource="appellation">
    </FormText>
    <div class="line">
      {#if edit || entry.wine.year}
      <div class="year">
        <FormText bind:value={entry.wine.year} readonly={!edit} label="Millésime" type="year"></FormText>
      </div>
      {/if}
      <div>
        <FormText bind:value={entry.wine.country} readonly={!edit} label="Pays" type="text" placeholder="Syldavie" datasource="country"></FormText>
      </div>
    </div>

    <Apogee bind:start={entry.wine.apogeeStart} bind:end={entry.wine.apogeeEnd} readonly={!edit}></Apogee>

    <label>Bouteilles</label><input type="number" bind:value={entry.count} disabled={!edit}>

    <Cepages bind:cepages={entry.wine.cepages} readonly={!edit}></Cepages>

    <FormText bind:value={entry.wine.containing} readonly={!edit} label="Contenance" placeholder="75" type="containing" datasource="containing"></FormText>

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

    <Location readonly={!edit} bind:value={entry.location}></Location>
    <!-- <FormText bind:value={entry.location} readonly={!edit} label="Emplacement" placeholder="Cave 1, etagère 3" type="text"></FormText> -->
    <FormText bind:value={entry.offeredBy} readonly={!edit} label="Offert par" placeholder="Robert Parker" type="text"></FormText>


  {:else}
    <p>Cannot retrieve entry {params.id}</p>
  {/if}

  {#if params.id && entry}
    <!-- TODO: display local time -->
    <div class="timestamps">création {DateTime.fromISO(entry.creationDate).toFormat('dd/LL/yyyy à HH:mm')} - MàJ {DateTime.fromISO(entry.lastUpdateDate).toFormat('dd/LL/yyyy à HH:mm')}</div>
  {/if}
</div>

<div class="buttons-ctnr">
  <div class="buttons">
    {#if edit}
      <button on:click="{save}">Save</button>
      {#if params.id}
      <button on:click="{quitEdit}">Annuler</button>
      {/if}
    {:else}
      <button on:click="{()=>{ edit = true }}" class="edit">Edit</button>
      <button on:click="{increment}">+1</button>
      <button on:click="{decrement}">-1</button>
    {/if}
  </div>
</div>

<style lang="less">
  #entry{
    width: 100%;
    position: relative;
    padding-bottom: 2em;
    margin-top: 1.2em;
    margin-bottom: 4em;
  }

  .top{
    display: flex;
    flex-flow: row nowrap;
    margin: 0 -.9em .5em -.9em;

  }

  .big{
    font-size: 1.3em;
    margin-bottom: .6em;
  }

  .headers{
    flex-grow: 1;
    padding: 0 1em;
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

  .buttons-ctnr{
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
  }
  .buttons{
    max-width: var(--global-max-width);
    margin: auto;
    display: flex;
    flex-flow: row nowrap;
    justify-content: center;

    button {
      color: white;
      background: #ba0e0e;
      border: 1px solid white;
      border-radius: 4px;
      font-size: 1.3em;
      min-width: 4em;
      margin: 0 .5em;

      &:first-child{
        margin-left: 0;
      }

      &:last-child{
        margin-right: 0;
      }
    }
  }
  @media (max-width: 500px){
    .buttons{
      justify-content: space-evenly;
    }
  }

  .edit{
    width: 25%;
  }

  .nav{
    display: flex;
    justify-content: space-between;
  }
</style>
