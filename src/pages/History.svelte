<script>
  import { onMount } from 'svelte'
  import { repo } from '../storage.js'
  import moment from 'moment'
  export let params

  let updates = []
  let entry = null

  let linkLbl = 'Fiche bouteille'

  // set back to entry link with entry info
  $: if (entry && entry.wine){
    linkLbl = [entry.wine.name, entry.wine.producer].filter(x => !!x).join(' - ')
    if (entry.wine.year)
      linkLbl += ` (${entry.wine.year})`
  }

  onMount(async () => {
    console.debug('history mount')
    await repo.open()
    load()
  })

  export async function load(){
    if (params.id){
      const doc = (await repo.findById('history', params.id))
      if (doc)
        updates = doc.edits.sort((a,b) => {
          // sort by descending date
          if (a.ts < b.ts) return 1
          else if (a.ts > b.ts) return -1
          return 0
        })
      entry = await repo.findById('entries', params.id)
    }
  }

  // TODO: display in text format instead of json
  function formatChange(change){
    const t = typeof change
    if (t === 'string')
      return change
    else if (t === 'object')
      return JSON.stringify(change)
  }
</script>

<a href="/entry/{params.id}" class="back" title={linkLbl}>{linkLbl}</a>
<div id="history">

  {#if updates && updates.length > 0}
    <table>
      <thead>
        <th>Heure</th>
        <th>Modification</th>
      </thead>
      <tbody>
        {#each updates as update}
          <tr>
            <td class="ts">{moment(update.ts).format('DD/MM/YYYY HH:mm')}</td>
            <td class="change">{formatChange(update.change)}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {:else}
    <div class="empty">
      Aucune modification enregistrée.
    </div>
  {/if}
</div>

<style>
  #history{
    margin-top: 2em;
  }
  table{
    width: 100%;
    font-size: .85em;
    border-collapse: collapse;
  }
  .ts{
    width: 12em;
  }
  .change{
    padding-left: 1em;
    text-align: center;
  }
  tr:nth-child(2n){
    background: #eeeeee;
  }
  td{
    padding: 3px 0;
  }
  td:first-child{
    padding-left: 6px;
  }
  td:last-child{
    padding-right: 6px;
  }

  .empty{
    margin: 3em 1em 1em 1em;
    padding: 2em;
    text-align: center;
    border: 1px solid var(--main-color);
  }

  .back{
    display: inline-block;
    max-width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
