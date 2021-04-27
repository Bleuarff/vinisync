'use strict'

const db = require('./db.js').db,
      { DateTime } = require('luxon'),
      logger = require('./logger.js')

/*
Sample document:

{
  _id,
  // time range for which server data was lost.
  from, // resend msgs synced after this date
  to, // and before this one.
  createDate
}
*/

module.exports = exports = {
	get: async (req, res, next) => {
		try{
      let since
      if (req.params.since)
        since = DateTime.fromISO(req.params.since).toBSON()

			const list = await db.collection('resyncs').find({
        createDate: { $gte: since || req.user.createDate },
			}).toArray()

			res.send(200, {
				build: '__BUILD__',
				resyncs: list,
				lastSync: DateTime.utc().toISO()
			})
			return next()
		}
		catch(ex){
			logger.error(ex)
			res.send(200, { build: '__BUILD__' })
			return next()
		}
	}
}
