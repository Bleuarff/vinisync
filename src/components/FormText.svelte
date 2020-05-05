<script>
import { tick } from 'svelte'
export let value = ''
export let label = ''
export let readonly = true
export let placeholder = ''
export let type = 'text'

let inputNd

$: if (!readonly && type === 'text'){
  void async function(){
    await tick()
    resize()
  }()
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
    <span class="readonly">{value}</span>
  {:else if type === 'text'}
    <textarea bind:value wrap="soft" bind:this={inputNd} rows="1" placeholder={placeholder}
      on:input={resize} on:focus={resize} on:change={resize} class="input"></textarea>
  {:else if type === 'year'}
    <input type="number" bind:value class="input">
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
  }

  .input{
    overflow: hidden;
    border: none;
    border-bottom: 1px solid #bb072d;
    padding-top: 0;
    padding-bottom: 0;
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
</style>
