<script>
  import {onMount, tick} from 'svelte'
  import { createEventDispatcher } from 'svelte'
  const dispatch = createEventDispatcher();

  export let source = []
  let selected // current filter displayed (year, appellation, producer)

  let selectNd = null

  // set datalist for each filter
  $: appellationData = dedup(source, 'appellation')
  $: producerData = dedup(source, 'producer')
  $: yearData = dedup(source, 'year')

  // dedup & sort values
  function dedup(src, field){
    return src.reduce((dedup, cur) => {
      if (!!cur[field] && !dedup.includes(cur[field]))
        dedup.push(cur[field])
      return dedup
    }, []).sort()
  }

  // datalist is the current list of options. Changes when a filter is selected
  let datalist
  $: {
    switch(selected){
      case 'appellation': datalist = appellationData
        break
      case 'producer': datalist = producerData
        break
      case 'year': datalist = yearData
    }
  }

  onMount(() => {
  })

  async function toggle(e){
    const field = e.currentTarget.dataset.name

    if (selected === field){
      // hide selector, notify parent to clear filters
      selected = null
      dispatch('filter', {reset: true})
    }
    else{
      // show selector
      selected = field
    }

    await tick()
    if (selectNd)
      selectNd.selectedIndex = -1
  }

  function filter(e){
    dispatch('filter', {filter: selected, value: e.currentTarget.value})
  }
</script>

<div id="filters" class="wide">
  <div class="filters-ctnr">
    <label>Filtres:</label>
    <div class="selector">
      <span data-name="year" on:click="{toggle}" class:selected="{selected==='year'}">Année</span>
      <span data-name="producer" on:click="{toggle}" class:selected="{selected==='producer'}">Producteur</span>
      <span data-name="appellation" on:click="{toggle}" class:selected="{selected==='appellation'}">Appellation</span>
    </div>

    {#if selected}
      <select class="filter-value {selected}" on:change={filter} bind:this={selectNd}>
        {#each datalist as elem}
          <option value={elem}>{elem}</option>
        {/each}
        <option value="">Non renseigné</option>
      </select>
    {/if}
  </div>
</div>

<style>
  .filters-ctnr{
    max-width: 450px;
    margin: auto;
  }

  .selector{
    display: flex;
    border: 1px solid var(--main-color);
    border-radius: 4px;
    flex-flow: row nowrap;
    justify-content: space-evenly;
  }

  .selector > * {
    padding: 5px 0;
    flex: 1 0 33%;
    text-align: center;
    cursor: pointer;
  }
  .selector > *:not(:last-child) {
    border-right: 1px solid var(--main-color);
  }

  label{
    font-size: .85em;
  }

  .selected{
    color: white;
    background: var(--main-color);
  }

  .filter-value{
    display: block;
    min-width: 10em;
    max-width: 100%;
    margin: auto;
    margin-top: .75em;
  }
</style>
