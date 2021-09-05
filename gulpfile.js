'use strict'

const { series, parallel, src, dest, watch } = require('gulp'),
      nodemon = require('gulp-nodemon'),
      replace = require('gulp-replace'),
      argv = require('yargs').argv,
      { exec, spawn } = require('child_process'),
      zip = require('gulp-zip'),
      {DateTime} = require('luxon'),
      { execSync } = require('child_process'),
      {createHash} = require('crypto'),
      fs = require('fs'),
      merge = require('merge2'),
      rename = require('gulp-rename')

const env = argv.e || argv.env || 'dev' // environment to build.
const buildTime = DateTime.local().toFormat('yyyyMMddHHmm'),
      buildNumber = getBuildNumber(),
      archiveName = `vinisync_${env}_${buildTime}.zip`

// Config settings grouped by env.
// Mongo credentials are in environment variables.
const config = {
	dev: {
		host: 'dev.vinisync.fr',
    connectionString: 'mongodb://localhost:27017',
    title: 'Vinisync [DEV]'
	},
  stg: {
		host: 'stg.vinisync.fr',
    connectionString: `mongodb://${process.env['MONGO_CREDS_STG']}@localhost:27017/vinisync`,
    title: 'Vinisync [STG]'
	},
	prod: {
		host: 'vinisync.fr',
    connectionString: `mongodb://${process.env['MONGO_CREDS_PRD']}@localhost:29817/vinisync`,
    title: 'Vinisync'
	}
}

if (!config[env]){
  console.error(`Invalid env '${env}'`)
  return
}

const replacements = {
	__HOST__: config[env].host,
  __DBCONNEXIONSTRING__: config[env].connectionString,
  __TITLE__: config[env].title,
  __CACHE_VERSION__: buildTime, // updated each time the sw is rebuilt
  __BUILD__: buildNumber
}

function makeServer(){
  return replaceAll(src('server/**/*.js'))
          .pipe(dest('dist/server/'))
}

function makeConfig(){
  return src(`config/config.${env}.yml`)
    .pipe(rename('config/config.yml'))
    .pipe(dest('dist/server/'))
}

function makeIndex(){
  return replaceAll(src('src/public/index.html'))
    .pipe(dest('dist/public/'))
}

// build service worker file
function makeSW(){
  replacements.__CACHE_VERSION__ = DateTime.local().toFormat('yyyyMMddHHmm')

  return replaceAll(src('src/public/sw.js'))
    .pipe(dest('dist/public/'))
}

function makeClient(){
  const args = ['-c']
  if (env === 'dev')
    args.push('-w')
  return spawn('rollup', args, {
    stdio: 'inherit',
    env: Object.assign({
      VINISYNC_BUILD_ENV: env,
      VINISYNC_BUILD_NUMBER: buildNumber
    }, process.env)
  })
}

function startNodemon(cb){
  nodemon({
    script: 'dist/server/main.js',
    watch: 'dist/server/',
    env: { 'NODE_ENV': 'development' },
    done: cb
  })
}

function archive(){
  return src(['dist/**', 'package.json'])
    .pipe(zip(archiveName))
    .pipe(dest('releases/'))
}

function replaceAll(stream){
  Object.entries(replacements).forEach(([key, val]) => {
    let output = typeof val === 'object' ? JSON.stringify(val) : val.toString()
    stream = stream.pipe(replace(key, output))
  })
  return stream
}

function watchers(){
  watch(['server/**'], cb => {
    makeServer()
    cb()
  })
  watch(['config/config.dev.yml'], cb => {
    makeConfig()
    cb()
  })
  watch(['src/index.html'], cb => {
    makeIndex()
    cb()
  })
  watch(['src/public/sw.js'], cb => {
    makeSW()
    cb()
  })
}

function getBuildNumber(){
	let build = execSync('git rev-parse --short=7 HEAD').toString().substring(0, 7) // get short commit id, minus newline
	const status = execSync('git status --porcelain -z').toString().split('\u0000')
									.filter(x => !x.startsWith('??') && !x.startsWith('D ')) // ignore untracked files

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

const make = exports.make = parallel(makeServer, makeConfig, makeIndex, makeSW)
exports.default = series(
  make,
  parallel(
    startNodemon,
    watchers,
    makeClient
  )
)
exports.build = series(
  // make files (server & client), then archive the lot
  parallel(make, makeClient),
  archive
)

exports.client = makeClient
