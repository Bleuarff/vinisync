<script>
  import { fly } from 'svelte/transition';
  // TODO:
  // - force sync button
  export let path = ''
  let visible = true

  // $: home = path === '/'
  let lastScrollY = 0

  window.addEventListener('scroll', e => {
		const dir = window.scrollY - lastScrollY
    lastScrollY = window.scrollY
    visible = dir < 0
	})

</script>

{#if visible}
  <div id="top" transition:fly="{{y: -40}}">
    <div id="inner">
      <a href="/">V</a>
      <a href="/stats" class="icon-chart-bar"></a>
      <span class="icon-arrows-cw"></span>
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
    z-index: 10;
  }

  #inner{
    max-width: 700px;
    margin: auto;
  }

	a {
		text-decoration: none;
		color: unset;
	}

</style>
