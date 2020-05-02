'use strict'
const db = require('./db.js').db,
      moment = require('moment')

const PAGE_SIZE = 50

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

  static async insertUpdate(req, res, next){
    try{
      // TODO: validate params
      await db.collection('updates').insertOne({
        _id: req.params.id,
        userkey: req.params.userkey,
        changes: req.params.changes,
        type: req.params.type,
        devid: req.params.devid,
        ts: moment(req.params.ts).toDate(), // timestamp for when update was performed
        uploadedDate: moment.utc().toDate()// timestamp of when update is received
      })
      res.send(204)
      return next()
    }
    catch(ex){
      console.error(ex)
      res.send(500)
      return next(false)
    }
  }

  // get all updates for user since given last sync date
  static async getUpdates(req, res, next){
    try{
      // TODO: handle pagination. use provided ids to exclude docs
      const query = {
        userkey: req.params.userkey,
        devid: {$ne: req.params.devid}, // ignore updates made by the requesting node itself
        uploadedDate : {$gt: moment(req.params.lastSync).toDate()}
      }
      const count = await db.collection('updates').countDocuments(query)
      const lastSync = moment().utc().toDate()
      const docs = await db.collection('updates').find(query, {userkey: 0}).sort({ts: 1}).limit(PAGE_SIZE).toArray()
      res.send(200, {
        count: count,
        updates: docs,
        lastSync: lastSync
      })
      return next()
    }
    catch(ex){
      console.error(ex)
      res.send(500)
      return next(false)
    }
  }

  // request pre-handler: checks a user (email + userkey) exists already
  static async checkCredentials(req, res, next){
    const user = await db.collection('users').findOne({email: req.params.email, userkey: req.params.userkey})
    if (!user){
      res.send(403, {reason: 'INVALID_CREDENTIALS'})
      return next(false)
    }
    return next()
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
