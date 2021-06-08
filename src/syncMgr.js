import { repo } from './storage.js'
import { send } from './fetch.js'
import Utils from './utils.js'
import { v4 as uuid} from 'uuid'
import { DateTime } from 'luxon'
import { createEventDispatcher } from 'svelte'
let dispatch

const SYNC_INTERVAL = 1, // minimum interval between 2 update checks, in minutes
      PENDING_RETRY_INTERVAL = 3600 * 1e3 // interval at which we check for pending updates to sync, in milliseconds

class SyncMgr{

  constructor(){
    this._devid = null
    this._user = null
  }

  // device id. This is immutable, so we can cache it on first retrieval
  get devid(){
    if (!this._devid)
      this._devid = localStorage.getItem('devid')
    return this._devid
  }

  get lastSync(){
    return localStorage.getItem('lastSync')
  }
  set lastSync(val){
    localStorage.setItem('lastSync', val)
  }

  // user is immutable (at least regarding properties used for sync), so it's cacheable.
  get user(){
    try{
      if (!this._user)
        this._user = JSON.parse(localStorage.getItem('user'))
      return this._user
    }
    catch(ex){
      console.error(ex)
      throw new Error('USER_ERROR')
    }
  }

  // resets cached data
  clear(){
    this._devid = null
    this._user = null
  }

  // generic method to send a diff to server
  async syncIt(obj, ref, type){
    try{
      let diff
      if (ref != null){
        diff = await Utils.getDiff(obj, ref)
        if (diff == null)
          return // no diff, nothing to sync
        diff.id = obj.id
        if (type === 'picture') // add entryId so that receiving client can tell if an update is for entry picture
          diff.entryId = obj.entryId
      }
      else{
        if (type === 'picture' && obj.blob instanceof Blob)
          obj.blob = await Utils.getBlobAsBase64(obj.blob)
        diff = obj // no reference object means new document, send all
      }

      await this._saveDiff(type, diff)
    }
    catch(ex){
      if (ex.message === 'SYNC_NOT_CONFIGURED')
        console.warn(ex.message)
      else
        throw ex
    }
  }

  // requests server for updates.
  // Returns whether any updates were downloaded
  // notifyId: (string) returns true only if there's an update for the given id or entryId
  // forced: (boolean) set to true to perform a check even if sync time interval is not elapsed.
  async checkUpdates(notifyId = null, forced = false){
    try{
      let lastSync = this.lastSync

      // sync only if forced or last sync is older than minimum time interval between syncs
      const diff = DateTime.utc().diff(DateTime.fromISO(lastSync), 'minutes').toFormat('m')

      if (!forced && diff < SYNC_INTERVAL)
        return false

      let updates = [] // updates received for this sync request
      let paginated = false
      let page = 0

      // trigger custom event for notif
      window.postMessage({event: 'loader-start'}, document.location.origin)

      // query server for updates
      do{
        const data = await send('/api/updates', 'GET', {
          lastSync: lastSync,
          userid: this.user.id,
          devid: this.devid,
          page: page++
        }, this.user.key)

        updates = [...updates, ...data.updates]
        paginated = data.count > updates.length

        // set lastSync only if no more pages (do not change the query parameter lastSync)
        if (!paginated)
          lastSync = data.lastSync
      }
      while(paginated)

      // merge updates. changes are ordered by timestamp the modification happened on other device.
      // clock drift, etc are ignored. distributed computing is easy!
      await updates.reduce(async (prom, update) => {
        await prom

        // check if not already received - if so, ignore the update
        const exists =!!(await repo.findById('updates', update._id))
        if (exists)
          return Promise.resolve()

        switch(update.type){
          case 'entry':
            await this._mergeEntry(update)
            break
          case 'picture':
            await this._mergePicture(update)
            break
          case 'locations':
            localStorage.setItem('locations', JSON.stringify(update.changes))
            break
          default:
            console.error(`"${update.type}" type of update is not supported`)
        }

        // save update document
        update.id = update._id
        delete update._id
        await repo.insertOne('updates', update)
      }, Promise.resolve())

      // save last sync date after confirmation everything is saved
      this.lastSync = lastSync

      // if notif id set: return whether the given id was in the list of updates.
      // otherwise return whether there were some updates
      let hasUpdates
      if (typeof notifyId === 'string')
        hasUpdates = updates.some(x => x.changes && (x.changes.id === notifyId || x.changes.entryId ===  notifyId))
      else
        hasUpdates = updates.length > 0

      return hasUpdates
    }
    catch(ex){
      if (ex.message === 'SYNC_NOT_CONFIGURED')
        console.warn(ex.message)
      else
        throw ex
    }
    finally{
      window.postMessage({event: 'loader-end'}, document.location.origin)
    }
  }

