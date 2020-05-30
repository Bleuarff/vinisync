<script>
import { tick } from 'svelte'
import Autocomplete from './Autocomplete.svelte'

export let value = ''
export let label = ''
export let readonly = true
export let placeholder = ''
export let type = 'text'
export let datasource = ''

let inputNd
let autocomplete = null // Autocomplete instance

$: if (!readonly && type === 'text'){
  void async function(){
    await tick()
    resize()
  }()
}

let containingUnit
$: if (type === 'containing'){
  containingUnit = value < 25 ? 'L': 'cl'
}

function resize(e){
  const nd = e ? e.currentTarget : inputNd
  setTimeout(() => {
    nd.style.height = ''
    nd.style.height = nd.scrollHeight+'px'
  }, 0)
}

</script>

{#if !readonly || !!value}
<div class="formfield {type}">
  <label>{label}</label>
  {#if readonly}
    <span class="readonly">{value} {#if type === 'containing'}{containingUnit}{/if}</span>
  {:else if type === 'text'}
    <textarea bind:value wrap="soft" bind:this={inputNd} rows="1" placeholder={placeholder}
      on:input={resize} on:focus={resize} on:change={resize} class="input"
      on:focus="{e => {autocomplete && autocomplete.show()}}"
      on:blur="{e => {autocomplete && autocomplete.hide()}}"></textarea>

  {:else if type === 'year'}
    <input type="number" bind:value class="input">

  {:else if type=== 'containing'}
    <input type="text" bind:value class="input"
      on:focus="{e => {autocomplete && autocomplete.show()}}"
      on:blur="{e => {autocomplete && autocomplete.hide()}}">{containingUnit}

  {/if}

  {#if datasource}
    <Autocomplete source={datasource} bind:this={autocomplete} bind:value></Autocomplete>
  {/if}
</div>
{/if}

<style>
  .formfield{
    width: 100%;
    padding-bottom: 10px;
    overflow: hidden;
  }

  .year{
    /* max-width: 7em;
    width: 50%; */
  }
  .year input{
    width: 100%;
  }

  .readonly{
    display: inline-block;
    font-size: 1.1em;
    padding: 5px 8px;
    border-radius: 4px;
    background: #f5f5f5;
  }

  label{
    font-size: .9em;
    margin-bottom: 2px;
  }

  .input{
    overflow: hidden;
    border: none;
    border-bottom: 1px solid #bb072d;
    padding-top: 0;
    padding-bottom: 2px;
    border-radius: 0;
  }

  .input:focus{
    outline: none;
    border-bottom-width: 2px;
  }

  textarea{
    box-sizing: content-box;
    width: 100%;
    padding: 0;
    min-height:1.187em;
  }

  .containing input{
    width: 6em;
  }
</style>
