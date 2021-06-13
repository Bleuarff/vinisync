'use strict'

const db = require('./db.js').db,
			{ DateTime } = require('luxon'),
			logger = require('./logger.js')

/*
Resync request sample document:
{
	_id,
	// time range for which server data was lost.
	from, // resend msgs synced after this date
	to, // and before this one.
	enabled, // boolean
	createDate
}

Processed Resync sample doc:
{
	_id,
	resyncid, // resync request id
	userid,
	devid, // device id
	success // boolean
}
*/

module.exports = exports = {
	get: async (req, res, next) => {
		try{
			let since
			if (req.params.since)
				since = DateTime.fromISO(req.params.since).toBSON()

			// get active resync requests
			let resyncRequests = await db.collection('resyncs').find({
				createDate: { $gte: since || req.user.createDate },
				enabled: {$ne: false}
			}).toArray()

			console.debug(`${resyncRequests.length} active resyncs`)

			const query = {
				resyncid: {$in: resyncRequests},
				userid: req.user.id,
				success: true
			}

			// retrieve processed resync for that user & device
			const processedRequestsIds = (await db.collection('processed_resyncs')
																						.find(query, {resyncid: 1})
																						.toArray()
																						).map(x => x.resyncid)

			console.debug(`processedRequests: ${processedRequestsIds.length}`)

			// filter out resyncs that have already been processed by this user & device
			resyncRequests = resyncRequests.filter(x => !processedRequestsIds.includes(x._id))

			res.send(200, {
				build: '__BUILD__',
				resyncs: resyncRequests,
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