  async _mergeEntry(update){
    const remoteEntry = update.changes
    let localEntry = await repo.findById('entries', remoteEntry.id),
        diff // object saved in history

    if (localEntry){
      // compare local entry updateDate and timestamp the update was made at
      if (localEntry.lastUpdateDate > update.ts){
        console.log('Houston we have a conflict')

        // store in db
        dispatch = dispatch || createEventDispatcher()
        try{
          const conflict = {...update}
          conflict.id = conflict._id
          delete conflict._id
          await repo.insertOne('conflicts', conflict)
          dispatch('notif', {text: 'Conflit de synchro', err: true})
          // TODO: trigger menu item in title bar
        }
        catch(ex){
          console.error(ex)
          dispatch('notif', {text: 'Conflit non conservé', err: true, confirm: true})
        }
        return
      }

      // update is later than last local update, we can apply the change
      localEntry = this._deepAssign(localEntry, remoteEntry)
      await repo.updateDoc('entries', localEntry, true)
      diff = remoteEntry
    }
    else{
      // entry id is unknown on this device, just create it
      await repo.insertOne('entries', remoteEntry)
      console.debug(`entry created from update ${update._id}`)

      diff = {count: remoteEntry.count, wine: {}}
      if (remoteEntry.wine.name) diff.wine.name = remoteEntry.wine.name
      if (remoteEntry.wine.producer) diff.wine.producer = remoteEntry.wine.producer
      if (remoteEntry.wine.year) diff.wine.year = remoteEntry.wine.year
    }
  }

  async _mergePicture(update){
    const remotePicture = update.changes
    let localPicture = await repo.findById('images', remotePicture.id)

    if (localPicture){
      // local edited after remote, conflict !!
      if (localPicture.lastUpdateDate > update.ts){
        console.log('picture conflict')
        return
      }
      console.debug(`Update picture ${remotePicture.id} at ${update.ts}`)
      if (remotePicture.blob)
        remotePicture.blob = await Utils.getBlobFromBase64(remotePicture.blob)
      localPicture = this._deepAssign(localPicture, remotePicture)
      await repo.updateDoc('images', localPicture, true)
    }
    else{ // unknown picture
      // convert base64 string to blob
      remotePicture.blob = await Utils.getBlobFromBase64(remotePicture.blob)
      await repo.insertOne('images', remotePicture)
      console.debug(`picture created from update ${update._id}`)
    }
  }

  // like Object.assign but recursive
  _deepAssign(target, changes){
    Object.entries(changes).forEach(([key, value]) => {
      if (value instanceof Blob)
        target[key] = value
      else if (Array.isArray(value))
        target[key] = value // overwrite array with entire new array
      else if (typeof value === 'object')
        target[key] = this._deepAssign(target[key], value)
      else
        target[key] = value
    })
    return target
  }

  // returns nothing (empty promise) if server db update goes well
  // Saves an update, both locally & send to server
  async _saveDiff(type, diff){
    const payload = {
      id: uuid(),
      changes: diff,
      ts: diff.lastUpdateDate,
      userid: this.user.id,
      type: type,
      devid: this.devid,
      pending: 'true' // indexedDB index does not support boolean keys
    }

    // save locally
    try{
      await repo.insertOne('updates', payload)
    }
    catch(ex){
      console.error(ex)
      dispatch('notif', {text: 'LOCAL_SAVE_ERROR', err: true})
      // TODO: exception should be logged on server
    }

    // send update to server
    try{
      delete payload.pending // prop not needed on server
      await send('/api/update', 'POST', payload, this.user.key)

      // update local copy once its accepted by server.
      // If that fails, it is resent to server, which will ignore it based on id.
      await repo.updateOne('updates', payload.id, {pending: undefined})
    }
    catch(ex){
      console.error(ex)
      dispatch('notif', {text: 'UPDATE_SEND_ERROR', err: true})
      // TODO: log on server
    }
  }

  async pendingMonitor(){
    await repo.open()
    this._sendPending()
    setInterval(() => {this._sendPending()}, PENDING_RETRY_INTERVAL) // try every hour
  }

  // checks if there are pending updates, and send them
  async _sendPending(){

    try{
      const pendingCount = await repo.countFromIndex('updates', 'pending', 'true')
      console.debug(`${pendingCount} pending updates`)
      if (!pendingCount)
        return console.log('No pending updates')

      const updates = await repo.getAllFromIndex('updates', 'pending', 'true')

      if (updates.length === 0)
        return console.log('no pending updates') // nothing to send

      // process each upate, synchronously
      await updates.reduce(async (prom, update) => {
        await prom
        try{
          await send('/api/update', 'POST', update, this.user.key)
          await repo.updateOne('updates', update.id, {pending: 'false'})
          return Promise.resolve()
        }
        catch(ex){
          // one failure does not impact the other udpates
          return Promise.resolve()
        }
      }, Promise.resolve())
    }
    catch(ex){
      console.error(ex)
      throw ex
    }
  }

  // given a list of resync requests, re-sends all impacted updates.
  async processResyncs(list){
    console.debug('TODO: resends')
    // for each request:
    // - take all updates (how?) made between request's from & to properties.
    // - send these updates again & resync request id. Should be saved pending on failure.
    //    (+ smth to distinguish them from normal updates if they appear in pending list)
    // - update the lastResyncDate value from local storage: set with request.to
  }
}

export default new SyncMgr()
