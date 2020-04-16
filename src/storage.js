import { v4 as uuidv4} from 'uuid'
import { openDB, deleteDB, wrap, unwrap } from 'idb'

const DB_VERSION = 6,
      DB_NAME = 'vinisync'

let db

async function open(){
  if (db) return

  db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transation){
      console.debug(`Upgrade needed, version ${DB_VERSION}`)
      const store = db.createObjectStore('entries', {keyPath: 'id', autoIncrement: false})
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
  addEntry: addEntry,
  updateEntry: updateEntry
}
