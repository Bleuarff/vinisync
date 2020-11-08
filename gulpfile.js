'use strict'

const { series, parallel, src, dest } = require('gulp'),
      nodemon = require('gulp-nodemon'),
      replace = require('gulp-replace'),
      argv = require('yargs').argv

const env = argv.e || argv.env || 'dev' // environment to build.

const config = {
	dev: {
		host: 'dev.vinisync.fr'
	},
	prod: {
		host: 'vinisync.fr'
	}
}

const replacements = {
	__HOST__: config[env].host
}

function make(){
  return replaceAll(src('server/*.js'))
    .pipe(dest('dist/'))
}

function watch(cb){
  nodemon({
    script: 'dist/server.js',
    watch: 'server/',
    env: { 'NODE_ENV': 'development' },
    done: cb
  })
}

function replaceAll(stream){
  Object.entries(replacements).forEach(([key, val]) => {
    let output = typeof val === 'object' ? JSON.stringify(val) : val.toString()
    stream = stream.pipe(replace(key, output))
  })
  return stream
}

exports.default = series(make, watch)
