import { openDB, deleteDB, wrap, unwrap } from 'idb'

const DB_VERSION = 3,
      DB_NAME = 'vinisync'

let db

async function open(){
  if (db) return

  db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction){
      console.debug(`Upgrade needed, ${oldVersion} → ${newVersion}`)

      if (oldVersion < 1){
        const store = db.createObjectStore('entries', {keyPath: 'id', autoIncrement: false})
        store.createIndex('creationDate', 'creationDate', {unique: false})
        store.createIndex('lastUpdateDate', 'lastUpdateDate', {unique: false})

        db.createObjectStore('config', {keyPath: 'id', autoIncrement: false})
        db.createObjectStore('updates', {keyPath: 'id', autoIncrement: false})
        db.createObjectStore('images', {keyPath: 'id', autoIncrement: false})
      }
      if (oldVersion < 2){
        const store = db.createObjectStore('history', {keyPath: 'entryId', autoIncrement: false})
      }
    }
  })
}

// retrieve all documents for given table
async function getAll(table){
  const docs = []
  let cursor = await db.transaction(table).store.openCursor()
  while (cursor){
    docs.push(cursor.value)
    cursor = await cursor.continue()
  }
  return docs
}

async function findById(table, id){
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

async function findOne(table, query){
  try{
    let cursor = await db.transaction(table).store.openCursor()
    let doc
    while (cursor && !doc){
      // execute function with doc as argument
      if (query(cursor.value) === true)
        doc = cursor.value
      else
        cursor = await cursor.continue()
    }
    return doc
  }
  catch(ex){
    console.error(`find error ${table}`)
    throw ex
  }
}

// creates new document in table
async function insertOne(table, obj){
  try{
    const ts = (new Date()).toISOString()
    if (!obj.lastUpdateDate)
      obj.lastUpdateDate = ts
    if (!obj.creationDate)
      obj.creationDate = ts

    await db.add(table, obj)
    return obj
  }
  catch(ex){
    console.error(`insert error ${table}: ${JSON.stringify(obj)}`)
    throw ex
  }
}

// table: table name to update
// doc: document to update
// keepTime: whether to refresh the lastUpdateDate field. Default: false. Should be true
// only when update comes from sync
async function updateDoc(table, doc, keepTime = false){
  if (!keepTime || !doc.lastUpdateDate)
    doc.lastUpdateDate = (new Date()).toISOString()
  await db.put(table, doc)
}

// Updates a document with given modifications.
// Returns the full modified object.
// TODO: handle editing sup-properties. eg. {'wine.appellation'}, instead of complete object
async function updateOne(table, id, modifs, keepTime = false){
  try{
    const store = db.transaction(table).store
    const doc = await store.get(id)
    if (!doc)
      throw new Error(`Document ${id} not found in table ${table}`)

    Object.entries(modifs).forEach(([key, value]) => {
      doc[key] = value
    })

    if (!keepTime)
      doc.lastUpdateDate = (new Date()).toISOString()

    await db.put(table, doc)
    return findById(table, id)
  }
  catch(ex){
    console.error(ex)
    throw new Error(`updateOne error: table ${table} id: ${id}`)
  }
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

  // find by providing document id
  findById: findById,

  // find by providing a query function.
  findOne: findOne,

  // updates doc by replacing it entirely
  updateDoc: updateDoc,

  // updates doc by providing only modified fields
  updateOne: updateOne,

  insertOne: insertOne,

  deleteOne: deleteOne,
  deleteAll: deleteAll
}
