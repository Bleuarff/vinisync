'use strict'
const db = require('./utils/db.js').db,
      bcrypt = require('bcrypt'),
      uuid = require('uuid'),
      { DateTime } = require('luxon'),
      logger = require('./logger.js'),
      MailSrv = require('./services/mail.js')

const BCRYPT_SALT_ROUNDS = 10,
      COLLECTION_NAME = 'users',
      PWD_RESET_REQUEST_MAX_AGE = 24 // max age in hours

// USER CONTROLLER
class UserController{
  // create new account
  static async create(req, res, next){
    if (!req.params.email || !req.params.pwd){
      res.send(400, {reason: 'MISSING_PARAMETER'})
      return next()
    }

    try{
      let user = await db.collection(COLLECTION_NAME).findOne({email: req.params.email})
      if (user){
        res.send(400, {reason: 'EMAIL_EXISTS'})
        return next()
      }

      const hash = await bcrypt.hash(req.params.pwd, BCRYPT_SALT_ROUNDS),
            now = DateTime.utc().toBSON()

      user = {
        _id: uuid.v4(),
        email: req.params.email,
        pwd: hash,
        key: uuid.v4(),
        createDate: now,
        lastUpdateDate: now
      }

      await db.collection(COLLECTION_NAME).insertOne(user)

      // prepare response object
      user.id = user._id
      delete user.pwd
      delete user._id

      res.send(201, user)
      return next()
    }
    catch(ex){
      logger.error(ex)
      res.send(500)
      return next(false)
    }
  }

  // Signin to account from a fresh device
  static async signin(req, res, next){
    if (!req.params.email || !req.params.pwd){
      res.send(400, {reason: 'MISSING_PARAMETER'})
      return next()
    }

    try{
      let user = await db.collection(COLLECTION_NAME).findOne({email: req.params.email})
      if (!user){
        res.send(401, {reason: 'INVALID_CREDENTIALS'})
        return next()
      }

      // verify password
      const pwdOk = await bcrypt.compare(req.params.pwd, user.pwd)

      if (!pwdOk){
        res.send(401, {reason: 'INVALID_CREDENTIALS'})
        return next()
      }

      // prepare response object
      user.id = user._id
      delete user.pwd
      delete user._id

      res.send(200, user)
      return next()
    }
    catch(ex){
      logger.error(ex)
      res.send(500)
      return next(false)
    }
  }

  // create a pwd reset document in mongodb
  static async createPwdReset(req, res, next){
    if (!req.params.email){
      res.send(400, {reason: 'MISSING_PARAMETER'})
      return next()
    }

    try{
      const user = await db.collection(COLLECTION_NAME).findOne({email: req.params.email})

      if (!user){
        logger.log(`Pwd retrieval: no user for email ${req.params.email}`)
        res.send(204)
        return next()
      }

      const id = uuid.v4() // use non-predictable value for id
      await db.collection('pwd_reset_requests').insertOne({
        _id: id,
        email: req.params.email,
        createDate: DateTime.utc().toBSON()
      })

      await MailSrv.send('PWD_RESET_REQUEST', req.params.email, {request_id: id})
      res.send(204)
      return next()
    }
    catch(ex){
      logger.error(ex)
      res.send(500)
      return next(false)
    }
  }

  static async getPwdReset(req, res, next){
    if (!req.params.id){
      res.send(400, {reason: 'MISSING_PARAMETER'})
      return next()
    }

    try{
      const maxAge = DateTime.utc().minus({hours: PWD_RESET_REQUEST_MAX_AGE}).toBSON()
      const reqData = await db.collection('pwd_reset_requests').findOne({
        _id: req.params.id,
        createDate: { $gte: maxAge}
      })
      if (!reqData)
        res.send(404, {reason: 'ID_NOT_FOUND'})
      else{
        res.send(200, reqData)
      }
      return next()
    }
    catch(ex){
      logger.error(ex)
      res.send(500)
      return next(false)
    }
  }

  // reset user password
  static async setPwd(req, res, next){
    if (!req.params.email || !req.params.reqid || !req.params.pwd){
      res.send(400, {reason: 'MISSING_PARAMETER'})
      return next()
    }

    try{
      // make sure reset request is still valid
      const maxAge = DateTime.utc().minus({hours: PWD_RESET_REQUEST_MAX_AGE}).toBSON()
      const reqData = await db.collection('pwd_reset_requests').findOne({
        _id: req.params.reqid,
        createDate: { $gte: maxAge}
      })

      if (!reqData){
        res.send(404, {reason: 'ID_NOT_FOUND'})
        return next()
      }

      // check provided email is the one from the reset request
      if (reqData.email !== req.params.email){
        res.send(403, {reason: 'INVALID_EMAIL'})
        return next()
      }

      // update user with new password
      const hash = await bcrypt.hash(req.params.pwd, BCRYPT_SALT_ROUNDS)
      const updateRes = await db.collection(COLLECTION_NAME).updateOne({email: reqData.email}, {
        $set: { pwd: hash }
      }, {upsert: false})

      if (updateRes.result.nModified !== 1)
        throw new Error(`Pwd reset: ${updateRes.result.nModified} docs updated`)

      res.send(204)

      // deletes the now-useless reset request document
      try{
        await db.collection('pwd_reset_requests').deleteOne({_id: req.params.reqid})
      }
      catch(ex){
        console.error(ex)
      }

      return next()
    }
    catch(ex){
      logger.error(ex)
      res.send(500)
      return next(false)
    }
  }
}

module.exports = exports = UserController
