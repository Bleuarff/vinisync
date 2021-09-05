'use strict'
const db = require('./utils/db.js').db,
      { DateTime } = require('luxon'),
      logger = require('./utils/logger.js')

const PAGE_SIZE = 50

class Sync{
  static async insertUpdate(req, res, next){
    try{
      const ts = DateTime.fromISO(req.params.ts).isValid ? DateTime.fromISO(req.params.ts) : DateTime.utc(),
            uploadedDate = DateTime.fromISO(req.params.uploadedDate).isValid ? DateTime.fromISO(req.params.uploadedDate) : DateTime.utc()

      await db.collection('updates').insertOne({
        _id: req.params.id,
        userid: req.params.userid,
        changes: req.params.changes,
        type: req.params.type,
        devid: req.params.devid,
        ts: ts.toBSON(), // timestamp for when update was performed
        uploadedDate: uploadedDate.toBSON()// timestamp of when update is received
      })
      res.send(200, { uploadedDate })
      return next()
    }
    catch(ex){
      // duplicate key error: an update with this id already exists. Just ignore it,
      // it's either a re-executed resync request or a bug. Anyway, this helps achieving idempotence. I think.
      if (ex.code === 11000){
        res.send(204)
        logger.log('Duplicate %s ignored', req.params.id)
        return next()
      }

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
