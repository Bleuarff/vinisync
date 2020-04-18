import { v4 as uuidv4} from 'uuid'
import { openDB, deleteDB, wrap, unwrap } from 'idb'

const DB_VERSION = 1,
      DB_NAME = 'vinisync'

let db

async function open(){
  if (db) return

  db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transation){
      console.debug(`Upgrade needed, ${oldVersion} → ${newVersion}`)

      if (oldVersion <= 1){
        const store = db.createObjectStore('entries', {keyPath: 'id', autoIncrement: false})
        store.createIndex('creationDate', 'creationDate', {unique: false})
        store.createIndex('lastUpdateDate', 'lastUpdateDate', {unique: false})
      }
    }
  })
}

// retrieve list of entries
async function getEntries(){
  const entries = []
  let cursor = await db.transaction('entries').store.openCursor();
  while (cursor){
    entries.push(cursor.value)
    cursor = await cursor.continue();
  }
  return entries
}

async function getEntry(id){
  const store = db.transaction('entries').store
  return store.get(id)
}

// insert new entry
async function addEntry(entry){
  entry.id = uuidv4()
  await db.add('entries', entry)
}

async function updateEntry(entry){
  return
}

export const repo = {
  open: open,
  getEntries: getEntries,
  getEntry: getEntry,
  addEntry: addEntry,
  updateEntry: updateEntry
}
