<script>
  export let value = ''
  export let readonly = true

  let label
  $: {
    if (value === 'red') label = 'rouge'
    else if (value === 'white') label = 'blanc'
    else if (value === 'rose') label = 'rosé'
    else label = ''
  }

  // sets wine color. Selecting the current value removes it.
  function setColor(e){
    const color = e.target.dataset.color

    if (!color) return
    if (color !== value) value = color
    else value = ''
  }
</script>

{#if value || !readonly}
  <label>Couleur</label>
  {#if readonly}
    <div data-color={value} class="ro">{label}</div>
  {:else}
    <div class="ctnr" on:click={setColor}>
      <div data-color="red" class:selected="{value === 'red'}">Rouge</div>
      <div data-color="white" class:selected="{value === 'white'}">Blanc</div>
      <div data-color="rose" class:selected="{value === 'rose'}">Rosé</div>
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
    margin-bottom: 10px
  }

  @media (min-width: 450px){
    .ctnr{
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
