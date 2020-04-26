'use strict'
const db = require('./db.js').db

class Sync{
  static createSync(req, res, next){
    // db.collection('user').findOne
    return next()
  }
}
module.exports = exports = Sync
