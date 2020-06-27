<script>
  import {onMount} from 'svelte'
  import { repo } from '../storage.js'
  import moment from 'moment'
  import fr from 'moment/locale/fr.js'
  let params

  let conflicts = []

  onMount(async () => {
    await repo.open()
    load()
  })

  async function load(){
    // get conflicts docs
    const temp = await repo.getAll('conflicts'),
          proms = []

    // get locale entry for each conflict
    temp.forEach(async (conflict, i) => {
      proms.push(new Promise(async (resolve) => {
        try{
          const entry = await repo.findById('entries', conflict.changes.id)
          if (entry){
            temp[i] = {...conflict, _entry: entry}
          }
          else console.warning('conflit: local entry not found')
        }
        catch(ex){
          console.error(ex)
        }
        console.debug('end')
        resolve()
      }))
    })

    await Promise.all(proms)
    conflicts = temp
  }

  // returns an array of changes for given change object
  // obj: initial value is conflict change object
  // ref: initial value is local entry
  function _parseChanges(obj, ref){
    let changes = []

    // loop filtered list of entries
    Object.entries(obj).filter(x => !['id', 'lastUpdateDate'].includes(x[0])).forEach(([key, value]) => {
      if (key === 'wine')
        changes = [...changes, ..._parseChanges(value, ref && ref.wine)]
      else{
        // push an item with key, local & remote values.
        changes.push({
          key: key,
          remote: value,
          local: ref && ref[key]
        })
      }
    })
    return changes
  }
</script>

<h2>Conflits</h2>

{#if conflicts.length}
  <p>
    Des conflits de synchronisation peuvent arriver.<br>
    Si vous avez modifié un vin qui a été mis à jour sur un autre appareil sans récuperer
    cette information (ex. téléphone hors-ligne), alors il y a un conflit lorsque vous récuperez les màj de l'autre appareil.
    <br>
    Voici ces conflits. Sans action de votre part, les modifications distantes sont ignorées.
  </p>
  <div id="conflicts">
    {#each conflicts as conflict}
      <div class="conflict">
        <div class="name">
          {#if conflict._entry}
            {conflict._entry.wine.name} - {conflict._entry.wine.producer}
            {#if conflict._entry.wine.year}[{conflict._entry.wine.year}]{/if}
          {/if}
        </div>
        <div class="ts">le {moment(conflict.ts).format('dddd DD MMMM à HH:mm:ss')}</div>
        <table class="changes">
          <thead>
            <tr>
              <th></th>
              <th class="remote">Distant</th>
              <th></th>
              <th class="local">Local</th>
            </tr>
          </thead>
          <tbody>
            {#each _parseChanges(conflict.changes, conflict._entry) as prop}
              <tr>
                <td>{prop.key}:</td>
                <td class="remote">{prop.remote}</td>
                <td>&#x27A1;</td>
                <td class="local">{prop.local}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/each}
  </div>
{:else}
  <span class="empty">Pas de conflits.</span>
{/if}

<style>
  .conflict{
    width: 100%;
    border: 1px solid #666666;
    border-radius: 4px;
    padding: 0;
    margin-bottom: 1.1em;
    display: flex;
    flex-flow: row wrap;
    justify-content: flex-start;
    box-shadow: 2px 2px 6px #666666;
  }

  .name,
  .ts{
    text-align: center;
    width: 100%;
    border-bottom: 1px solid black;
    padding: 4px 8px;
  }

  .name{
  }

  .ts{
    font-size: .85em;
  }

  .remote{
    text-align: right;
    width: 40%;
  }
  .local{
    text-align: left;
    width: 40%;
  }

  .empty{
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);

  }
</style>
