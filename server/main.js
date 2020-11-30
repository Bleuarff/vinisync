'use strict'

const restify = require('restify'),
      db = require('./db.js'),
      { DateTime } = require('luxon')

const dbConnectionString = 'mongodb://localhost:27017'

let server

void async function(){
  server = restify.createServer({
    name: '__HOST__',
    version: '1.0.0'
  })

  try{
    await db.open(dbConnectionString)
    console.log('db connection ok')
  }
  catch(ex){
    console.error('DB Connection error')
    console.error(ex)
    return
  }

  /************************ Configure server ***************************/
  const Sync = require('./sync.js'),
        User = require('./user.js'),
        Security = require('./security.js')

  server.use(restify.plugins.acceptParser(server.acceptable))
  server.use((req, res, next) => {
    console.log(`[${DateTime.local().toFormat('HH:mm:ss')}] ${req.method} ${req.getPath()}`)
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

  server.get('/ping', function (req, res, next) {
    res.send(200, 'pong')
    return next()
  })

  server.post('/api/update', Security.verify, Sync.insertUpdate) // TODO rename endpoint
  server.get('/api/updates', Security.verify, Sync.getUpdates)

  server.put('/api/user', User.create)
  server.post('/api/signin', User.signin)

  /************************ end routes ***************************/

  server.listen(5002, function () {
    console.log('%s listening at %s', server.name, server.url);
  });

  // properly close on relevant signals
  process.once('SIGINT', close)
  process.once('SIGTERM', close)
}()

// close server & db connection
function close(code){
  try{
    console.log('caught: ' + code)
    server.close(async () => {
      await db.close()
      console.debug('db closed')
    })
  }
  catch(ex){
    console.error(ex)
    return
  }
}