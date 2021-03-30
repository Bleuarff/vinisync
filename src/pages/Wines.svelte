<script>
import { onMount, onDestroy } from 'svelte'
import {repo } from '../storage.js'
import syncMgr from '../syncMgr.js'
import Undiacritics from '../undiacritics.js'
import Filters from '../components/Filters.svelte'
const CONFIG_SORT_KEY = 'config.page.wines.sort'
const CONFIG_FILTER_KEY = 'config.pages.wines.filter'
export let params = {}

// IDEA: show sort order in sort icon. Use an overlay with vertical gradient opacity background to hide icon top/bottom.

let origEntries = [] // db data, may be sorted
let entries = [] // subset of entries
let sortConfig
let lastSortField // name of the last field used for sorting
let lastSortASC // whether last sort was in ascending order

let filterConfig // filters' selected field & value
let filtersNd // filter component

const defaultSortConfig = { field: 'year', orderAsc: false }

$: bottleCount = origEntries.reduce((cur, e) => {return cur + e.count}, 0)

// Display mode
// old: show only entries with count 0.
// default: show entries with count > 0.
let mode
$: {
  const newMode = params.type === 'oldref' ? 'old' : 'default',
        reload = mode && mode !== newMode // trigger reload not needed on first exec
  mode = newMode

  if (reload){
    load()
    filterConfig = window[CONFIG_FILTER_KEY] = null
  }
}

onMount(async () => {
  await repo.open()

  sortConfig = JSON.parse(window.localStorage.getItem(CONFIG_SORT_KEY))

  if (!sortConfig){
    sortConfig = defaultSortConfig
  }

  await load()

  // use filter config if it exists
  filterConfig = window[CONFIG_FILTER_KEY]
  if (filterConfig){
    filterList({
      detail: {
        filter: filterConfig.field,
        value: filterConfig.value
      }
    })
    filtersNd.preset(filterConfig.field, filterConfig.value)
    window[CONFIG_FILTER_KEY] = null
  }
})

export async function load(){
  let filterFunc
  if (mode === 'default')
    filterFunc = (x) => x.count > 0
  else
    filterFunc = (x) => x.count <= 0

  entries = origEntries = (await repo.getAll('entries')).filter(filterFunc)
  entries = sort(entries) // origEntries is also sorted, since sort is in-place and both variables refer to the same array

  const updated = await syncMgr.checkUpdates()
  if (updated)
    entries = origEntries  = (await repo.getAll('entries')).filter(filterFunc)
    entries = sort(entries) // origEntries also sorted.
}

