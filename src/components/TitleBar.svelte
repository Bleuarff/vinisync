<script>
  import {onMount} from 'svelte'
  import {repo} from '../storage.js'
  import { fly } from 'svelte/transition'
  import { createEventDispatcher } from 'svelte'
  const dispatch = createEventDispatcher()

  export let networkOk
  let visible = true
  let debouncer = 0
  let lastScrollY = 0
  let showConflicts = false

  onMount(async () => {
    await repo.open()
    showConflicts = !!(await repo.findOne('conflicts', x => !!x)) // returns first document
  })

  window.addEventListener('scroll', e => {
    const ts = Date.now()
    if (ts - debouncer < 50)
      return

		const dir = window.scrollY - lastScrollY
    lastScrollY = window.scrollY
    visible = dir < 0
    debouncer = ts
	})

</script>

{#if visible}
  <div id="top" transition:fly="{{y: -40}}">
    <div id="inner">
      <a href="/">&nbsp;</a>
      <a href="/stats" class="icon-chart-bar"></a>
      <a href="/settings" class="icon-cog-outline" title="Paramètres"></a>

      {#if showConflicts}
        <a href="/conflicts" class="icon-bomb" title="Conflits"></a>
      {/if}

      <button class="icon-arrows-cw force-sync" class:hidden={!networkOk} title="Forcer la synchro" on:click="{()=>{dispatch('sync-request')}}"></button>
    </div>
  </div>
{/if}

<style type="text/less">
  #top{
    position: fixed;
    top: 0;
    left: 0;
    right: 0%;
    background: #ba0e0e;
    color: white;
    font-size: 1.5em;
    padding: 8px 10px;
    border-bottom: 1px solid white;
    z-index: 100;
  }

  #inner{
    max-width: var(--global-max-width);
    margin: auto;
  }

	a {
		text-decoration: none;
		color: unset;
    --link-space: 10px;
    padding-left: var(--link-space);
    padding-right: var(--link-space);
	}

  a[href="/"]{
    display: inline-block;
    width: 29px;
    padding-left: 0;
    background: url('/img/logo.svg') no-repeat;
    background-size: contain;
  }

  .force-sync{
    color: white;
    background: transparent;
    padding: 0;
    border: none;
    margin: 0;
    float: right;
  }

</style>
