<script>
	import router from 'page'
	import Wines from './Wines.svelte'
	import Entry from './Entry.svelte'
	import Import from './Import.svelte'

	let page
	let params

	router('/', () => page = Wines)
	router('/wines', () => page = Wines)
	router('/entry/:id?', (ctx, next) => {
		params = ctx.params
		next()
	}, () => {page = Entry})
	router('/import', () => page = Import)
	router.start()

</script>

<main>
	<h1><a href="/">Vinisync</a></h1>
	<!-- <h7>Your cellar mgmt app</h7> -->

	<!-- <Wines entries={defaultEntries}></Wines>
	<Entry></Entry> -->
	<svelte:component this={page} params={params} />
</main>

<style>
	@import url('https://fonts.googleapis.com/css?family=Roboto&display=swap&subset=latin-ext');

	main {
		padding: 0 1em 1em 1em;
		width: 100%;
		max-width: 700px;
		margin: 0 auto;
		font-family: 'Roboto', sans-serif;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 2em;
		font-weight: 100;
		text-align: left;
		margin-top: 0;
		margin-bottom: 2em;
	}

	h1 a {
		text-decoration: none;
		color: unset;
	}

</style>
