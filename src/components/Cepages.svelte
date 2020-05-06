<script>
  export let cepages = []
  export let readonly = true

  let inputNd

  function addCepage(e){
    const cepage = inputNd.value.trim() // sanitize

    if (cepage && !cepages.includes(cepage)){
      cepages = [...cepages, cepage]
      inputNd.value = ''
      inputNd.focus()
    }
  }
</script>

{#if !readonly || cepages && cepages.length}
<label>Cépages</label>
<div class="ctnr" class:readonly>
  {#each cepages as cepage}
    <span class="cpg">{cepage}</span>
  {/each}

  {#if !readonly}
  <div>
    <input bind:this={inputNd} type="text" placeholder="cabernet franc">
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
    padding: 2px 4px;
    border-radius: 4px;
    margin-bottom: 6px;
  }

  .cpg:not(:last-child){
    margin-right: 10px;
  }

  /* .ctnr:not(.readonly) .cpg::after{
    content: '✖';
    padding-left: 12px;
    cursor: pointer;
  } */

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
