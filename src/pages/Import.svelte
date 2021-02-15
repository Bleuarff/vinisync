<script>
import { repo } from '../storage.js'
import router from 'page'
import syncMgr from '../syncMgr.js'
import { v4 as uuid} from 'uuid'
import { createEventDispatcher } from 'svelte'
import Utils from '../utils.js'
import Loader from '../components/Loader.svelte'
const dispatch = createEventDispatcher()
export let params

let fileUrl = ""
let loader

// load data from url
async function importUrl(e){
  let url
  try
  {
    url = new URL(fileUrl)
  }
  catch(ex){
    dispatch('notif', {text: 'Url invalide', err: true})
    return
  }

  try{
    const res = await fetch(url),
          dataset = await res.json()

    if (!Array.isArray(dataset))
      throw new Error('Dataset is not valid json array')

    insert(dataset)
  }
  catch(ex){
    console.error(ex)
    dispatch('notif', {text: 'Erreur d\'import', err: true})
  }

}

// delete existing data & insert new ones
async function insert(backup){
  loader.show()
  await repo.open()
  await repo.clearAll()

  if (Array.isArray(backup))
    await importEntries(backup) // old basic format
  else{
    // new, complete format as exported
    await importEntries(backup.entries)
    await importImages(backup.images)
  }

  loader.hide()
  router('/wines')
}

async function importEntries(entries){
  console.log(`${entries.length} entries in file`)
  const proms = []

  entries.forEach(entry => {
    entry.id = entry.id || uuid()
    proms.push(repo.insertOne('entries', entry))
    syncMgr.syncIt(entry, null, 'entry')

    const diff = {count: entry.count, wine: {}, creationDate: entry.creationDate}
    if (entry.wine.name) diff.wine.name = entry.wine.name
    if (entry.wine.producer) diff.wine.producer = entry.wine.producer
    if (entry.wine.year) diff.wine.year = entry.wine.year
    Utils.updateHistory(diff, entry.id, entry.lastUpdateDate)
  })
  await Promise.all(proms)
}

async function importImages(images){
  console.log(`${images.length} images in file`)
  const proms = []
  images.forEach(async image => {
    image.id = image.id || uuid()

    if (image.blob)
      image.blob = await Utils.getBlobFromBase64(image.blob)

    proms.push(repo.insertOne('images', image))
    syncMgr.syncIt(image, null, 'picture')
  })
  await Promise.all(proms)
}

function importFile(e){
  if (!e.currentTarget.files.length)
    return

  const file = e.currentTarget.files[0]
  const reader = new FileReader()
  reader.onload = async () => {
    // debugger
    const content = reader.result
    try{
      const backup = JSON.parse(content)
      insert(backup)
    }
    catch(ex){
      console.error(ex)
      dispatch('notif', {text: 'Erreur d\'import', err: true})
    }
  }
  reader.readAsText(file)
}

</script>

<a href="/wines" class="back">liste</a>
<h2>Importer</h2>

<p>Importe un fichier json.<br>
  <span class="wng">Ecrase toutes les entrées existantes</span>.
</p>

<input type="file" id="importer" on:change={importFile} accept="application/json">

<div id="sep">ou</div>

<label for="url">Importer un fichier web:</label>
<input type="text" id="url" placeholder="https://example.com/monbackup.json" bind:value={fileUrl}>
<button on:click={importUrl} disabled={!fileUrl}>Importer le lien</button>

<Loader bind:this={loader}></Loader>

<style>
  .wng{
    color: darkred;
  }

  #sep{
    margin: 1.7em 0;
  }

  #url{
    width: 100%;
  }
</style>
