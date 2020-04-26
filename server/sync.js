'use strict'
const db = require('./db.js').db,
      moment = require('moment')

class Sync{
  // activate sync for requesting device
  static async enableSync(req, res, next){
    if (!req.params.email || !req.params.userkey){
      res.send(400, {reason: 'MISSING_PARAMETER'})
      return next()
    }

    try{
      const user = await db.collection('users').findOne({email: req.params.email})

      if (user){
        if (user.userkey === req.params.userkey)
          res.send(200, {enabled: true})
        else
          res.send(403, {reason: 'UNKNOWN_USERKEY_FOR_EMAIL'})
      }
      else if (Sync.verifyChecksum(req.params.userkey)){
        await db.collection('users').insertOne({
          userkey: req.params.userkey,
          email: req.params.email,
          createDate: moment.utc().toDate()
        })
        res.send(201, {created: true})
      }
      else{
        res.send(400, {reason: 'INVALID_USERKEY'})
      }
      return next()
    }
    catch(ex){
      console.error(ex)
      res.send(500)
      return next(false)
    }
  }

  // returns whether the key is valid, i.e. the checksum is valid
  static verifyChecksum(key){
    const base = key.substring(0, 8),
          checksum = key.substring(8, 10)

    const computedChecksum = Sync.computeChecksum(base)
    return checksum === computedChecksum
  }

  static computeChecksum(key){
    let sum = 0
    for (let i = 0; i < 8; i+=2){
      const val = parseInt(key.substring(i, i+2), 16)
      sum += val
    }
    const remainder = sum % 256
    const checksum = remainder.toString(16).toUpperCase().padStart(2, 0)
    return checksum
  }
}
module.exports = exports = Sync
