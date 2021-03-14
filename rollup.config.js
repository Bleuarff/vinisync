import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';

import { less } from 'svelte-preprocess-less'
// import livereload from 'rollup-plugin-livereload';
import { terser } from 'rollup-plugin-terser';
import {DateTime} from 'luxon';

const production = !process.env.ROLLUP_WATCH;
// const env = process.env.ROLLUP_WATCH ? 'dev' : 'prod'
const env = process.env.VINISYNC_BUILD_ENV

const config = {
	dev: {
		title: 'Vinisync [DEV]'
	},
	stg: {
		title: 'Vinisync [STG]'
	},
	prod: {
		title: 'Vinisync'
	}
}

export default {
	input: 'src/main.js',
	output: {
		sourcemap: true,
		format: 'iife',
		name: 'app',
		file: 'dist/public/build/bundle.js'
	},
	plugins: [
		replace({
      __ENVIRONMENT__: env,
			__BUILDDATE__ : DateTime.local().toFormat('yyyyMMdd_HHmmZ'),
			__BUILD__: process.env.VINISYNC_BUILD_NUMBER,
			__TITLE__: config[env].title
    }),

		svelte({
			preprocess: {
        style: less(),
      },

			// enable run-time checks when not in production
			dev: !production,
			// we'll extract any component CSS out into
			// a separate file - better for performance
			// css: css => {
			// 	css.write('dist/public/build/bundle.css');
			// }
		}),

		// If you have external dependencies installed from
		// npm, you'll most likely need these plugins. In
		// some cases you'll need additional configuration -
		// consult the documentation for details:
		// https://github.com/rollup/plugins/tree/master/packages/commonjs
		resolve({
			browser: true,
			dedupe: ['svelte']
		}),
		commonjs(),

		// In dev mode, call `npm run start` once
		// the bundle has been generated
		// !production, && serve(),

		// Watch the `public` directory and refresh the
		// browser on changes when not in production
		// !production && livereload('public'),

		// If we're building for production (npm run build
		// instead of npm run dev), minify
		production && terser()
	],
	watch: {
		clearScreen: false
	}
};
