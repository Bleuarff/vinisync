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
</script>

<h3>Emplacements</h3>

{#if locations && locations.length}
  {#each locations as loc, locIdx}
    <div>
      <span class="name">{loc.name}</span>
      <div class="subloc-ctnr">
        {#each loc.subLocations as subLoc}
          <span>{subLoc}</span>
        {/each}
          <span><input type="text" placeholder="étagère 1"><button class="add" on:click="{(e)=>{addSubLoc(e, locIdx)}}">+</span>
      </div>
    </div>
  {/each}
{/if}

<div id="newloc-ctnr">
  <label>Nouvel emplacement</label>
  <input type="text" placeholder="Armoire" bind:value={newLocName}>
  <button class="add" on:click={addLocation}>+</button>
</div>

<!-- TODO: add new loc & sublocs to list, save -->
<button on:click={save}>Sauvegarder</button>

<style>

  #newloc-ctnr{
    margin: 1em 0;
  }
  #newloc-ctnr input{
    max-width: 380px;
  }
  label{
    font-size: .9em;
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

  .add{
    font-weight: bold;
    background: var(--main-color);
    color: white;
    border: none;
    border-radius: 50%;
    padding: 5px;
    width: calc(1em + 10px + 3px);
    margin-left: 5px;
    cursor: pointer;
  }

  input[type="text"]{
    width: 100%;
    max-width: calc(300px - 2em);
    border-width: 0 0 1px 0;

  }
</style>
