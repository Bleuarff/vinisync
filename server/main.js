'use strict'

const restify = require('restify'),
      db = require('./utils/db.js'),
      { DateTime } = require('luxon'),
      logger = require('./utils/logger.js')('main')

const dbConnectionString = '__DBCONNEXIONSTRING__'

let server

void async function(){
  server = restify.createServer({
    name: '__HOST__',
    version: '1.0.0'
  })

  try{
    await db.open(dbConnectionString)
    logger.log('db connection ok')
  }
  catch(ex){
    logger.error('DB Connection error', ex)
    return
  }

  /************************ Configure server ***************************/
  const Sync = require('./sync.js'),
        User = require('./user.js'),
        Security = require('./security.js'),
        Resync = require('./resync.js')

  server.use(restify.plugins.acceptParser(server.acceptable))
  server.use((req, res, next) => {
    logger.log(`${req.method} ${req.getPath()}`)
    return next()
  })

  server.use(restify.plugins.queryParser({mapParams: true}))
  server.use(restify.plugins.bodyParser({mapParams: true}))

  server.use((req, res, next) => {
    res.charSet('utf-8')
    res.set({
      'Access-Control-Allow-Origin': req.headers.origin, // '*' forbidden when credentials are included
      'Access-Control-Allow-Credentials': true,
      'Access-Control-Expose-Headers': 'Content-Length', // so it can be retrieved when querying from a CORS request
      'Cache-Control': 'no-cache, no-store, must-revalidate' // responses are not cacheable
    })
    return next()
  })

  /************************ Register routes ***************************/

  server.opts('/api/:whatever', (req, res, next) => {
    res.set({
      'Access-Control-Allow-Methods': 'GET, HEAD, POST, PUT, DELETE',
      'Access-Control-Allow-Headers': 'Date, X-Date, Authorization, Content-Type, X-Auth'
    })
    res.send(200)
    return next()
  })

  server.get('/api/ping', function (req, res, next) {
    res.send(200, 'pong')
    return next()
  })

  server.post('/api/update', Security.verify, Sync.insertUpdate) // TODO rename endpoint
  server.get('/api/updates', Security.verify, Sync.getUpdates)

  server.put('/api/user', User.create)
  server.post('/api/signin', User.signin)
  server.post('/api/user/pwd', User.setPwd)

  server.post('/api/pwdreset', User.createPwdReset)
  server.get('/api/pwdreset/:id', User.getPwdReset)

  server.get('/api/init', Security.verify, Resync.get)
  server.post('/api/resync/:id/confirm', Security.verify, Resync.confirm)

  // deprecated
  server.get('/api/clientVersion', (req, res, next) => {
    res.send(200, '__BUILD__')
    return next()
  })

  /************************ end routes ***************************/

  server.listen(5002, function () {
    logger.log('Server listening', {name: server.name, url: server.url});
  });

  // properly close on relevant signals
  process.once('SIGINT', close)
  process.once('SIGTERM', close)
}()

// close server & db connection
function close(code){
  try{
    server.close(async () => {
      await db.close()
      logger.debug('db closed', {code})
    })
  }
  catch(ex){
    logger.error('db close error', ex, {code})
    return
  }
}
