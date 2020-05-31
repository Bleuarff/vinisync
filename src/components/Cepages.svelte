<script>
  import { onMount } from 'svelte'
  import Autocomplete from './Autocomplete.svelte'
  export let cepages = []
  export let readonly = true

  let cepValue // current entry
  let inputNd // ref new cepage input node
  let autocomplete // node ref

  // adds cepage to list
  function addCepage(e){
    cepValue = cepValue.trim() // sanitize

    if (cepValue && !cepages.includes(cepValue)){ // checks if not already present
      cepages = [...cepages, cepValue]
      cepValue = ''

      inputNd.focus()
    }
  }

  // remove cepage from list
  function remove(value){
    if (value){
      cepages = cepages.filter(x => x != value)
    }
  }
</script>

{#if !readonly || cepages && cepages.length}
  <label>Cépages</label>
  <div class="ctnr" class:readonly>
    {#each cepages as cepage}
      <div class="cpg">{cepage}
        {#if !readonly}
          <!-- delete button, only in edition -->
          <span class="remove" on:click={remove(cepage)} title="Supprimer">✖</span>
        {/if}
      </div>
    {/each}

    {#if !readonly}
      <div>
        <input bind:this={inputNd} type="text" placeholder="Cabernet Franc" bind:value={cepValue}
          on:focus="{e => {autocomplete && autocomplete.show()}}"
          on:blur="{e => {autocomplete && autocomplete.hide()}}">
        <Autocomplete source="cepage" bind:this={autocomplete} bind:value={cepValue} ></Autocomplete>

        <button on:click={addCepage}>Ajouter</button>
      </div>
    {/if}
  </div>
{/if}

<style>
  label{
    font-size: .9em;
    margin-bottom: 2px;
  }

  .ctnr{
    display: flex;
    flex-flow: row wrap;
    justify-content: flex-start;
    align-content: flex-start;
    align-items: baseline;
    margin-bottom: 4px;
  }

  .cpg{
    background: var(--main-color);
    color: white;
    padding: 2px 5px;
    border-radius: 4px;
    margin-bottom: 6px;
  }

  .cpg:not(:last-child){
    margin-right: 10px;
  }

  .remove{
    padding: 3px;
    margin-left: 7px;
    cursor: pointer;
  }

  input{
    border: none;
    border-bottom: 1px solid #bb072d;
    padding: 0;
    padding-bottom: 2px;
    border-radius: 0;
  }

  input:focus{
    border-bottom-width: 2px;
  }

</style>
