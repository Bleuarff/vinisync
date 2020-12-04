'use strict'
 const { DateTime } = require('luxon')

function getTime(){
  return `[${DateTime.local().toFormat('dd/LL/yy HH:mm')}] `
}

module.exports = exports = {
  log: function(msg, ...args){
    console.log(getTime() + msg, ...args)
  },

  debug: function(msg, ...args){
    console.debug(getTime() + msg, ...args)
  },

  error: function(msg, ...args){
    console.error(getTime() + msg, ...args)
  }
}
