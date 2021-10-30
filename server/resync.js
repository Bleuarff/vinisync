'use strict'

const db = require('./utils/db.js').db,
			{ DateTime } = require('luxon'),
			logger = require('./utils/logger.js')('resync')

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
			}, { projection: { from: 1, to: 1 } }).toArray()

			// console.debug(`${resyncRequests.length} active resyncs`)

			const query = {
				resyncid: {$in: resyncRequests.map(x => x._id.toString())},
				userid: req.user.id,
				devid: req.params.devid,
				success: true
			}

			// console.debug(query)

			// retrieve processed resync for that user & device
			const processedRequestsIds = (await db.collection('processed_resyncs')
			                                      .find(query, {projection: { resyncid: 1 }})
			                                      .toArray()
			                             ).map(x => x.resyncid)

			// console.debug(`processedRequests: ${processedRequestsIds.join(', ')}`)

			// filter out resyncs that have already been processed by this user & device
			resyncRequests = resyncRequests.filter(x => !processedRequestsIds.includes(x._id.toString()))

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
	},

	// creates or updates a resync confirmation document
	confirm: async (req, res, next) => {
		if (!req.params.id || !req.params.userid || !req.params.devid){
			res.send(400)
			return next()
		}

		try{
			// look for an existing confirmation for resync/user/device tuple
			const existingDoc = await db.collection('processed_resyncs').findOne({
				resyncid: req.params.id,
				userid: req.user.id,
				devid: req.params.devid
			})

			// confirmation exists: update status if needed
			if (existingDoc && !existingDoc.success){
				await db.collection('processed_resyncs').findOneAndUpdate({_id: existingDoc._id}, {
					success: true,
					lastUpdateDate: DateTime.utc().toBSON()
				})
			}
			else if (!existingDoc){
				// otherwise create document
				await db.collection('processed_resyncs').insertOne({
					resyncid: req.params.id,
					userid: req.user.id,
					devid: req.params.devid,
					success: true,
					lastUpdateDate: DateTime.utc().toBSON()
				})
			}

			res.send(204)
			return next()
		}
		catch(ex){
			console.error(ex)
			res.send(500, 'RESYNC_CONFIRM_ERROR')
			return next(false)
		}
	}
}
