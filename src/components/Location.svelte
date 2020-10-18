<script>
  import {onMount} from 'svelte'
  import Autocomplete from './Autocomplete.svelte'
  const SEPARATOR = '##@##' // separator between location & sub-location, stored as a sigle string

  export let readonly = true
  export let value = [] // entry's locations


  let refData = [] // reference locations
  let newLocIdx = -1
  let newSubIdx = -1


  onMount(() => {
    try{
      refData = JSON.parse(localStorage.getItem('locations'))
    }
    catch(ex){
      console.error(ex)
    }
  })

  // adds a location for the entry
  function addLocation(e){
    if (newLocIdx < 0) return

    const loc = refData[newLocIdx]
    let sub
    if (!loc) return

    if (newSubIdx > 0)
      sub = loc.subLocations[newSubIdx]

    let newLocation = loc.name
    if (sub)
       newLocation += SEPARATOR + sub

    if (!value.includes(newLocation)) // reject duplicates
      value = [...value, newLocation]

    console.log(value)
    // FIX: this is not enough to reset to N/A option
    newLocIdx = -1
    newSubIdx = -1
  }
</script>

<div class="location-ctnr">
  <label>Emplacement</label>

    <div class="locs">
      {#each value as loc}
        <span>{loc.replace(SEPARATOR, ' - ')}</span>
      {/each}
    </div>

    {#if !readonly}
      <select bind:value={newLocIdx}>
        <option value="-1">&mdash;N/A&mdash;</option>
        {#each refData as refLoc, idx}
          <option value={idx}>{refLoc.name}</option>
        {/each}
      </select>

      {#if newLocIdx >= 0 && refData[newLocIdx].subLocations && refData[newLocIdx].subLocations.length}
        <select bind:value={newSubIdx}>
          <option value="-1">&mdash;N/A&mdash;</option>
          {#each refData[newLocIdx].subLocations as refSub, idx}
            <option value={idx}>{refSub}</option>
          {/each}
        </select>
      {/if}

      <button on:click={addLocation}>+</button>
    {/if}
</div>

<style>
  .location-ctnr{
  }
  label{
    font-size: .9em;
  }

  .locs{
    display: flex;
    flex-flow: column nowrap;
    padding-left: 1em;
  }
</style>
