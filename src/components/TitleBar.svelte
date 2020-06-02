<script>
  import { fly } from 'svelte/transition'
  import { createEventDispatcher } from 'svelte'
  const dispatch = createEventDispatcher()

  let visible = true
  let debouncer = 0
  let lastScrollY = 0

  window.addEventListener('scroll', e => {
    const ts = Date.now()
    if (ts - debouncer < 50)
      return

		const dir = window.scrollY - lastScrollY
    // console.log(dir)
    lastScrollY = window.scrollY
    visible = dir < 0
    debouncer = ts
	})

</script>

{#if visible}
  <div id="top" transition:fly="{{y: -40}}">
    <div id="inner">
      <a href="/">V</a>
      <a href="/stats" class="icon-chart-bar"></a>
      <a href="/sync" class="icon-cog-outline" title="Synchronisation"></a>
      <button class="icon-arrows-cw force-sync" title="Forcer la synchro" on:click="{()=>{dispatch('sync-request')}}"></button>
    </div>
  </div>
{/if}

<style>
  #top{
    position: fixed;
    top: 0;
    left: 0;
    right: 0%;
    background: #ba0e0e;
    color: white;
    font-size: 1.2em;
    padding: 5px 10px;
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
