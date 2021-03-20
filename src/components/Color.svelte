<script>
  import { createEventDispatcher } from 'svelte'
  const dispatch = createEventDispatcher();

  export let value = ''
  export let readonly = true
  export let filter = false

  let label
  $: {
    if (value === 'red') label = 'rouge'
    else if (value === 'white') label = 'blanc'
    else if (value === 'rose') label = 'rosé'
    else label = ''
  }

  // sets wine color. Selecting the current value removes it.
  function setColor(e){
    if (e.type === "keypress" && e.key !== 'Enter') return

    const color = e.target.dataset.color
    if (!color) return

    if (color !== value)
      value = color
    else
      value = ''

    if (value)
      dispatch('change', {value: value})
  }
</script>

{#if value || !readonly}
  {#if !filter}
    <label>Couleur</label>
  {/if}
  {#if readonly}
    <div data-color={value} class="ro">{label}</div>
  {:else}
    <div class="ctnr" class:filter on:click={setColor} on:keypress={setColor}>
      <div data-color="red" class:selected="{value === 'red'}" tabindex="0">Rouge</div>
      <div data-color="white" class:selected="{value === 'white'}" tabindex="0">Blanc</div>
      <div data-color="rose" class:selected="{value === 'rose'}" tabindex="0">Rosé</div>
    </div>
  {/if}
{/if}

<style>
  label{
    font-size: .9em;
    margin-bottom: 2px;
  }

  .ctnr{
    display: flex;
    flex-flow: row nowrap;
    justify-content: space-evenly;
    margin-bottom: 10px
  }

  .ctnr div{
    border-radius: 4px;
    padding: 1em;
    cursor: pointer;
    user-select: none;
    position: relative;
  }

  .ctnr div:focus{
    outline: 1px dotted black;

  }

  [data-color="red"]{
    background: var(--wine-red);
    color: white;
  }
  [data-color="white"]{
    background: var(--wine-white);
  }
  [data-color="rose"]{
    background: var(--wine-rose);
  }

  .selected::after{
    content: '';
    position: absolute;
    width: calc(100% - 6px);
    height: calc(100% - 6px);
    background: transparent;
    border: 2px solid black;
    border-radius: 4px;
    top: 3px;
    left: 3px;
  }
  .selected[data-color="red"]::after{
    border-color: white;
  }

  .ro{
    text-transform: Capitalize;
    display: inline-block;
    padding: 1em;
    border-radius: 4px;
    margin-bottom: 20px
  }

  .filter{
    width: 100%;
    max-width: 450px;
    margin: auto;
  }

  @media (min-width: 450px){
    .ctnr:not(.filter){
      justify-content: flex-start;
    }
    .ctnr div:not(:first-child){
      margin-left: 2em;
    }
    .ctnr div:not(:last-child){
      margin-right: 2em;
    }
  }
</style>
