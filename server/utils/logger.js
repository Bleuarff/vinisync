'use strict'
const { DateTime } = require('luxon'),
  config = require('./config.js'),
  http = require('http'),
  https = require('https')

function getTime(){
  return `[${DateTime.local().toFormat('yy-LL-dd HH:mm')}] `
}

// level: message level debug/log/warn/error
// system: module where message comes from
// msg: message text
// payload: key/value pairs, additional data to log
// error: Error or VError object
function writeMessage(level, system, msg, payload, error){
  const cfg = config().log
  const ts = DateTime.utc()

  for (const target of cfg){
    try{

      if (target === 'stdout'){
        toStdout(level, system, ts, msg, payload, error)
      }
      else if (target.startsWith('http')){
        toHttp(target, level, system, ts, msg, payload, error)
      }
    }
    catch(ex){
      console.error('ERROR: logger error. ' + ex)
    }
  }
}

function toStdout(lvl, system, ts, txt, payload, error){
  let str = `${ts.toFormat('yy-LL-dd HH:mm')} | ${lvl.toUpperCase().padEnd(5)} | ${system} | ${txt || error?.message}`

  const data = payload && Object.entries(payload).map(([k, v]) => `${k}=${v.toString()}`) // TODO: go through all object tree to serialize everything right.
  if (data && data.length)
    str += ` [${data.join(', ')}]`

  if (lvl === 'error' && error){
    str += ` | ${error.stack}`
  }

  console[lvl](str)
}

function toHttp(url, lvl, system, ts, txt, payload, error){
    const requestModule = url.startsWith('https') ? https: http;

    const data = {
      ...payload,
      lvl,
      module: system,
      env: '__ENV__',
      ts: ts.toISO(),
      msg: txt || error?.message,
      orig: 'srv'
    }

    if (error){
      data.error_stack = error.stack
    }

    const postData = JSON.stringify(data)

    try{
      const req = requestModule.request(url, {
        method: 'POST',
        auth: process.env.DACO_AUTH,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'X-Daco': '__DACO_AUTH__'
        },
        timeout: 10 * 1e3 // in ms
      }, (res) => {
        res.on('data', () => { /* mandatory callback for event 'end' to be sent */ })
        res.on('end', () => {
          // log to console if unexpected status code
          if (![200, 201, 204].includes(res.statusCode))
            toStdout(lvl, system, ts, 'Invalid daco response code.', {code: res.statusCode}, error)

        })
      })

      req.on('error', e => {
        console.error(`ERROR | Logger | ${e.message}`)
      })
      req.write(postData)
      req.end()
    }
    catch(ex){
      console.error(ex)
    }

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

    // err & data args are optional an interchangable.
    error: function(msg, arg1 = null, arg2 = null){
      let err = null, data = null

      if (arg1 && arg1 instanceof Error)
        err = arg1
      else if (arg1)
        data = arg1

      if (arg2 && arg2 instanceof Error)
        err = arg2
      else if (arg2)
        data = arg2

      writeMessage('error', system, msg, data, err)
    }
  }

}
