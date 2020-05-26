<script>
import { onMount } from 'svelte'
import {repo } from '../storage.js'
import syncMgr from '../syncMgr.js'
export let params = {}

// IDEA: show sort order in sort icon. Use an overlay with vertical gradient opacity background to hide icon top/bottom.

let entries = []
let config
let lastSortField // name of the last field used for sorting
let lastSortASC // whether last sort was in ascending order

$: bottleCount = entries.reduce((cur, e)=> {return cur + e.count}, 0)

onMount(async () => {
  await repo.open()
  load()
  config = await repo.getOne('config', 'sync')
})

export async function load(){
  entries = await repo.getAll('entries')
  entries = sort()
  syncMgr.checkUpdates()
  .then(async updated => {
    if (updated)
      entries = await repo.getAll('entries')
      entries = sort()
  })
}

// sort entries on given field
function sort(field){
  const manual = !!field // whether sort is due to user action
  let asc // sort order true: ascending, false: descending
  field = field || 'year' // default field

  switch(field){
    // numbers defaut to descending order
    case 'year':
    case 'count':
      asc = (lastSortField === field && manual) ? !lastSortASC : false
    break
    // strings default to ascending order
    case 'appellation':
    case 'producer':
      asc = (lastSortField === field && manual) ? !lastSortASC : true
    break
  }

  entries.sort((a, b) => {
    let valA, valB
    switch(field){
      case 'year':
      case 'appellation':
        valA = a.wine[field]
        valB = b.wine[field]
        break
      case 'producer':
        // if producer is falsy, use wine name instead
        valA = a.wine.producer || a.wine.name
        valB = b.wine.producer || b.wine.name
        break
      case 'count':
        valA = a.count
        valB = b.count
        break
    }
    // falsy values should be at the bottom in default sort.
    // for string fields, that means reversing the sort order for false values
    if (['appellation', 'producer'].includes(field) && (!valA || !valB)){
      if (!valA && !valB) return 0
      else if (!valA) return asc ? 1 : -1
      else if (!valB) return asc ? -1 : 1
    }
    else if (valA < valB) return asc ? -1 : 1
    else if (valA > valB) return asc ? 1 : -1
    else return 0
  })

  lastSortField = field
  lastSortASC = asc
  return entries
}

</script>

{#if entries.length > 0}

  <h2>Mes vins</h2>
  <p><span class="bold">{entries.length}</span> references et <span class="bold">{bottleCount}</span> bouteilles en cave.</p>

  <div id="entries">
    <div class="entry sort-ctnr">
      <span class="year icon-sort" class:selected="{lastSortField === 'year'}" on:click="{e => entries = sort('year')}"></span>
      <div class="names icon-sort" class:selected="{lastSortField === 'producer'}" on:click="{e => entries = sort('producer')}"></div>
      <div class="app icon-sort" class:selected="{lastSortField === 'appellation'}" on:click="{e => entries = sort('appellation')}"></div>
      <span class="count icon-sort" class:selected="{lastSortField === 'count'}" on:click="{e => entries = sort('count')}"></span>
    </div>
    {#each entries as entry}
      <a href="/entry/{entry.id}" class="entry">
        <span class="year {entry.wine.color}" >{entry.wine.year || ''}</span>
        <div class="names">
          {#if entry.wine.name}<div class="name">{entry.wine.name}</div>{/if}
          {#if entry.wine.name && entry.wine.producer}<div class="name-sep"></div>{/if}
          {#if entry.wine.producer}<div class="producer">{entry.wine.producer}</div>{/if}
        </div>
        <div class="app">{entry.wine.appellation}</div>
        <span class="count">{entry.count}</span>
      </a>

    {/each}
  </div>

{:else}
  <p>Votre cave est vide.</p>
{/if}

<a href="/entry">Ajouter un vin</a>
{#if !config}
<div>
  <a href="/import">Importer</a>
</div>
{/if}

<style>
  :root{
    --min-row-height: 3.2em;
    --vt-row-padding: 5px;
  }

#entries{
  display: flex;
  flex-flow: column nowrap;
  margin: 0 -.8em 1.5em;
}

/* .entry > * {
  background: none !important;
} */
.bold{
  font-weight: bold;
}

.entry{
  text-decoration: none;
  color: unset;
  padding: var(--vt-row-padding) 2px;
  margin-bottom: 1px;
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  min-height: var(--min-row-height);
  vertical-align: middle;
}
.entry:nth-child(2n){
    background: #eeeeee;
}
.entry:hover{
  background: #daeeff;
}

.sort-ctnr{
  min-height: auto;
  background: transparent !important;
  padding-bottom: .5em;
}
.sort-ctnr .year,
.sort-ctnr .count{
  margin: 0;
  padding: 0;
  height: auto;
}
.sort-ctnr .year{
  text-align: left;
}
.sort-ctnr .app{
  text-align: right;
  min-width: 3em;
}
.sort-ctnr .count{
}

.icon-sort.selected{
  color: #8c0101;
}

.year{
  flex: 0 0 3em;
  text-align: center;
  border-radius: 3px;
  align-self: flex-start;
  height: calc(var(--min-row-height) - (var(--vt-row-padding) * 2));
  margin-right: 3px;
  padding-top: 6px;
  margin-left: -2px;
}
.names{
  flex: 2 0 45%;
  /* background: lightgreen; */
}
.name-sep{
  /* width: 80%; */
  /* margin: 3px 0; */
  background: transparent;
  height: 6px;
}

.app{
  flex: 0 1 auto;
  /* background: #ddaaff; */
}
.count{
  width: 2em;
  text-align: right;
  padding-right: 3px;
}

.red{
  background: #a40e0e;
  color: white;
}
.white{
  background: #ffea7a;
}
.rose{
  background: #f78dad;
}
</style>
