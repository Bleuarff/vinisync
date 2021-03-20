<script>
  import {onMount, tick} from 'svelte'
  import Color from './Color.svelte'
  import { createEventDispatcher } from 'svelte'
  const dispatch = createEventDispatcher();

  export let source = []
  let selected // current filter displayed (year, appellation, producer)

  let selectNd = null
  let showAll = true

  // set datalist for each filter
  $: appellationData = dedup(source, 'appellation')
  $: producerData = dedup(source, 'producer')
  $: yearData = dedup(source, 'year')
  $:{
    if (!showAll && !['year', 'appellation', 'producer'].includes(selected))
      selected = null
  }

  // dedup & sort values
  function dedup(src, field){
    return src.reduce((dedup, cur) => {
      const value = cur[field] && cur[field].toString()
      if (!!cur[field] && !dedup.includes(value))
        dedup.push(value)
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
        break
      default: datalist = []
    }
  }

  onMount(() => {
  })

  // set filter field and value from outside
  export async function preset(field, value){
    await toggle(field)
    selectNd.value = value
  }

  function toggleHandler(e){
    toggle(e.currentTarget.dataset.name)
  }

  async function toggle(field){
    if (selected === field){
      // hide selector, notify parent to clear filters
      selected = null
      dispatch('filter', {reset: true})
    }
    else{
      // show selector
      selected = field

      // boolean properties are triggered immediately
      if (['sparkling', 'sweet'].includes(selected))
        dispatch('filter', {filter: selected, value: true})
    }

    await tick()
    if (selectNd)
      selectNd.selectedIndex = -1
  }

  function filter(e){
    const value = (e.currentTarget || e.detail).value
    dispatch('filter', {filter: selected, value: value})
  }
</script>

<div id="filters" class="wide">
  <div class="filters-ctnr">
    <label for="selector">Filtres:</label>
    <div class="{selected}" id="selector" class:showAll>
      <span data-name="year" on:click="{toggleHandler}">Année</span>
      <span data-name="producer" on:click="{toggleHandler}">Producteur</span>
      <span data-name="appellation" on:click="{toggleHandler}">Appellation</span>
      {#if showAll}
        <span data-name="color" on:click="{toggleHandler}">Couleur</span>
        <span data-name="cepage" on:click="{toggleHandler}">Cepages</span>
        <span data-name="sparkling" on:click="{toggleHandler}">Bulles</span>
        <span data-name="sweet" on:click="{toggleHandler}">moelleux</span>
      {/if}
    </div>

    <button class="more"on:click="{()=>{showAll = !showAll}}">{showAll ? '-' : '+'} de filtres</button>

    {#if selected}
    <!-- TODO: different inputs, depending on selected field.
      - year: dropdown
      - producteur, appellation, cepages: dropdown w/ text filter
      - couleur: color component
      - bulle/moelleux: nothing
    -->
      {#if selected === "year"}
        <select class="filter-value {selected}" on:change={filter} bind:this={selectNd}>
          {#each datalist as elem}
            <option value={elem}>{elem}</option>
          {/each}
          <option value="">Non renseigné</option>
        </select>
      {:else if ['producer', 'appellation', 'cepage'].includes(selected)}
        <select class="filter-value {selected}" on:change={filter} bind:this={selectNd}>
          {#each datalist as elem}
            <option value={elem}>{elem}</option>
          {/each}
          <option value="">Non renseigné</option>
        </select>
      {:else if selected === 'color'}
        <Color readonly={false} filter={true} on:change={filter}></Color>
      {/if}
    {/if}
  </div>
</div>

<style type="text/less">
  :root{
    --selector-width: 140px;
  }

  @media (max-width: 500px){
    #selector span{
      --selector-width: 111px;
    }
  }

  .filters-ctnr{
    margin: auto;
    display: flex;
    flex-flow: column nowrap;
    justify-content: flex-start;
    align-items: stretch;

    .more {
      align-self: flex-end;
      border: none;
      background: none;
      text-decoration: underline;
      padding: 3px 2px 3px 5px;
      cursor: pointer;
    }
  }

  #selector{
    display: flex;
    flex-flow: row wrap;
    justify-content: center;

    span {
      padding: 4px 0;
      text-align: center;
      cursor: pointer;
      position: relative;
      margin: 3px;

      width: var(--selector-width);
      border: 1px solid var(--main-color);
      border-radius: 2px;
    }
  }

  label{
    font-size: .85em;
  }

  .year > *[data-name="year"],
  .producer > *[data-name="producer"],
  .appellation > *[data-name="appellation"],
  .color > *[data-name="color"],
  .cepage > *[data-name="cepage"],
  .sparkling > *[data-name="sparkling"],
  .sweet > *[data-name="sweet"]{
    color: white;
    background: var(--main-color);
    box-shadow: inset 1px 1px 2px 0px #373737;
    border-color: #6c0707;
  }


  .filter-value{
    display: block;
    min-width: 10em;
    max-width: 100%;
    margin: auto;
    margin-top: .75em;
  }
</style>
