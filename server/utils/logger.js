'use strict'
const { DateTime } = require('luxon'),
  config = require('./config.js')

function getTime(){
  return `[${DateTime.local().toFormat('yy-LL-dd HH:mm')}] `
}

function writeMessage(level, system, msg, payload){
  const cfg = config().log
  const ts = DateTime.utc()

  for (const target of cfg){
    try{

      if (target === 'stdout'){
        toStdout(level, system, ts, msg, payload)
      }
      else if (target.startsWith('http')){
        // TODO: post request logstash http plugin')
        toHttp(level, msg, payload)
      }
    }
    catch(ex){
      console.error('ERROR: logger error. ' + ex)
    }
  }
}

function toStdout(lvl, system, ts, txt, payload){
  let str = `${ts.toFormat('yy-LL-dd HH:mm')} | ${lvl.toUpperCase().padEnd(5)} | ${system} | ${txt}`

  const data = payload && Object.entries(payload).map(([k, v]) => `${k}=${v.toString()}`) // TODO: go through all object tree to serialize everything right.
  if (data && data.length)
    str += ` [${data.join(', ')}]`
  console[lvl](str)
}

function toHttp(lvl, txt, payload){
    return
}


// exports a function that must be called with system name (current system being logged).
module.exports = exports = (system) => {
  if (!system || typeof system !== 'string')
    throw new Error('Logger: invalid system name');

  return {
    log: function(msg, data){
      writeMessage('log', system, msg, data)
    },

    debug: function(msg, data){
      writeMessage('debug', system, msg, data)
    },

    warn: (msg, data) => {
      writeMessage('warn', system, msg, data)
    },

    error: function(msg, err, data){
      // writeMessage('error', err)
    }
  }

}
