<script>
	import router from 'page'
	import { onMount } from 'svelte'
	import Wines from './pages/Wines.svelte'
	import Entry from './pages/Entry.svelte'
	import Import from './pages/Import.svelte'
	import Sync from './pages/Sync.svelte'
	import Notif from './components/Notif.svelte'
	import TitleBar from './components/TitleBar.svelte'
	import syncMgr from './syncMgr.js'

	let page
	let path
	let params
	let notif // notif child component

	router('/', getPath, () => page = Wines)
	router('/wines', getPath, () => page = Wines)
	router('/entry/:id?', getPath, (ctx, next) => {
		params = ctx.params
		next()
	}, () => page = Entry)
	router('/import', () => page = Import)
	router('/sync', () => page = Sync)
	router.start()

	function getPath(ctx, next){
		path = ctx.path
		// console.log('path: '+ path)
		next()
	}

	onMount(async () => {
		console.log('app mount ')
		syncMgr.pendingMonitor()
	})

</script>

<main>
	<TitleBar path={path}></TitleBar>

	<svelte:component this={page} params={params} on:notif="{e => {notif.show(e.detail)}}"/>

	<Notif bind:this={notif}></Notif>
</main>

<style>
	@import url('https://fonts.googleapis.com/css?family=Roboto&display=swap&subset=latin-ext');

	main {
		padding: 2.5em 1em 1em 1em;
		width: 100%;
		max-width: 700px;
		margin: 0 auto;
		font-family: 'Roboto', sans-serif;
		position: relative;
	}

</style>
