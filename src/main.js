import App from './App.svelte';

const app = new App({
	target: document.body,
	props: {
		// name: 'world'
	}
});

window.vni ={...window.vni, ...{
	env: '__ENVIRONMENT__',
	build: '__BUILD__',
	date: '__BUILDDATE__'
}}

export default app;
