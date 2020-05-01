import { repo } from './storage.js'
import { send } from './fetch.js'
import Utils from './utils.js'
import { v4 as uuid} from 'uuid'
import moment from 'moment'

class SyncMgr{
  constructor(){}

  // initiate sync: send all existing local data
  // TODO: how to show progress to sync page?
  async start(){
    try{
      const config = await this._getConfig()

      // get all entries, send each one to server. On failure, save to dedicated table in db
      // TODO: all entries currently sent in a burst. We should be waiting for each one (+ timeout?) before sending the next one.
      const entries = await repo.getAll('entries')
      entries.forEach(async entry => {
        const data = {
          id: uuid(),
          changes: entry,
          ts: entry.lastUpdateDate,
          email: config.email,
          userkey: config.userkey,
          type: 'entry',
          devid: config.devid
        }

        try{
          await send('/api/update', 'POST', data)
        }
        catch(ex){
          await repo.insertOne('updates', data)
        }
      })
    }
    catch(ex){
      throw ex
    }
  }

  // generic method to send a diff to server
  async syncIt(obj, ref, type, table){
    try{
      const config = await this._getConfig()
      let diff
      if (ref != null){
        diff = Utils.getDiff(obj, ref)
      }
      else{
        diff = obj // no reference object means new document, send all
      }

      await this._sendDiff(type, diff, config)

    }
    catch(ex){
      throw ex
    }
  }

  // requests server for updates.
  async checkUpdates(forced = false){
    try{
      // get sync info
      const config = await this._getConfig()

      // sync only if forced or last sync is at least an hour ago
      if (!forced && moment().utc().diff(moment(config.lastSync), 'minute') >= 60)
        return

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
        config.lastSync = data.lastSync
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
          default:
            console.error('"${update.type}" type of update is not supported')
        }
      }, Promise.resolve())

      // await repo.updateDoc('config', config) // save config w/ last sync date after confirmation everything is saved
      // emit event ?
    }
    catch(ex){
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
      await repo.updateDoc('entries', localEntry)
    }
    else{
      // entry id is unknown on this device, just create it
      await repo.insertOne('entries', remoteEntry)
      console.debug(`entry created from update ${update.id}`)
    }
  }

  // like Object.assign but recursive
  _deepAssign(target, changes){
    Object.entries(changes).forEach(([key, value]) => {
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
}

const syncMgr = new SyncMgr()
export {syncMgr}
