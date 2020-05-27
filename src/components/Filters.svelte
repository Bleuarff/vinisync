<script>
  import {onMount} from 'svelte'

  onMount(() => {
  })
</script>

<div id="filters" class="wide">
  <div class="filters-ctnr">
    <label>Filtres:</label>
    <div class="selector">
      <span>Année</span>
      <span>Producteur</span>
      <span>Appellation</span>
    </div>
  </div>
</div>

<style>
  .filters-ctnr{
    max-width: 450px;
    margin: auto;
  }

  .selector{
    display: flex;
    border: 1px solid var(--main-color);
    border-radius: 4px;
    flex-flow: row nowrap;
    justify-content: space-evenly;
  }

  .selector > * {
    padding: 5px 2em;
    flex: 1 0 33%;
    text-align: center;
  }
  .selector > *:not(:last-child) {
    border-right: 1px solid var(--main-color);
  }

  label{
    font-size: .85em;
  }
</style>
