<script>
  import {onMount, tick} from 'svelte'
  import Color from './Color.svelte'
  import Dropdown from './Dropdown.svelte'
  import { createEventDispatcher } from 'svelte'
  const dispatch = createEventDispatcher()
  import Undiacritics from '../undiacritics.js'

  // naming is hard, ok?
  const valueFields = ['year', 'producer', 'appellation', 'cepages']
  export let source = []
  let selected // current filter displayed (year, appellation, producer, color, cepage, sparkling, sweet)

  let selectNd = null
  let showAll = false

  let appellationData, producerData, yearData, cepageData

  $:{
    // on toggling off the additional filters, reset filter selection, unless it's one of the main filters.
    if (!showAll && !['year', 'appellation', 'producer'].includes(selected))
      selected = null
  }

  // update all datalists in one pass
  $: if (source){
    let tmp = {}, // store arrays of keys
        fullData = {} // store arrays of {key, lbl} objects

    source.forEach(e => {
      if (e){
        valueFields.forEach(field => {
          let values // array of values for the given field in this 'entry' (not the actual entry, though)
          let labels
          // obtain value & corresponding normalized key
          if (field === 'cepages'){
            values = e[field] && e[field].map(x => Undiacritics.removeAll(x).toLowerCase())
            labels = e[field]
          }
          else{
            values = e[field] && [Undiacritics.removeAll(e[field].toString()).toLowerCase()], // normalized value, for dedup
            labels = e[field] && [e[field].toString()] // actual value, for display
          }

          // compare keys to ignore duplicates.
          values && values.forEach((value, idx) => {
            if (value && (!tmp[field] || !tmp[field].includes(value))){
              // undecipherable, but short way to push to array after creating and assigning it if needed.
              (tmp[field] = (tmp[field] || [])).push(value);
              (fullData[field] = (fullData[field] || [])).push({key: value, label: labels[idx]});
            }
          })
        })
      }
    })

    appellationData = fullData.appellation.sort(sortByKeyAsc)
    producerData = fullData.producer.sort(sortByKeyAsc)
    cepageData = fullData.cepages.sort(sortByKeyAsc)
    yearData = fullData.year.sort(sortByKeyDesc)
  }

  function sortByKeyAsc(a, b){
    if (a.key < b.key) return -1
		else if (a.key > b.key) return 1
		return 0
  }
  function sortByKeyDesc(a, b){
    if (a.key < b.key) return 1
		else if (a.key > b.key) return -1
		return 0
  }

  onMount(() => {
  })

  // set filter field and value from outside
  export async function preset(field, value){
    await toggle(field)
    if (selectNd)
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
      <button data-name="year" on:click="{toggleHandler}">Année</button>
      <button data-name="producer" on:click="{toggleHandler}">Producteur</button>
      <button data-name="appellation" on:click="{toggleHandler}">Appellation</button>
      {#if showAll}
        <button data-name="color" on:click="{toggleHandler}">Couleur</button>
        <button data-name="cepages" on:click="{toggleHandler}">Cepages</button>
        <button data-name="sparkling" on:click="{toggleHandler}">Bulles</button>
        <button data-name="sweet" on:click="{toggleHandler}">Moelleux</button>
      {/if}
    </div>

    <button class="more"on:click="{()=>{showAll = !showAll}}">{showAll ? '-' : '+'} de filtres</button>

    {#if selected}
      <!-- different inputs, depending on selected field.
        - year: dropdown
        - producteur, appellation, cepages: dropdown w/ text filter
        - couleur: color component
        - sweet/sparkling: n/a, filter is triggered on toggle
      -->
      {#if selected === "year"}
        <select class="filter-value {selected}" on:change={filter} bind:this={selectNd}>
          {#each yearData as elem}
            <option value={elem.key}>{elem.label}</option>
          {/each}
          <option value="">Non renseigné</option>
        </select>

      {:else if selected === 'producer'}
        <Dropdown src={producerData} on:change={filter} name="producter"></Dropdown>

      {:else if selected === 'appellation'}

        <Dropdown src={appellationData} on:change={filter} name="appellation"></Dropdown>

      {:else if selected === 'cepages'}
        <Dropdown src={cepageData} on:change={filter} name="cepages"></Dropdown>

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

  @media (max-width: 450px){
    #selector button{
      --selector-width: 30%;
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
  }

  button  {
    padding: 4px 0;
    text-align: center;
    cursor: pointer;
    position: relative;
    margin: 3px;

    width: var(--selector-width);
    border: 1px solid var(--main-color);
    border-radius: 2px;
    background: white;

    &:focus, &:hover{
      border-width: 2px;
      padding: 3px 0;
    }
  }

  label{
    font-size: .85em;
  }

  .year > *[data-name="year"],
  .producer > *[data-name="producer"],
  .appellation > *[data-name="appellation"],
  .color > *[data-name="color"],
  .cepages > *[data-name="cepages"],
  .sparkling > *[data-name="sparkling"],
  .sweet > *[data-name="sweet"]{
    color: white;
    background: var(--main-color);
    box-shadow: inset 1px 1px 2px 0px #373737;
    border-color: #6c0707;
    border-width: 1px;
  }


  .filter-value{
    display: block;
    min-width: 10em;
    max-width: 100%;
    margin: auto;
    margin-top: .75em;
  }
</style>
