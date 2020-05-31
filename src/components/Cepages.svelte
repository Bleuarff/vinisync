<script>
  import { onMount } from 'svelte'
  import Autocomplete from './Autocomplete.svelte'
  export let cepages = []
  export let readonly = true

  let cepValue // current entry
  let inputNd // ref new cepage input node
  let autocomplete // node ref

  let inputPos
  onMount(() => {
    // Needs a delay to get correct value
    setTimeout(() => {
      inputPos = inputNd.getBoundingClientRect()
    }, 2000)
  })

  // $: inputPos = inputNd ? inputNd.getBoundingClientRect() : undefined

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
    <Autocomplete source="cepage" bind:this={autocomplete} bind:value={cepValue} parentPosition={inputPos}></Autocomplete>

    <button on:click={addCepage}>Ajouter</button>
  </div>
  {/if}
</div>
{/if}

<!-- <datalist id="cepages-choices">
  <option value="Altesse">
  <option value="Aligoté">
  <option value="Arbanne">
  <option value="Bourboulenc">
  <option value="Cabernet franc">
  <option value="Cabernet-Sauvignon">
  <option value="Carignan">
  <option value="Carménère">
  <option value="Chardonnay">
  <option value="Chasselas">
  <option value="Chenin">
  <option value="Cinsault">
  <option value="Clairette">
  <option value="Colombard">
  <option value="Côt">
  <option value="Counoise">
  <option value="Courbu B">
  <option value="courbu N">
  <option value="Fer Servadou">
  <option value="Folle-Blanche">
  <option value="Gros plan">
  <option value="Gamay">
  <option value="Gewurztraminer">
  <option value="Grenache B">
  <option value="Grenache G">
  <option value="Grenache N">
  <option value="Grolleau">
  <option value="Gros Manseng">
  <option value="Jacquère">
  <option value="Macabeu">
  <option value="Malbec">
  <option value="Malvoisie">
  <option value="Marsanne">
  <option value="Melon de Bourgogne">
  <option value="Merlot">
  <option value="Mondeuse">
  <option value="Mourvèdre">
  <option value="Muscadelle">
  <option value="Muscadet">
  <option value="Muscat d'Alexandrie">
  <option value="Muscat à petits grains">
  <option value="Muscat N">
  <option value="Négrette">
  <option value="Nielluccio">
  <option value="Pedro Ximénez">
  <option value="Persan">
  <option value="Petit courbu">
  <option value="Petit Manseng">
  <option value="Petit Verdot">
  <option value="Picpoul">
  <option value="Pineau d'Aunis">
  <option value="Pinot B">
  <option value="Pinot G">
  <option value="Pinot N">
  <option value="Pinot meunier">
  <option value="Poulsard">
  <option value="Prunelard">
  <option value="Riesling">
  <option value="Rolle">
  <option value="Roussanne">
  <option value="Roussette">
  <option value="Sauvignon">
  <option value="Savagnin">
  <option value="Sciacarello">
  <option value="Sémillon">
  <option value="Servant">
  <option value="Sylvaner">
  <option value="Syrah">
  <option value="Tannat">
  <option value="Tempranillo">
  <option value="Terret N">
  <option value="Tibouren">
  <option value="Tokay">
  <option value="Torrontés">
  <option value="Traminer">
  <option value="Trebbiano">
  <option value="Trousseau">
  <option value="Ugni blanc">
  <option value="Vaccarèse">
  <option value="Vermentino">
  <option value="Viognier">
  <option value="Zinfandel">
</datalist> -->

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
