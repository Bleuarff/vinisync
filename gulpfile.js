'use strict'

const { series, parallel, src, dest } = require('gulp'),
      nodemon = require('gulp-nodemon'),
      replace = require('gulp-replace'),
      argv = require('yargs').argv,
      { exec } = require('child_process'),
      zip = require('gulp-zip'),
      {DateTime} = require('luxon')

const env = argv.e || argv.env || 'dev' // environment to build.
const buildTime = DateTime.local().toFormat('yyyyMMddHHmm')

const config = {
	dev: {
		host: 'dev.vinisync.fr'
	},
  stg: {
		host: 'stg.vinisync.fr'
	},
	prod: {
		host: 'vinisync.fr'
	}
}

if (!config[env]){
  console.error(`Invalid env '${env}'`)
  return
}

const replacements = {
	__HOST__: config[env].host
}

function make(){
  return replaceAll(src('server/*.js'))
    .pipe(dest('dist/server/'))
}

function watch(cb){
  nodemon({
    script: 'dist/server/main.js',
    watch: 'server/',
    env: { 'NODE_ENV': 'development' },
    done: cb
  })
}

function rollup(){
  return exec('npm run build');
}

function archive(){
  return src('dist/**')
    .pipe(zip(`archive_${env}_${buildTime}.zip`))
    .pipe(dest('releases/'))
}

function replaceAll(stream){
  Object.entries(replacements).forEach(([key, val]) => {
    let output = typeof val === 'object' ? JSON.stringify(val) : val.toString()
    stream = stream.pipe(replace(key, output))
  })
  return stream
}

exports.default = series(make, watch)
exports.make = make
exports.build = series(
  // make files (server & client), then archive the lot
  parallel(make, rollup),
  archive
)
