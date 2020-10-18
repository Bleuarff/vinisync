<script>
  import { onMount } from 'svelte'
  import FormText from './FormText.svelte'
  import { createEventDispatcher } from 'svelte'
  const dispatch = createEventDispatcher();

  let locations
  let newLocName

  onMount(async () => {
    try{
      locations = JSON.parse(localStorage.getItem('locations')) || []

    }
    catch(ex){
      console.error(ex)
      locations = []
    }
  })

  // TODO: sync (review storage)
  async function save(e){
    e.preventDefault()
    try{
      localStorage.setItem('locations', JSON.stringify(locations))
      dispatch('notif', {text: 'OK'})
    }
    catch(ex){
      console.error(ex)
      dispatch('notif', {text: 'ERROR_LOCATIONS_UPDATE', err: true})
    }
  }

  function addLocation(e){
    if (newLocName){
      locations = [...locations, {name: newLocName, subLocations: []}]
      newLocName = ''
    }
  }

  function addSubLoc(e, idx){
    const value = e.currentTarget.previousElementSibling.value

    if (!value) return

    const loc = locations[idx]
    loc.subLocations.push(value)
    locations = [...locations.slice(0, idx), loc, ...locations.slice(idx + 1)]
     e.currentTarget.previousElementSibling.value = ''
  }

  function remove(e, locIdx, subIdx){
    const loc = locations[locIdx]

    if (!loc) return

    if (subIdx === undefined)
      locations = [...locations.slice(0, locIdx), ...locations.slice(locIdx + 1)]
    else{
      loc.subLocations.splice(subIdx, 1)
      locations = locations
    }
  }
</script>

<h2>Emplacements</h2>
<div id="loc-mgr">

  {#if locations && locations.length}
    {#each locations as loc, locIdx}
      <div>
        <span class="name">{loc.name}<span on:click="{e => {remove(e, locIdx)}}" class="delete-main">delete</span></span>
        <div class="subloc-ctnr">
          {#each loc.subLocations as subLoc, subIdx}
            <span><button on:click="{e => {remove(e, locIdx, subIdx)}}" class="small-btn-before-item">&#215;</button>{subLoc}</span>
          {/each}
            <span><input type="text" placeholder="étagère 1"><button class="btn-blue" on:click="{e=>{addSubLoc(e, locIdx)}}">+</span>
        </div>
      </div>
    {/each}
  {/if}

  <div id="newloc-ctnr">
    <label>Nouvel emplacement</label>
    <input type="text" placeholder="Armoire" bind:value={newLocName}>
    <button class="add" on:click={addLocation}>+</button>
  </div>

  <button on:click={save} class="save">Sauvegarder</button>
</div>
<style>
  #loc-mgr{
      border-radius: 5px;
      border: 1px solid var(--dark-blue);
      padding-left: .7em;
      padding-top: 1.5em;
      margin-left: -.5em;
      margin-right: -.5em;
  }

  #newloc-ctnr{
    margin: 1em 0;
  }
  #newloc-ctnr input{
    max-width: 350px;
  }
  label{
    font-size: .9em;
  }

  h2{
    font-size: 1.1em;
    margin: 2em 0 .5em 0;
  }

  .name{
    font-size: 1.1em;
    width: 100%;
    display: inline-block;
    margin-bottom: 3px;
  }
  .name::after{
    width: 70%;
    display: block;
    content: '';
    border-bottom: 1px solid var(--main-color);

  }
  .subloc-ctnr{
    margin-left: 2em;
    display: flex;
    flex-flow: column nowrap;
    justify-content: flex-start;
    align-items: stretch;
    margin-bottom: .2em;
  }
  .subloc-ctnr > span {
    margin-bottom: 5px;
  }

  /* .add{
    font-weight: bold;
    background: var(--main-color);
    color: white;
    border: none;
    border-radius: 50%;
    padding: 5px;
    width: calc(1em + 10px + 3px);
    margin-left: 5px;
    cursor: pointer;
  } */
  .delete-main{
    color: var(--main-color);
    position: absolute;
    right: 2em;
    font-size: .8em;
    cursor: pointer;
  }
  .delete-main::focus{
    color: var(--dark-blue);
  }

  input[type="text"]{
    width: 100%;
    max-width: calc(300px - 2em);
    border-width: 0 0 1px 0;

  }

  .save{
    color: white;
    background: #ba0e0e;
    border: 1px solid white;
    border-radius: 4px;
    font-size: 1.3em;
  }

</style>