// sort entries on given field
function sort(list, field){
  const manual = !!field // whether sort is due to user action
  let asc // sort order true: ascending, false: descending
  field = field || sortConfig.field

  switch(field){
    // numbers defaut to descending order
    case 'year':
    case 'count':
      asc = (lastSortField === field && manual) ? !lastSortASC : sortConfig.orderAsc
    break
    // strings default to ascending order
    case 'appellation':
    case 'producer':
      asc = (lastSortField === field && manual) ? !lastSortASC : sortConfig.orderAsc
    break
  }

  list.sort((a, b) => {
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

    if (typeof valA === 'string')
      valA = valA.toLowerCase()
    if (typeof valB === 'string')
      valB = valB.toLowerCase()

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
  return list
}

function filterList(e){
  if (e.detail.reset){
    // on reset, we want the same filter as what the filtered list was filtered by.
    // Since field will be same as lastSortField, switch lastSortASC to have the same order as previous sort on filtered items.
    lastSortASC = !lastSortASC
    entries = sort(origEntries, lastSortField)
    filterConfig = null
    return
  }
  // console.log(`filter ${e.detail.filter}=${e.detail.value}`)
  filterConfig = {
    field: e.detail.filter,
    value: e.detail.value
  }

  let filterFn // filter function to filter by

  if (!!filterConfig.value){

    // filter by normalized value, whether by string (appellation, producer) or in array (cepages)
    if (filterConfig.field === 'cepages')
      filterFn = x => x.wine[filterConfig.field] && x.wine[filterConfig.field].map(c => Undiacritics.removeAll(c).toLowerCase()).includes(filterConfig.value)
    else if (['appellation', 'producer'].includes(filterConfig.field))
      filterFn = x => x.wine[filterConfig.field] && Undiacritics.removeAll(x.wine[filterConfig.field]).toLowerCase() === filterConfig.value
    else
      // filter by exact value (year, color, sparkling, sweet)
      filterFn = x => x.wine[filterConfig.field] == filterConfig.value
  }
  else
    // filter for all falsy values
    filterFn = x => !x.wine[filterConfig.field]

  entries = origEntries.filter(filterFn)
}

function sortHandler(e){
  sortConfig.field = e.currentTarget.dataset.name
  entries = sort(entries, sortConfig.field)
  sortConfig.orderAsc = lastSortASC

  // on each sort, store field & order as the new defaults
  window.localStorage.setItem(CONFIG_SORT_KEY, JSON.stringify(sortConfig))
}

// if destination is an entry page and some filter is set, save it for when we come back
onDestroy(() => {
  // console.debug('to: ' + location.href)
  const toEntry = /\/entry\/[\da-f\-]+\/?/i.test(location.pathname) // whether we go to an entry page

  window[CONFIG_FILTER_KEY] = toEntry && filterConfig && filterConfig.field && filterConfig.value ? {
    field: filterConfig.field,
    value: filterConfig.value
  } : null
})

</script>

{#if origEntries.length > 0}
  {#if mode === "default"}
    <a href="/history" class="forward">historique</a>
  {/if}

  <h2>Mes vins</h2>
  <p><span class="bold">{origEntries.length}</span> références et <span class="bold">{bottleCount}</span> bouteilles en cave.<br>

    {#if mode === 'default'}
      <a href="/wines/oldref" class="old-link">Voir les anciennes références</a>
    {:else}
      <a href="/wines" class="old-link">Voir les références actuelles</a>
    {/if}
  </p>

  <Filters source="{origEntries.map(x => {return {year: x.wine.year, appellation: x.wine.appellation, producer: x.wine.producer, cepages: x.wine.cepages}})}"
    on:filter={filterList} bind:this={filtersNd}>
  </Filters>

  {#if !!filterConfig && entries}
    <span>{entries.length} résultat{entries.length <= 1 ? '' : 's'}</span>
  {/if}

  {#if entries.length > 0}
    <div id="entries" class="wide">
      <div class="entry sort-ctnr">
        <span class="year icon-sort" class:selected="{lastSortField === 'year'}" on:click={sortHandler} data-name="year"></span>
        <div class="names icon-sort" class:selected="{lastSortField === 'producer'}" on:click={sortHandler} data-name="producer"></div>
        <div class="app icon-sort" class:selected="{lastSortField === 'appellation'}" on:click={sortHandler} data-name="appellation"></div>
        <span class="count icon-sort" class:selected="{lastSortField === 'count'}" on:click={sortHandler} data-name="count"></span>
      </div>

      {#each entries as entry}
        <a href="/entry/{entry.id}" class="entry">
          <span class="year {entry.wine.color}" >{entry.wine.year || ''}</span>
          <div class="names">
            {#if entry.wine.name}<div class="name">{entry.wine.name}</div>{/if}
            {#if entry.wine.name && entry.wine.producer}<div class="name-sep"></div>{/if}
            {#if entry.wine.producer}<div class="producer">{entry.wine.producer}</div>{/if}
          </div>
          <div class="app">{entry.wine.appellation || ''}</div>
          <span class="count">{entry.count}</span>
        </a>

      {/each}
    </div>
  {:else}
    <div class="err">Pas de résultat.</div>
  {/if}

{:else if mode === 'old'}
  <p>
    Vous n'avez pas encore de référence épuisée.
    <a href="/wines">Voir toutes les références.</a>
  </p>
{:else}
  <p>Votre cave est vide.</p>
  <div>
    <a href="/import">Importer</a>
  </div>
{/if}

<a href="/entry" class="btn-add"><img src="/img/addentry.svg" alt="create an entry"></a>

<style>
  :root{
    --min-row-height: 3.2em;
    --vt-row-padding: 5px;
    --btn-add-height: 3.8em;
  }

#entries{
  display: flex;
  flex-flow: column nowrap;
  margin-bottom: calc(var(--btn-add-height) + 1em);
}

/* .entry > * {
  background: none !important;
} */

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

.err{
  border: 1px solid var(--main-color);
  padding: 1em;
  text-align: center;
  margin-bottom: 2em;
}

.btn-add{
  position: fixed;
  right: 1em;
  bottom: 1em;

  width: var(--btn-add-height);
  height: var(--btn-add-height);
  background: var(--main-color);
  color: white;
  border-radius: 50%;
  padding: .75em;
}

@media (min-width: 700px){
  .btn-add{
    left: 50%;
  }
}

.btn-add img{
  height: 2em;
  width: 2em;
}

.forward{
  float: right;
}

a.old-link{
  font-size: .9em;
}
</style>
