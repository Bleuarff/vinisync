import { repo } from './storage.js'
import { send } from './fetch.js'
import { v4 as uuid} from 'uuid'

class SyncMgr{
  constructor(){}

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
          type: 'entry'
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
          userkey: config.userkey
        })

        updates = [...updates, ...data.updates]
        paginated = data.total > updates.length
        config.lastSync = data.lastSync
      }
      while(paginated)

      // merge updates. changes are ordered by date
      updates.forEach(update => {
        switch(update.type){
          case 'entry': this.mergeEntry(update)
            break
          default:
            console.error('this type of update is not supported')
        }
      })

      // await repo.updateDoc('config', config) // save config w/ last sync date after confirmation everything is saved
      // emit event ?
    }
    catch(ex){
      throw ex
    }
  }

  async mergeEntry(update){
    const remoteEntry = update.changes
    const localEntry = await repo.getOne('entries', remoteEntry.id)

    if (localEntry){
      if (localEntry.lastUpdateDate > remoteEntry.lastUpdateDate){
        // Houston, we have a conflict
        return
      }
      //
    }
    else{
      // entry id is unknown on this device, just create it
      await repo.insertOne('entries', remoteEntry)
      console.debug(`entry created from update ${update.id}`)
    }
  }
}

const syncMgr = new SyncMgr()
export {syncMgr}
