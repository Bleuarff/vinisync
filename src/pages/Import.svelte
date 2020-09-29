<script>
import { repo } from '../storage.js'
import router from 'page'
import syncMgr from '../syncMgr.js'
import { v4 as uuid} from 'uuid'
import { createEventDispatcher } from 'svelte'
const dispatch = createEventDispatcher()
export let params

let fileUrl = ""

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
async function insert(entries){
  console.log(`${entries.length} entries in file`)
  await repo.open()
  await repo.deleteAll('entries')
  await repo.deleteAll('images')
  await repo.deleteAll('history')
  await repo.deleteAll('conflicts')
  await repo.deleteAll('updates')
  const proms = []
  entries.forEach(entry => {
    entry.id = uuid()
    proms.push(repo.insertOne('entries', entry))
    syncMgr.syncIt(entry, null, 'entry', 'entries')
  })
  await Promise.all(proms)
  router('/wines')
}

function importFile(e){
  if (!e.currentTarget.files.length)
    return

  const file = e.currentTarget.files[0]
  const reader = new FileReader()
  reader.onload = async () => {
    const content = reader.result
    try{
      const entries = JSON.parse(content)
      insert(entries)
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
