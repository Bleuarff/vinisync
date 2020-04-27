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
          userkey: config.userkey
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

      // query server for updates

      // merge updates
      // emit event ?
    }
    catch(ex){
      throw ex
    }
  }
}

const syncMgr = new SyncMgr()
export {syncMgr}
