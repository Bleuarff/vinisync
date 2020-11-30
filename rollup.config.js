import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
// import livereload from 'rollup-plugin-livereload';
import { terser } from 'rollup-plugin-terser';
import {DateTime} from 'luxon';
import { execSync } from 'child_process';
import {createHash} from 'crypto';
import fs from 'fs'

const production = !process.env.ROLLUP_WATCH;
const env = process.env.ROLLUP_WATCH ? 'dev' : 'prod'

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
			__BUILD__: getBuildNumber()
    }),

		svelte({
			// enable run-time checks when not in production
			dev: !production,
			// we'll extract any component CSS out into
			// a separate file - better for performance
			css: css => {
				css.write('dist/public/build/bundle.css');
			}
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
		!production && serve(),

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

function serve() {
	let started = false;

	return {
		writeBundle() {
			if (!started) {
				started = true;

				require('child_process').spawn('npm', ['run', 'start', '--', '--dev'], {
					stdio: ['ignore', 'inherit', 'inherit'],
					shell: true
				});
			}
		}
	};
}

function getBuildNumber(){
	let build = execSync('git rev-parse --short=7 HEAD').toString().substring(0, 7) // get short commit id, minus newline
	const status = execSync('git status --porcelain -z').toString().split('\u0000')

  if (status.length > 1){
    const hasher = createHash('sha1')
    status.pop() // remove last element, always empty

    // when a file is renamed, the separator between new and old names is also the null char.
    // So detect and remove them from list of files to hash.
    let idx, start = 0
    do{
      idx = status.findIndex((x, i) => i >= start && /^R. /.test(x))
      if (idx != -1){
        status.splice(idx + 1, 1)
        start = idx + 1
      }
    }
    while (idx > -1)

    status.forEach(line => {
      // parse each line. Does not handle the case when the line is in the form "XY to from"
      const file = line.substring(3).split(' ')[0],
            content = fs.readFileSync(file)
      hasher.update(content)
    })
    const hash = hasher.digest('hex')
    build += '_' + hash.substring(0, 4)
  }

	return build
}
