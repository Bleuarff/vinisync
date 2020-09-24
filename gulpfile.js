'use strict'

const gulp = require('gulp'),
      nodemon = require('gulp-nodemon')

function start(cb){
  nodemon({
    script: 'server/server.js',
    watch: 'server/',
    env: { 'NODE_ENV': 'development' },
    done: cb
  })
}

exports.default = start
