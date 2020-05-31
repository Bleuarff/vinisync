<script>
  // TODO: use normalization for item class names
  // TODO: include custom values from db
  // TODO: keyboard navigation/selection

  import {tick} from 'svelte'
  import appellations from '../data/appellations.js'
  import cepages from '../data/cepages.js'

  const containings = ['37.5', '50', '52', '75', '1.5']

  export let source = ''
  export let value = ''

  let hidden = true

  let root
  let origList
  let filteredList
  let verticalOffset = 0 // offset to adjust the position
  let width

  // select datasource
  $: {
    switch(source){
      case 'appellation':
        origList = appellations
        break
      case 'containing':
        origList = containings
        break
      case 'cepage':
        origList = cepages
        break
    }
  }

  // filter list based on value
  $: {
    if (!value){
      filteredList = [] // disable list if no input
    }
    else{
      const rx = new RegExp(value, 'i')
      filteredList = origList.filter(x => x.match(rx))
    }
  }

  export async function show(){
    hidden = false

    // on first call, adjust element width and vertical position.
    if (verticalOffset === 0){
      const inputNd = root.parentElement.querySelector('input, textarea')
      if (inputNd){
        await tick()
        const inputPosition = inputNd.getBoundingClientRect()
        verticalOffset = inputPosition.bottom - root.getBoundingClientRect().top
        width = inputPosition.width
      }
    }
  }

  export function hide(e){
    setTimeout(() => {
      // give time for elem 'select' handler to run. if hidden is set sync'ly, the handler doesn't run
      hidden = true
    }, 80)
  }

  function select(e){
    value = e.currentTarget.dataset.value
  }

</script>
  <ul class="{source}" bind:this={root} class:hidden class:empty="{filteredList.length === 0}"
    style="width:{width}px; margin-top:{verticalOffset}px;">

    {#each filteredList as elem}
    <li on:click={select} data-value={elem}>{elem}</li>
    {/each}
  </ul>

<style>
  ul{
    list-style-type: none;
    padding: 0;
    margin:0;
    position: absolute;
    border: 1px solid #a40e0e;
    border-top: none;
    background: white;
    /* width: 100%; */
    z-index: 10;
    /* margin-top: -.55em; */
    font-size: .9em;
    max-height: 9.2em;
    overflow: hidden auto;
  }

  li{
    padding: 3px;
  }
  li:hover{
    background: #a40e0e;
    color: white;
  }

  .empty{
    border: none;
  }
</style>
