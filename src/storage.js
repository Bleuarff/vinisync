import { v4 as uuid} from 'uuid'
import { openDB, deleteDB, wrap, unwrap } from 'idb'

const DB_VERSION = 1,
      DB_NAME = 'vinisync'

let db

async function open(){
  if (db) return

  db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction){
      console.debug(`Upgrade needed, ${oldVersion} → ${newVersion}`)

      if (oldVersion <= 1){
        const store = db.createObjectStore('entries', {keyPath: 'id', autoIncrement: false})
        store.createIndex('creationDate', 'creationDate', {unique: false})
        store.createIndex('lastUpdateDate', 'lastUpdateDate', {unique: false})

        db.createObjectStore('config', {keyPath: 'key', autoIncrement: false})
        db.createObjectStore('updates', {keyPath: 'id', autoIncrement: false})

      }
    }
  })
}

// retrieve all documents for given table
async function getAll(table){
  const docs = []
  let cursor = await db.transaction(table).store.openCursor();
  while (cursor){
    docs.push(cursor.value)
    cursor = await cursor.continue();
  }
  return docs
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

async function insertOne(table, obj){
  try{
    obj.lastUpdateDate = obj.creationDate = (new Date()).toISOString()
    await db.add(table, obj)
    return obj
  }
  catch(ex){
    console.error(`insert error ${table}: ${JSON.stringify(obj)}`)
    throw ex
  }
}

async function updateDoc(table, doc){
  doc.lastUpdateDate = (new Date()).toISOString()
  await db.put(table, doc)
}

// delete all existing entries and create from provided list
async function importEntries(entries){
  const ids = await db.getAllKeys('entries')
  const proms = []

  ids.forEach(id => { proms.push(db.delete('entries', id)) })

  entries.forEach(entry => {
    entry.id = uuid()
    proms.push(insertOne('entries', entry))
  })
  return Promise.all(proms)
}

function deleteOne(table, id){
  return db.delete(table, id)
}

async function deleteAll(table){
  const ids = await db.getAllKeys(table)
  const proms = []
  ids.forEach(id => { proms.push(db.delete(table, id)) })
  return Promise.all(proms)
}


export const repo = {
  open: open,

  getAll: getAll,
  getOne: getOne,

  updateDoc: updateDoc,

  import: importEntries,


  insertOne: insertOne,

  deleteOne: deleteOne,
  deleteAll: deleteAll
}
