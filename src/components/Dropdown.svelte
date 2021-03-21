<script>
	import { createEventDispatcher } from 'svelte'
	const dispatch = createEventDispatcher()

	let value
	export let data = []
	let modal = false

	$: currentData = data

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
	function expand(e){
		console.debug("c'est moi")
		if (!modal){
			modal = true
			e.preventDefault()
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
	<input type="text" bind:value readonly on:click={expand} on:keypress={expand} placeholder="Châteauneuf du Pape">
	<div id="content">
		<input type="text" bind:value>
		<ul class="options">
			{#each currentData as value}
			<li on:click="{select(value)}" tabindex="0">{value}</li>
			{/each}
		</ul>
	</div>
	<div id="cloak" on:click="{()=>{modal=false}}"></div>
</div>


<style type="text/less">
	#dropdown-selector{
		text-align: center;
	}
	#cloak{
		display: none;
	}

	#content{
		display: none;
	}

	.modal{
		#content{
			display: block;
			text-align: left;
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
			padding: .9em 1em;
		}

		#cloak{
			display: block;
			position: fixed;
			top: 0;
			left: 0;
			width: 100vw;
			height: 100vh;
			background: white;
			opacity: .3;
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

			li {
				background: var(--main-color);
				color: white;
				border-radius: 2px;
				padding: 5px 12px;
				margin: 5px;
				cursor: pointer;

				&:hover, &:focus{
					background: var(--main-color-darker);
				}
			}
		}
	}
</style>
