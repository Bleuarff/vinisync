'use strict'
const db = require('./db.js').db,
      { DateTime } = require('luxon'),
      logger = require('./logger.js')

const PAGE_SIZE = 50

class Sync{
  static async insertUpdate(req, res, next){
    try{
      // TODO: validate params
      const ts = req.params.ts ? DateTime.fromISO(req.params.ts) : DateTime.utc()
      await db.collection('updates').insertOne({
        _id: req.params.id,
        userid: req.params.userid,
        changes: req.params.changes,
        type: req.params.type,
        devid: req.params.devid,
        ts: ts.toBSON(), // timestamp for when update was performed
        uploadedDate: DateTime.utc().toBSON()// timestamp of when update is received
      })
      res.send(204)
      return next()
    }
    catch(ex){
      logger.error(ex)
      res.send(500)
      return next(false)
    }
  }

  // get all updates for user since given last sync date
  static async getUpdates(req, res, next){
    try{
      // TODO: handle pagination. use provided ids to exclude docs
      const query = {
        userid: req.params.userid,
        devid: {$ne: req.params.devid}, // ignore updates made by the requesting node itself
        uploadedDate: {$gt: DateTime.fromISO(req.params.lastSync).toBSON()}
      }
      const count = await db.collection('updates').countDocuments(query)
      const page = parseInt(req.params.page, 10) || 0
      const lastSync = DateTime.utc()
      const docs = await db.collection('updates').find(query).sort({ts: 1}).skip(page * PAGE_SIZE).limit(PAGE_SIZE).toArray()
      res.send(200, {
        count: count,
        updates: docs,
        lastSync: lastSync.toISO()
      })
      return next()
    }
    catch(ex){
      logger.error(ex)
      res.send(500)
      return next(false)
    }
  }
}
module.exports = exports = Sync
