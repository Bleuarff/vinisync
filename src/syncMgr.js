import { repo } from './storage.js'
import { send } from './fetch.js'
import { v4 as uuid} from 'uuid'

class SyncMgr{
  constructor(){}

  async syncNow(entry){

  }


  // TODO: how to show progress to sync page?
  async start(){
    try{
      const config = await repo.getOne('config', 'sync')
      if (!config)
        throw new Error('SYNC_NOT_CONFIGURED')
      if (!config.enabled)
        throw new Error('SYNC_DISABLED')

      // get all entries, send each one to server. On failure, save to dedicated table in db
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
          await send('/api/entry', 'POST', data)
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

  async checkUpdates(){
    try{
      // get sync info
      const config = await repo.getOne('config', 'sync')

      // checks config is enabled
      if (!config.enabled) return

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
            await this.mergeEntry(update)
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

  async mergeEntry(update){
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
      localEntry = this.deepAssign(localEntry, remoteEntry)
      await repo.updateDoc('entries', localEntry)
    }
    else{
      // entry id is unknown on this device, just create it
      await repo.insertOne('entries', remoteEntry)
      console.debug(`entry created from update ${update.id}`)
    }
  }

  // like Object.assign but recursive
  deepAssign(target, changes){
    Object.entries(changes).forEach(([key, value]) => {
      if (typeof value === 'object')
        target[key] = this.deepAssign(target[key], value)
      else
        target[key] = value
    })
    return target
  }
}

const syncMgr = new SyncMgr()
export {syncMgr}
