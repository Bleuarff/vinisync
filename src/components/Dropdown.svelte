<script>
	import {tick} from 'svelte'
	import { createEventDispatcher } from 'svelte'
	const dispatch = createEventDispatcher()

	let value
	export let data = []
	let modal = false

	$: currentData = data
	$: placeholder = data[Math.round(Math.random()*16)]

	$: {
		if (!value)
			currentData = data
		else{
			const normalized = value, // TODO: actual normalization
						rx = new RegExp(`${value}`, 'i')
			currentData = data.filter(x => rx.test(x))
		}
	}

	// on click on the default input, open the modal
	async function expand(e){
		if (!modal){
			modal = true
			e.preventDefault()
			await tick()
			document.querySelector('#content').focus()
			return
		}
	}

	// On click on a dropdown value, select it as the desired filter
	function select(selection){
		console.debug(`dropdown value: ${selection}`)
		value = selection
		dispatch('change', {value: selection})
		modal= false
	}

</script>

<div id="dropdown-selector" class:modal>
<!-- TODO: restrict keypress to enter -->
	<input type="text" bind:value readonly on:click={expand} on:keypress={expand} placeholder={placeholder}>
	{#if modal}
		<div id="content">
			<input type="text" bind:value placeholder={placeholder}>
			<ul class="options">
				{#each currentData as value}
				<li on:click="{select(value)}" tabindex="0">{value}</li>
				{/each}
			</ul>
			<div class="cancel" on:click={()=>{modal = false}}><span class="icon-cancel"></span></div>
		</div>
		<div id="cloak" on:click="{()=>{modal=false}}"></div>
	{/if}
</div>


<style type="text/less">
	#dropdown-selector{
		text-align: center;

		> input{
			width: 90%;
			max-width: 550px;
		}
	}
	#cloak{
		display: none;
	}

	#content{
		display: none;
	}

	#content{
		position: fixed;
		left: 50%;
		top: 50%;
		width: 85vw;
		max-width: 600px;
		height: 85vh;
		max-height: 600px;
		margin: auto;
		border-radius: 3px;
		box-shadow: 1px 1px 2px 1px #222;
		z-index: 100;
		background: white;
		border: 1px solid #c4c4c4;
		transform: translate(-50%, -50%);
		overflow: hidden;

		display: flex;
		flex-flow: column nowrap;
		justify-content: flex-start;
		align-items: stretch;
		padding: .9em 1em .35em;
	}

	#cloak{
		display: block;
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background: white;
		opacity: .4;
		z-index: 70;
	}

	.options{
		flex: 1 0;
		display: inline-flex;
		flex-flow: row wrap;
		justify-content: flex-start;
		align-items: flex-start;
		align-content: flex-start;
		list-style-type: none;
		padding: 0;
		margin: .9em 0 0;
		overflow: auto;
		font-size: .95em;

		li {
			background: var(--main-color);
			color: white;
			border-radius: 2px;
			padding: 5px 12px;
			margin: 5px;
			cursor: pointer;
			text-align: left;

			&:hover, &:focus{
				background: var(--main-color-darker);
			}
		}
	}

	.cancel{
		align-self: center;
		text-align: center;
		width: 100%;
		margin-top: 8px;
		min-width: 220px;
		background: #f7f7f7;
		font-size: 2em;
		padding: 2px 0;
		cursor: pointer;
	}
</style>
