<script>
	import router from 'page'
	import { onMount } from 'svelte'
	import Wines from './pages/Wines.svelte'
	import Entry from './pages/Entry.svelte'
	import Import from './pages/Import.svelte'
	import History from './pages/History.svelte'
	import Conflicts from './pages/Conflicts.svelte'
	import Settings from './pages/Settings.svelte'
	import Stats from './pages/Stats.svelte'
	import Signup from './pages/Signup.svelte'
	import Signin from './pages/Signin.svelte'
	import PwdReset from './pages/PwdReset.svelte'
	import Home from './pages/Home.svelte'
	import Err404 from './pages/Err404.svelte'
	import Notif from './components/Notif.svelte'
	import TitleBar from './components/TitleBar.svelte'
	import Loader from './components/Loader.svelte'
	import I18n from './i18n.js'
	import syncMgr from './syncMgr.js'

	import {send} from './fetch.js'
	import Utils from './utils.js'

	let page,
			currentComponent // component instance
	let path // url pathname
	let params // router path parameters
	let notif // notif child component
	let newRelease = false
	let loader
	let networkOk = true // fetch sends event when request completes or timeouts.

	const env = '__ENVIRONMENT__'

	router('/', getPath, () => {
		try{

			const user = JSON.parse(localStorage.getItem('user'))
			if (user && user.email && user.id && user.key)
				page = Wines
			else
				page = Home
		}
		catch(ex){
			Utils.logError(ex, 'Auth error')
			page = Signup
		}
	})
	router('/wines/:type?', getPath, (ctx, next) => {
		params = ctx.params
		next()
	}, () => page = Wines)
	router('/entry/:id?', getPath, (ctx, next) => {
		params = ctx.params
		next()
	}, () => page = Entry)
	router('/import', getPath, () => page = Import)
	router('/history/:id?', getPath, (ctx, next) => {
		params = ctx.params
		next()
	}, () => page = History)
	router('/conflicts', getPath, () => page = Conflicts)
	router('/settings', getPath, () => page = Settings)
	router('/stats', getPath, () => page = Stats)
	router('/signup', getPath, () => page = Signup)
	router('/signin', getPath, () => page = Signin)
	router('/pwd-reset/:id?', getPath, (ctx, next) => {
		params = ctx.params
		next()
	}, () => page = PwdReset)
	router('*', () => page = Err404)
	router.start()

	function getPath(ctx, next){
		path = ctx.path
		document.title = '__TITLE__'
		next()
	}

	window.i18n = new I18n()

	onMount(async () => {
		console.log('app mount ')
		window.addEventListener('message', onMessage, false)

		setTimeout(() => {
			syncMgr.pendingMonitor()
			if ('serviceWorker' in navigator){
				navigator.serviceWorker.register('/sw.js')
			}

			const user = JSON.parse(localStorage.getItem('user')),
						deviceId = localStorage.getItem('devid')

			if (user && user.id && user.key && deviceId){
				send('/api/init', 'GET', { userid: user.id, devid: deviceId }, user.key)
				.then(d => {
					newRelease = vni.build !== d.build
					if (d.resyncs && d.resyncs.length){
						syncMgr.processResyncs(d.resyncs)
					}
				})
				.catch(err => {}) // just swallow it
			}

		}, 4e3)
	})

	function onMessage(e){
		if (e.origin !== location.origin) return

		switch(e.data.event){
			case 'loader-start':
				loader.show()
				break;
			case 'loader-end':
				loader.hide()
				break;
			case 'notif':
				notif.show(e.data)
				break;
			case 'timeout':
				networkOk = false
				break
			case 'no-timeout':
				networkOk = true
				break
			default:
				console.debug('unknown event ' + JSON.stringify(e.data))
		}
	}

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

	// delete all asset caches, to make sure next reload goes to the network
	async function updateClient(){
		const cacheNames = await caches.keys()
		await cacheNames.reduce(async (prom, cacheName) => {
			await prom
			console.debug(`deleting ${cacheName}`)
			return caches.delete(cacheName)
		}, Promise.resolve)

		document.location.reload()
	}

</script>

<main>
	<TitleBar on:sync-request={forceSync} networkOk={networkOk}></TitleBar>

	{#if newRelease}
	<div id="new-release">
		<span>Nouvelle version disponible !</span>
		<a on:click={updateClient}>Mettre à jour</a>
	</div>
	{/if}

	<svelte:component this={page} bind:this={currentComponent} params={params} on:notif="{e => {notif.show(e.detail)}}" />

	<Notif bind:this={notif}></Notif>

	{#if env !== 'prod'}
		<div id="env-banner" class={env}>{env}</div>
	{/if}

	<Loader bind:this={loader}></Loader>
</main>

<style type="text/less">
	:root{
		--main-color: #ba0e0e;
		--main-color-light: #791a1a;

		--main-color-darker: #620202;
		--global-max-width: 700px;

		--wine-red: #a40e0e;
		--wine-white: #ffea7a;
		--wine-rose: #f78dad;

		--dark-blue: #11151f;

		--main-horiz-margin: 1em;
	}

	main {
		padding: 4em var(--main-horiz-margin) 1em var(--main-horiz-margin);
		width: 100%;
		max-width: var(--global-max-width);
		margin: 0 auto;
		font-family: 'Roboto', sans-serif;
		position: relative;
	}

	#env-banner{
		position: fixed;
		right: 0;
		top: 0;
		width: 300px;
		padding: 4px;
		opacity: .9;
		text-align: center;
		border: 1px solid white;
		z-index: 100;
		color: white;
		font-weight: 1000;
		transform: translate(50%, -50%) rotate(45deg) translateY(80px);
		text-transform: uppercase;
		text-shadow: red 0px 0px 3px;
	}

	#new-release{
		margin-left: calc(-1 * var(--main-horiz-margin));
		margin-right: calc(-1 * var(--main-horiz-margin));
		background: #ffe036;
		text-align: center;
		padding: .4em .3em;

		a {
			cursor: pointer;
		}
	}

	.dev{
		background: #0c546b;
	}
	.stg{
		background: #83db04;
	}

</style>
