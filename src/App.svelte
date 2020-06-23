<script>
	import router from 'page'
	import { onMount } from 'svelte'
	import Wines from './pages/Wines.svelte'
	import Entry from './pages/Entry.svelte'
	import Import from './pages/Import.svelte'
	import Sync from './pages/Sync.svelte'
	import History from './pages/History.svelte'
	import Conflicts from './pages/Conflicts.svelte'
	import Err404 from './pages/Err404.svelte'
	import Notif from './components/Notif.svelte'
	import TitleBar from './components/TitleBar.svelte'
	import syncMgr from './syncMgr.js'

	let page,
			currentComponent // component instance
	let path // url pathname
	let params // router path parameters
	let notif // notif child component
	// let name // page name

	router('/', getPath, () => page = Wines)
	router('/wines', getPath, () => page = Wines)
	router('/entry/:id?', getPath, (ctx, next) => {
		params = ctx.params
		next()
	}, () => page = Entry)
	router('/import', getPath, () => page = Import)
	router('/sync', getPath, () => page = Sync)
	router('/history/:id?', getPath, (ctx, next) => {
		params = ctx.params
		next()
	}, () => page = History)
	router('/conflicts', getPath, () => page = Conflicts)
	router('*', () => page = Err404)
	router.start()

	function getPath(ctx, next){
		path = ctx.path
		next()
	}

	onMount(async () => {
		console.log('app mount ')
		syncMgr.pendingMonitor()
	})

	async function forceSync(){
		try{
			let notifyId
			if (currentComponent instanceof Entry)
				notifyId = params.id

			const hasUpdates = await syncMgr.checkUpdates(notifyId, true)
			if (hasUpdates && typeof currentComponent.load === 'function'){
				currentComponent.load()
				notif.show({text: 'Mise à jour OK'})
			}
		}
		catch(ex){
			console.error(ex)
			notif.show({text: 'Erreur de synchro', err: true})
		}
	}

</script>

<main>
	<TitleBar on:sync-request={forceSync}></TitleBar>

	<svelte:component this={page} bind:this={currentComponent} params={params} on:notif="{e => {notif.show(e.detail)}}"/>

	<Notif bind:this={notif}></Notif>
</main>

<style>
	@import url('https://fonts.googleapis.com/css?family=Roboto&display=swap&subset=latin-ext');

	:root{
	  --main-color: #ba0e0e;
		--main-color-light: #791a1a8a;
		--global-max-width: 700px;
	}

	main {
		padding: 2.5em 1em 1em 1em;
		width: 100%;
		max-width: var(--global-max-width);
		margin: 0 auto;
		font-family: 'Roboto', sans-serif;
		position: relative;
	}

</style>
