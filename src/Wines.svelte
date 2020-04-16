<script>
import { onMount } from 'svelte'
import {repo } from './storage.js'
export let params = {}

let entries = []

onMount(async () => {
  await repo.open()
  entries = await repo.getEntries()
})

</script>

{#if entries.length > 0}

  <h2>Wines</h2>
  <p>Votre cave contient {entries.length} references.</p>
  <ul>
    {#each entries as entry}
      <li><a href="/entry/{entry.id}">{entry.wine.producer} - {entry.wine.year}</a></li>
    {/each}
  </ul>

{:else}
  <p>Votre cave est vide.</p>
{/if}

<a href="/entry">Ajouter un vin</a>

<style>
ul{
  list-style-type: none;
}

li a{
  text-decoration: none;
  color: unset;
}

li a:hover{
  background: #b7b7b7;
}
</style>
