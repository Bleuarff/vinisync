<script>
import { repo } from '../storage.js'
import router from 'page'
import { createEventDispatcher } from 'svelte'
import { v4 as uuid} from 'uuid'
const dispatch = createEventDispatcher()
export let params

function importFile(e){
  if (!e.currentTarget.files.length)
    return

  const file = e.currentTarget.files[0]
  const reader = new FileReader()
  reader.onload = async () => {
    const content = reader.result
    try{
      const entries = JSON.parse(content)
      console.log(`${entries.length} entries in file`)
      await repo.open()
      await repo.deleteAll('entries')
      const proms = []
      entries.forEach(entry => {
        entry.id = uuid()
        proms.push(repo.insertOne('entries', entry))
      })
      await Promise.all(proms)


      router('/wines')
    }
    catch(ex){
      console.error(ex)
      dispatch('notif', {text: 'Erreur d\'import', err: true})
    }
  }
  reader.readAsText(file)
}

</script>

<h2>Importer</h2>

<p>Importe un fichier json. Ecrase toutes les entrées existantes.</p>

<input type="file" id="importer" on:change={importFile} accept="application/json">

<style>
</style>
