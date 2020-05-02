<script>
import { onMount } from 'svelte'
import {repo } from '../storage.js'
import { syncMgr } from '../syncMgr.js'
export let params = {}

let entries = []
let config
$: bottleCount = entries.reduce((cur, e)=> {return cur + e.count}, 0)

onMount(async () => {
  await repo.open()
  entries = await repo.getAll('entries')
  entries = sort()
  syncMgr.checkUpdates()
  .then(async updated => {
    if (updated)
      entries = await repo.getAll('entries')
      entries = sort()
  })
  config = await repo.getOne('config', 'sync')
})

function sort(){
  entries.sort((a, b) => {
    if (a.wine.year < b.wine.year) return 1
    else if (a.wine.year > b.wine.year) return -1
    else return 0
  })
  return entries
}

</script>

{#if entries.length > 0}

  <h2>Mes vins</h2>
  <p><span class="bold">{entries.length}</span> references et <span class="bold">{bottleCount}</span> bouteilles en cave.</p>

  <div id="entries">
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
<div>
  <a href="/sync">Sync</a>
</div>

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

a.entry{
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
.entry:nth-child(2n+1){
    background: #eeeeee;
}
.entry:hover{
  background: #daeeff;
}

.year{
  flex: 0 0 3em;
  /* width: 3em; */
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
