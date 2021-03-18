<script>
  import {onMount, tick} from 'svelte'
  import { createEventDispatcher } from 'svelte'
  const dispatch = createEventDispatcher();

  export let source = []
  let selected // current filter displayed (year, appellation, producer)

  let selectNd = null
  let showAll = false

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
    <label for="selector">Filtres:</label>
    <div class="selector" id="selector" class:showAll>
      <span data-name="year" on:click="{toggleHandler}" class:selected="{selected==='year'}">Année</span>
      <span data-name="producer" on:click="{toggleHandler}" class:selected="{selected==='producer'}">Producteur</span>
      <span data-name="appellation" on:click="{toggleHandler}" class:selected="{selected==='appellation'}">Appellation</span>
      {#if showAll}
        <span>Couleur</span>
        <span>Cepages</span>
        <span>Bulles</span>
        <span>moelleux</span>
      {/if}
    </div>

    <button class="more"on:click="{()=>{showAll = !showAll}}">{showAll ? '-' : '+'} de filtres</button>

    {#if selected}
      <select class="filter-value {selected}" on:blur={filter} bind:this={selectNd}>
        {#each datalist as elem}
          <option value={elem}>{elem}</option>
        {/each}
        <option value="">Non renseigné</option>
      </select>
    {/if}
  </div>
</div>

<style type="text/less">
  .filters-ctnr{
    max-width: 450px;
    margin: auto;
    display: flex;
    flex-flow: column nowrap;
    justify-content: flex-start;
    align-items: stretch;

    .more {
      align-self: flex-end;
      border: none;
      background: none;
      // color: var(--main-color);
      text-decoration: underline;
      padding: 3px 2px 3px 5px;
      cursor: pointer;
    }
  }

  .selector{
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(3, minmax(0, auto));
    border: 1px solid var(--main-color);
    border-radius: 4px;

    span {
      --padding: 5px;
      padding: var(--padding) 0;
      flex: 1 0 33%;
      text-align: center;
      cursor: pointer;
      position: relative;

      &:nth-child(-n+2){
        border-right: 1px solid var(--main-color);
      }

      .showAll&{
        border: none;

        &:not(:last-child):after{
          // border-bottom
          content: '';
          position: relative;
          height: 1px;
          background: var(--main-color);
          display: block;
          width: 50%;
          transform: translate(50%, var(--padding);)
        }

        .vertical-border(){
          position: absolute;
          top: 25%;
          display: block;
          content: '';
          height: 50%;
          width: 1px;
          background: var(--main-color);
        }

        // border-right
        &:not(:nth-child(3)):not(:nth-child(6)):before{
          right: 0;
          .vertical-border();
        }

        &:last-child:nth-child(7){
          grid-column: 2/3;
          grid-row: 3/4;
          &:after{
            .vertical-border();
            left: 0;
          }
        }
      }
    }
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
