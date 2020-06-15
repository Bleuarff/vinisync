<script>
  import { onMount } from 'svelte'
  import { repo } from '../storage.js'
  import moment from 'moment'
  export let params

  let updates = []
  let entry = null

  let linkLbl = ''

  let editEntryMap

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
      const doc = await repo.findById('history', params.id)
      if (doc)
        updates = doc.edits.sort(sortByDate)
      entry = await repo.findById('entries', params.id)
    }
    else{
      const docs = await repo.getAll('history'),
            entries = await repo.getAll('entries')

      editEntryMap = new WeakMap()
      docs.forEach(doc => {
        updates = updates.concat(doc.edits) // refresh global list of updates

        let curr = (new Date()).toISOString(),
            firstIdx = -1 // index of oldest element

        // get index of oldest item
        for (let i = 0; i < doc.edits.length; i++){
          if (doc.edits[i].ts < curr){
            firstIdx = i
            curr = doc.edits[i].ts
          }
        }

        for (let i = 0; i < doc.edits.length; i++){
          const edit = doc.edits[i],
                entry = entries.find(x => x.id === doc.entryId)

          editEntryMap.set(edit.change, {entry: entry, isNew: i === firstIdx})
        }

      })
      updates = updates.sort(sortByDate)
    }
  }

  // TODO: display in text format instead of json
  function formatChange(change){
    const t = typeof change
    if (t === 'string')
      return change
    else if (t === 'object')
      return parseDiff(change)
  }

  function parseDiff(change){
    let output = ''

    const {entry, isNew} = editEntryMap.get(change)

    output += isNew ? 'NEW' : 'EDIT'
    //     entry
    //     let names = [], year
    // if (change){
    //   if (change.wine){
    //     names = [change.wine.name, change.wine.producer]
    //     if (change.wine.year)
    //       year = change.wine.year
    //   }
    //   else if (editEntryMap && (entry = editEntryMap.get(change))){
    //     names = [entry.wine.name, entry.wine.producer]
    //     if (entry.wine.year)
    //       year = entry.wine.year
    //   }
    //
    //   if (change.count){
    //
    //   }
    // }
    //
    // output = `${names.filter(x => x).join(' - ')} (${year})`


    output += JSON.stringify(change)
    return output
  }

  // sort by descending date
  function sortByDate(a, b){
    if (a.ts < b.ts) return 1
    else if (a.ts > b.ts) return -1
    return 0
  }
</script>

{#if linkLbl}
  <a href="/entry/{params.id}" class="back" title={linkLbl}>{linkLbl}</a>
{/if}

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
    /* width: 12em; */
    white-space: nowrap;
  }
  .change{
    padding-left: 1em;
    /* text-align: center; */
  }
  tr:nth-child(2n+1){
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
