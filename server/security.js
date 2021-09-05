'use strict'

const { DateTime } = require('luxon'),
      db = require('./utils/db.js').db,
      { createHmac } = require('crypto'),
      logger = require('./logger.js')

const MAX_DATE_OFFSET = 15 * 60 // Max offset between request date and server time, in seconds

class Security{
  // checks date & auth are valid:
  // date must be around server time
  // compute signature and check its the same as auth
  static async verify(req, res, next){
    // check the date header is ok (within 15min of server time)
    const date = req.header('X-Date')

    if (!date){
      res.send(400, {reason: 'INVALID_DATE_HEADER'})
      return next(false)
    }
    const ts = DateTime.fromISO(date),
          offset = ts.diffNow().as('seconds')

    // logger.debug(`${date}\t${offset}`)
    if (Math.abs(offset) > MAX_DATE_OFFSET){
      res.send(400, {reason: 'invalid INVALID_DATE_HEADER header'})
      return next(false)
    }

    // check there is a auth header
    const signature = req.header('Authorization')

    if (!signature){ // TODO: add check for signature length
      res.send(401, {reason: 'INVALID_AUTH_HEADER'})
      return next(false)
    }

    // check there is a userid in params
    if (!req.params.userid){
      res.send(401, {reason: 'MISSING_USER_ID'})
      return next(false)
    }

    try{
      // find user in db, check it exists and has a key
      const user = await db.collection('users').findOne({_id: req.params.userid})
      if (!user || !user.key){
        res.send(401, {reason: 'INVALID_USER_ID'})
        return next(false)
      }

      const input = [req.method, req.getPath(), date, req._body || req.body, req.getQuery()].join('\n')
      // console.debug(`req from user ${user._id} key: ${user.key}`)
      // logger.debug(input)
      const hmac = createHmac('sha384', user.key)
      hmac.update(input)
      const computedSignature = hmac.digest('base64')
      // logger.debug(`sign: ${computedSignature}`)

      req.user = {...user} // save user in req, to avoid controllers retrieving it again
      req.user.id = req.user._id
      delete req.user._id
      // no need to keep & move around auth details
      delete req.user.pwd
      delete req.user.key

      if (computedSignature === signature)
        return next()
      else{
        res.send(403, {reason: 'INCORRECT_AUTHENTICATION'})
        return next(false)
      }
    }
    catch(ex){
      logger.error(ex)
      res.send(500, {reason: 'SIGNATURE_VERIFICATION_ERROR'})
      return next(false)
    }
  }
}

module.exports = exports = Security
