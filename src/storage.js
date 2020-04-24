import { v4 as uuidv4} from 'uuid'
import { openDB, deleteDB, wrap, unwrap } from 'idb'

const DB_VERSION = 2,
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
      if(oldVersion < 2){
        const store = db.createObjectStore('config', {keyPath: 'key', autoIncrement: false})
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

async function getOne(table, id){
  try{
    // throw new Error('la mouche qui pète !')
    const store = db.transaction(table).store
    return store.get(id)
  }
  catch(ex){
    console.error(`get error ${table} / ${id} ` + ex)
    throw new Error(ex)
  }
}

// insert new entry
async function addEntry(entry){
  entry.id = uuidv4()
  entry.lastUpdateDate = entry.creationDate = (new Date()).toISOString()

  await db.add('entries', entry)
  return entry.id
}

async function updateEntry(entry){
  entry.lastUpdateDate = (new Date()).toISOString()

  await db.put('entries', entry)
}

// delete all existing entries and create from provided list
async function importEntries(entries){
  const ids = await db.getAllKeys('entries')
  const proms = []

  ids.forEach(id => {
      proms.push(db.delete('entries', id))
  })

  entries.forEach(entry => {
    proms.push(addEntry(entry))
  })
  return Promise.all(proms)
}

function deleteEntry(id){
  return db.delete('entries', id)
}


export const repo = {
  open: open,
  getEntries: getEntries,
  // getEntry: getEntry,
  addEntry: addEntry,
  updateEntry: updateEntry,
  import: importEntries,
  deleteEntry: deleteEntry,
  getOne: getOne,
}
