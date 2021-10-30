'use strict'
const { DateTime } = require('luxon'),
  config = require('./config.js')

function getTime(){
  return `[${DateTime.local().toFormat('yy-LL-dd HH:mm')}] `
}

function writeMessage(level, msg, payload){
  const cfg = config().log
  const ts = DateTime.utc()

  for (const target of cfg){
    try{

      if (target === 'stdout'){
        toStdout(level, ts, msg, payload)
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

function toStdout(lvl, ts, txt, payload){
  let str = `[${ts.toFormat('yy-LL-dd HH:mm')}] ${txt}`

  const data = payload && Object.entries(payload).map(([k, v]) => `${k}=${v.toString()}`) // TODO: go through all object tree to serialize everything right.
  if (data && data.length)
    str += ` [${data.join(', ')}]`
  console[lvl](str)

}

function toHttp(lvl, txt, payload){
    return
}


module.exports = exports = {
  log: function(msg, data){
    writeMessage('log', msg, data)
  },

  debug: function(msg, data){
    writeMessage('debug', msg, data)
  },

  warn: (msg, data) => {
    writeMessage('warn', msg, data)
  },

  error: function(msg, err, data){
    // writeMessage('error', err)
  }
}
