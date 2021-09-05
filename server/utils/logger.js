'use strict'
const { DateTime } = require('luxon'),
  config = require('./config.js')

function getTime(){
  return `[${DateTime.local().toFormat('yy-LL-dd HH:mm')}] `
}

function writeMessage(level, msg){
  const ts = DateTime.utc()
  const cfg = config().log
  for (const target of cfg){
    if (target === 'console'){
      let txt
      if (typeof msg === 'object')
        txt = JSON.stringify(msg)

      console[level](`[${ts.toFormat('yy-LL-dd HH:mm')}] ${txt || msg}`)
    }
    else if (target.startsWith('http')){
      // TODO: post request logstash http plugin')
    }
  }
}

module.exports = exports = {
  log: function(msg){
    writeMessage('log', msg)
  },

  debug: function(msg){
    writeMessage('debug', msg)
  },

  error: function(err){
    writeMessage('error', err)
  }
}
