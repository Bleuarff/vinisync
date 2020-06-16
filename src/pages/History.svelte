<script>
  import { onMount } from 'svelte'
  import { repo } from '../storage.js'
  import moment from 'moment'
  export let params

  let updates = []
  // let entries = null

  let linkLbl = 'Retour'

  let editEntryMap

  // set back to entry link with entry info
  // $: if (entries && entries[0].wine){
  //   linkLbl = [entry.wine.name, entry.wine.producer].filter(x => !!x).join(' - ')
  //   if (entry.wine.year)
  //     linkLbl += ` (${entry.wine.year})`
  // }

  onMount(async () => {
    console.debug('history mount')
    await repo.open()
    load()
  })

  export async function load(){
    let entries
    if (params.id){
      const doc = await repo.findById('history', params.id)
      if (doc){
        updates = analyze(doc.edits)
        entries = [await repo.findById('entries', params.id)]
      }
    }
    else{
      const docs = await repo.getAll('history')
      entries = await repo.getAll('entries')
      docs.forEach(doc => {
        updates = updates.concat(analyze(doc.edits)) // populate global list of updates
      })
      updates = updates.sort(sortByDate)
    }
  }

  // adds metadata from a list of changes for a single entry.
  function analyze(changeList){
    changeList = changeList.sort(sortByDate)

    for (let i = 0; i < changeList.length; i++){
      const change = changeList[i].change
      if (change.count != null){ // can be 0
        // find previous element with count
        const prev = changeList.slice(i+1).find(x => x.change.count != null)
        // const previous = changeList.slice(0, i).reverse(),
        //       prevCount = previous.find(x => x.count != null)
        if (prev){
          change.countDiff = change.count - prev.change.count
          console.log(change)
        }

      }

    }
    return changeList
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

    // const {entry, isNew} = editEntryMap.get(change)

    // output += isNew ? 'NEW' : 'EDIT'
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
            <td class="change">
              {#if update.change.creationDate}<span>NEW</span>{/if}
              {#if update.change.countDiff}
                <span class="count-diff">{update.change.countDiff}</span>
              {/if}
              <span class="count">[{update.change.count}]</span>

              {formatChange(update.change)}
            </td>
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
    width: 100%;
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
