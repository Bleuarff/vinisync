'use strict'

let client = require('mongodb').MongoClient

class DB{
  static async open(connectionString){
    try{
      client = await client.connect(connectionString, { useUnifiedTopology: true })
    }
    catch(ex){
      throw new Error(ex)
    }
  }

  static async close(){
    try{
      await client.close()
    }
    catch(ex){
      throw new Error(ex)
    }
  }

  static get db(){
    return client.db('vinisync')
  }
}

module.exports = exports = DB
