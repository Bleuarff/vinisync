import { repo } from './storage.js'
import { send } from './fetch.js'
import Utils from './utils.js'
import { v4 as uuid} from 'uuid'
import moment from 'moment'

const SYNC_INTERVAL = 1, // minimum interval between 2 update checks, in minutes
      PENDING_RETRY_INTERVAL = 3600 * 1000 // interval at which we check for pending updates to sync, in milliseconds

class SyncMgr{
  constructor(){}

  // initiate sync: send all existing local data
  // TODO: how to show progress to sync page?
  async start(){
    try{
      const config = await this._getConfig()

      // get all entries, send each one to server. On failure, save to dedicated table in db
      const entries = await repo.getAll('entries')
      await entries.reduce(async (prom, entry) => {
        await prom
        return this._sendDiff('entry', entry, config)
      }, Promise.resolve())

      const images = await repo.getAll('images')
      await images.reduce(async (prom, img) => {
        await prom
        img.blob = await new Promise(resolve => {
          const fr = new FileReader()
          fr.addEventListener('load', e => {
            resolve(fr.result.split(',')[1])
          }, false)
          fr.readAsDataURL(img.blob)
        })
        return this._sendDiff('picture', img, config)
      }, Promise.resolve())

    }
    catch(ex){
      if (ex.message === 'SYNC_NOT_CONFIGURED')
        console.warn(ex.message)
      else
        throw ex
    }
  }

  // generic method to send a diff to server
  async syncIt(obj, ref, type, table){
    try{
      const config = await this._getConfig()
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

      await this._sendDiff(type, diff, config)

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
      // get sync info
      const config = await this._getConfig()

      // sync only if forced or last sync is older than minimum time interval between syncs
      if (!forced && moment().utc().diff(moment(config.lastSync), 'minute') < SYNC_INTERVAL)
        return false

      let updates = [] // updates received for this sync request
      let paginated = false

      // query server for updates
      do{
        const data = await send('/api/updates', 'GET', {
          lastSync: config.lastSync,
          ids: updates.map(x => x.id),
          email: config.email,
          userkey: config.userkey,
          devid: config.devid
        })

        updates = [...updates, ...data.updates]
        paginated = data.total > updates.length
        config.lastSync = data.lastSync // update lastSync for next iteration: pagination
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
          default:
            console.error(`"${update.type}" type of update is not supported`)
        }
      }, Promise.resolve())

      await repo.updateDoc('config', config) // save config w/ last sync date after confirmation everything is saved

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

  // helper to retrieve config from db
  async _getConfig(){
    const config = await repo.getOne('config', 'sync')
    if (!config)
      throw new Error('SYNC_NOT_CONFIGURED')
    if (!config.enabled)
      throw new Error('SYNC_DISABLED')
    return config
  }

  async _mergeEntry(update){
    const remoteEntry = update.changes
    let localEntry = await repo.getOne('entries', remoteEntry.id)

    if (localEntry){
      // compare local entry updateDate and timestamp the update was made at
      if (localEntry.lastUpdateDate > update.ts){
        // TODO: store in db. Show cta in UI. UI to resolve conflicts.
        console.log('Houston we have a conflict')
        return
      }

      // update is later than last local update, we can apply the change
      localEntry = this._deepAssign(localEntry, remoteEntry)
      await repo.updateDoc('entries', localEntry, true)
    }
    else{
      // entry id is unknown on this device, just create it
      await repo.insertOne('entries', remoteEntry)
      console.debug(`entry created from update ${update._id}`)
    }
  }

  async _mergePicture(update){
    const remotePicture = update.changes
    let localPicture = await repo.getOne('images', remotePicture.id)

    if (localPicture){
      // local edited after remote, conflict !!
      if (localPicture.lastUpdateDate > update.ts){
        console.log('picture conflict')
        return
      }
      console.debug(`Update picture ${remotePicture.id} at ${update.ts}`)
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
      if (typeof value === 'object')
        target[key] = this._deepAssign(target[key], value)
      else
        target[key] = value
    })
    return target
  }

  // returns nothing (empty promise) if server db update goes well
  async _sendDiff(type, diff, config){
    const payload = {
      id: uuid(),
      changes: diff,
      ts: diff.lastUpdateDate,
      email: config.email,
      userkey: config.userkey,
      type: type,
      devid: config.devid
    }

    try{ // send update to server
      await send('/api/update', 'POST', payload)
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
    let config
    try{
      config = await this._getConfig()
    }
    catch(ex){ return } // swallow error, not interested if config is not setup or disabled

    try{
      const updates = await repo.getAll('updates')
      if (updates.length === 0) return // nothing to send

      // process each upate, synchronously
      await updates.reduce(async (prom, update) => {
        await prom
        try{
          await send('/api/update', 'POST', update)
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
