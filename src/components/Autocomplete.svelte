<script>
  // TODO: use normalization for item class names
  // TODO: include custom values from db

  import {tick} from 'svelte'
  import appellations from '../data/appellations.js'
  import cepages from '../data/cepages.js'

  const containings = ['37.5', '50', '52', '75', '1.5']
  const countries = ['France', 'Italie', 'Espagne', 'Argentine', 'Chili', 'Allemagne', 'Portugal', 'Australie', 'Nouvelle-Zélande', 'Afrique du Sud', 'USA', 'Chine' ]

  export let source = ''
  export let value = ''

  let hidden = true

  let root
  let origList
  let filteredList
  let verticalOffset = 0 // offset to adjust the position
  let width
  let tempSelectionIdx = 0 // which item to highlight during keyboard nav

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
      case 'country':
        origList = countries
    }
  }

  // filter list based on value
  $: {
    // stringify & remove new lines
    if (value)
      value = value.toString().replace(/[\r\n]/g, '')

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
    tempSelectionIdx = -1

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
    }, 100)
  }

  function select(e){
    value = e.currentTarget.dataset.value
  }

  export async function navigate(e){
    switch(e.code){
      case 'ArrowUp':
        tempSelectionIdx = Math.max(tempSelectionIdx - 1, 0)
        scroll('up')
        break
      case 'ArrowDown':
        tempSelectionIdx = Math.min(tempSelectionIdx + 1, filteredList.length - 1)
        scroll('down')
        break
      case 'Enter':
        const highlightedNd = root.getElementsByClassName('highlight')[0]
        if (highlightedNd){
          value = highlightedNd.dataset.value
          // delay before emptying list, so that value update handler runs before
          setTimeout(() => {
            // console.debug('validate')
            filteredList = []
          }, 50)
        }
        break
      case 'Escape':
        filteredList = []
    }
  }

  // scroll suggestion list when need during keyboard navigation
  async function scroll(dir){
    await tick()
    const highlightedNd = root.getElementsByClassName('highlight')[0]
    if (highlightedNd){
      const ndPos = highlightedNd && highlightedNd.getBoundingClientRect(),
            rootPos = root.getBoundingClientRect()

      const amount = dir === 'up' ? Math.min(0, ndPos.top - rootPos.top)
                                  : Math.max(0, ndPos.bottom - rootPos.bottom)

      root.scrollBy({left: 0, top: amount, behaviour: 'auto'})
    }
  }

</script>
  <ul class="{source}" bind:this={root} class:hidden class:empty="{filteredList.length === 0}"
    style="width:{width}px; margin-top:{verticalOffset}px;" tabindex="0">

    {#each filteredList as elem, i}
      <li on:click={select} data-value={elem} class:highlight="{tempSelectionIdx === i}" tabindex="0">{elem}</li>
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
  li:hover,
  li.highlight{
    background: #a40e0e;
    color: white;
  }

  .empty{
    border: none;
  }
</style>
