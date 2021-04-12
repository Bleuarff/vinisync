'use strict'

// service worker

const cacheName = '__CACHE_VERSION__'
const assets = [
  '/',
  '/vinisync.webmanifest',
  '/build/bundle.js',
  '/build/bundle.css',
  '/global.css',
  '/fonts/vinisync.css',

  '/fonts/vinisync.woff2',
  '/img/addentry.svg',
  '/favicon.png'
]

// cache assets
self.addEventListener('install', event => {
  console.log(`[service Worker] Install ${cacheName}...`)
  event.waitUntil(new Promise(async (resolve, reject) => {
    console.log('[Service Worker] Caching assets')
    try{
      const cache = await caches.open(cacheName)
      await cache.addAll(assets)
      resolve()
    }
    catch(ex){
      console.error(ex)
      reject()
    }
  }))
})

self.addEventListener('fetch', e => {
  // api requests are not cached
  if (e.request.url.includes('/api/'))
    return

  // console.log('[Service Worker] Request for ' + e.request.url)

  e.respondWith(new Promise(async (resolve, reject) => {
    const cachedResponse = await caches.match(e.request, {ignoreSearch: true})
    if (cachedResponse !== undefined){
      // console.debug('asset found in cache')
      return resolve(cachedResponse)
    }

    let response = null
    try{
      response = await fetch(e.request)
      const cache = await caches.open(cacheName)
      await cache.add(e.request)
      console.debug(`[Service Worker] Added ${e.request.url} to cache`)
    }
    catch(ex){
      console.log(`Fetch error for ${e.request.url}`)
    }
    resolve(response)
  }))
})

// activation: delete old caches
self.addEventListener('activate', e => {
  console.log('[Service Worker] Activation...')
  e.waitUntil(new Promise(async (resolve, reject) => {
    try{
      const keys = (await caches.keys()).filter( key => key !== cacheName)
      await Promise.all(keys.map(key => {
        return caches.delete(key)
      }))
      console.log('[Service Worker] Old caches deleted')
      resolve()
    }
    catch(ex){
      console.error(ex)
      reject()
    }
  }))
})

// Client / service postmessage communication
self.addEventListener('message', async (e) => {
  try{
    if (e.data?.type === 'GET_VERSION') {
      const client = await self.clients.get(e.source?.id)
      client?.postMessage({type: 'VERSION', version: cacheName})
    }
  }
  catch(ex){
    console.error(ex)
  }
})
