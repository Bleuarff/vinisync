'use strict'
const db = require('./db.js').db,
      moment = require('moment'),
      bcrypt = require('bcrypt'),
      uuid = require('uuid')

const BCRYPT_SALT_ROUNDS = 10,
      COLLECTION_NAME = 'users'

// USER CONTROLLER
class UserController{
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
            now = moment.utc().toDate()

      user = {
        _id: uuid.v4(),
        email: req.params.email,
        pwd: hash,
        key: uuid.v4(),
        createDate: now,
        lastUpdateDate: now
      }

      await db.collection(COLLECTION_NAME).insertOne(user)
      user.id = user._id
      delete user.pwd
      delete user._id

      res.send(201, user)
    }
    catch(ex){
      console.error(ex)
      res.send(500)
      return next(false)
    }
  }
}

module.exports = module.exports = UserController
