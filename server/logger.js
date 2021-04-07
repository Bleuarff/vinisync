'use strict'
 const { DateTime } = require('luxon')

function getTime(){
  return `[${DateTime.local().toFormat('yy-LL-dd HH:mm')}] `
}

module.exports = exports = {
  log: function(msg, ...args){
    if (typeof msg === 'object')
      msg = JSON.stringify(msg)
    console.log(getTime() + msg, ...args)
  },

  debug: function(msg, ...args){
    console.debug(getTime() + msg, ...args)
  },

  error: function(msg, ...args){
    console.error(getTime() + msg, ...args)
  }
}
