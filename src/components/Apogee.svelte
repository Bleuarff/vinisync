<script>
  export let start = null
  export let end = null
  export let readonly = true

  let startLbl, endLbl

  $: {
    if (!!start && !!end){
      startLbl = 'de'
      endLbl = 'à'
    }
    else if (!!start && !end)
      startLbl = 'à partir de'
    else if (!start && !!end)
      endLbl = "jusqu'à"
  }
</script>

{#if !readonly || !!start || !!end}
<div class="ctnr">
  <label>Apogée</label>

  <div class="line" class:readonly>
  {#if readonly}
    {#if start}
      <span>{startLbl}</span>
      <span class="ro-value">{start}</span>
    {/if}
    {#if end}
      <span>{endLbl}</span>
      <span class="ro-value">{end}</span>
    {/if}
  {:else}
    <span>de</span>
    <input type="number" bind:value={start}>
    <span>à</span>
    <input type="number" bind:value={end}>
  {/if}
  </div>
</div>
{/if}

<style>
  label{
    font-size: .9em;
    margin-bottom: 2px;
  }
  .ro-value{
    display: inline-block;
    font-size: 1.1em;
    padding: 5px 8px;
    border-radius: 4px;
    background: #f5f5f5;
    margin: 0 10px;
  }

  .line{
    display: flex;
    flex-flow: row nowrap;
    justify-content: flex-start;
    align-items: baseline;
  }


  .line:not(.readonly){
    justify-content: space-between;
  }

  .ctnr{
    padding-bottom: 10px;
  }

  @media (min-width: 400px){
    .line:not(.readonly){
      justify-content: flex-start;
    }
  }

  input{
    overflow: hidden;
    border: none;
    border-bottom: 1px solid #bb072d;
    padding-top: 0;
    padding-bottom: 2px;
    margin: 0 10px;
    max-width: 6em;
    border-radius: 0;
  }
  input:last-child{
    margin-right: 0px;
  }

  input:focus{
    outline: none;
    border-bottom-width: 2px;
  }
</style>
