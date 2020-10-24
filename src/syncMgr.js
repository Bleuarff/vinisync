import { repo } from './storage.js'
import { send } from './fetch.js'
import Utils from './utils.js'
import { v4 as uuid} from 'uuid'
import moment from 'moment'
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

      await this._sendDiff(type, diff)

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
      if (!forced && moment().utc().diff(moment(lastSync), 'minute') < SYNC_INTERVAL)
        return false

      let updates = [] // updates received for this sync request
      let paginated = false

      // query server for updates
      do{
        const data = await send('/api/updates', 'GET', {
          lastSync: lastSync,
          ids: updates.map(x => x.id),
          userid: this.user.id,
          devid: this.devid
        }, this.user.key)

        updates = [...updates, ...data.updates]
        paginated = data.total > updates.length
        lastSync = data.lastSync // update lastSync for next iteration: pagination
      }
      while(paginated)

      // merge updates. changes are ordered by timestamp the modification happened on other device.
      // clock drift, etc are ignored. distributed computing is easy!
      await updates.reduce(async (prom, update) => {
        await prom
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
    Utils.updateHistory(diff, remoteEntry.id, remoteEntry.lastUpdateDate)
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
  async _sendDiff(type, diff){
    const payload = {
      id: uuid(),
      changes: diff,
      ts: diff.lastUpdateDate,
      userid: this.user.id,
      type: type,
      devid: this.devid
    }

    try{ // send update to server
      await send('/api/update', 'POST', payload, this.user.key)
    }
    catch(ex){ // on failure, save to db
      try{
        await repo.insertOne('updates', payload)
      }
      catch(innerex){ // ...all hell broke loose
        console.error(innerex)
        throw new Error('UPDATE_SERVER_AND_LOCAL_FAILED')
      }
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
      const updates = await repo.getAll('updates')
      if (updates.length === 0) return // nothing to send

      // process each upate, synchronously
      await updates.reduce(async (prom, update) => {
        await prom
        try{
          await send('/api/update', 'POST', update, this.user.key)
          await repo.deleteOne('updates', update.id)
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
}

export default new SyncMgr()
