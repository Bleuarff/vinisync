'use strict'
const db = require('./db.js').db,
      bcrypt = require('bcrypt'),
      uuid = require('uuid'),
      { DateTime } = require('luxon')

const BCRYPT_SALT_ROUNDS = 10,
      COLLECTION_NAME = 'users'

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
      console.error(ex)
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
      console.error(ex)
      res.send(500)
      return next(false)
    }
  }
}

module.exports = module.exports = UserController
