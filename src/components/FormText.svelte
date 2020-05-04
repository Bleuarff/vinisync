<script>
import { tick } from 'svelte'
export let value = ''
export let label = ''
export let readonly = true
export let placeholder = ''

let inputNd

$: if (!readonly){
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
<div class="form-text">
  <label>{label}</label>
  {#if readonly}
    <span class="readonly">{value}</span>
  {:else}
    <textarea bind:value wrap="soft" bind:this={inputNd} rows="1" placeholder={placeholder} on:input={resize} on:focus={resize} style="" on:change={resize}></textarea>
  {/if}
</div>
{/if}

<style>
  .form-text{
    width: 100%;
    padding-bottom: 10px;
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

  textarea{
    box-sizing: content-box;
    width: 100%;
    overflow: hidden;
    /* height: 1em; */
    border: none;
    border-bottom: 1px solid #bb072d;
    padding: 0;
    min-height:1.187em;
  }
</style>
