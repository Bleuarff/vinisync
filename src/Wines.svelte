<script>
import { onMount } from 'svelte'
import {repo } from './storage.js'
let entries = []

export let params = {}

onMount(async () => {
  entries = await repo.getAll()
})

</script>

<h2>Wines</h2>
<ul>
  {#each entries as entry}
    <li><a href="/entry/{entry.id}">{entry.producer} - {entry.year}</a></li>
  {/each}
</ul>

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
