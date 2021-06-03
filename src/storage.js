import { openDB, deleteDB, wrap, unwrap } from 'idb'

const DB_VERSION = 2,
      DB_NAME = 'vinisync'

let db

async function open(){
  if (db) return

  db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction){
      console.debug(`Upgrade needed, ${oldVersion} → ${newVersion}`)

      if (oldVersion < 1){
        try{
          const store = db.createObjectStore('entries', {keyPath: 'id', autoIncrement: false})
          store.createIndex('creationDate', 'creationDate', {unique: false})
          store.createIndex('lastUpdateDate', 'lastUpdateDate', {unique: false})

          db.createObjectStore('updates', {keyPath: 'id', autoIncrement: false})
          db.createObjectStore('images', {keyPath: 'id', autoIncrement: false})
          db.createObjectStore('history', {keyPath: 'entryId', autoIncrement: false})
          db.createObjectStore('conflicts', {keyPath: 'id', autoIncrement: false})
        }
        catch(ex){
          console.error('Update Error')
          console.error(ex)
          throw ex
        }
      }

      if (oldVersion < 2){
        try{
          const store = transaction.objectStore('updates')
          store.createIndex('pending', 'pending', {unique: false, multiEntry: false})
          store.createIndex('entryId', 'changes.id', {unique: false, multiEntry: false})
        }
        catch(ex){
          console.error('Update v2 error')
          throw ex
        }
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

  if (table === 'entries')
    return findById(table, doc.id)
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

function getFromIndex(table, index, key){
  try{
    return db.getFromIndex(table, index, key)
  }
  catch(ex){
    console.error(ex)
    throw new Error(`getFromIndex error: table ${table} index ${index} key ${key}`)
  }
}

function getAllFromIndex(table, index, key){
  try{
    return db.getAllFromIndex(table, index, key)
  }
  catch(ex){
    console.error(ex)
    throw new Error(`getAllFromIndex error: table ${table} index ${index} key ${key}`)
  }
}

function countFromIndex(table, index, key){
  try{
    return db.countFromIndex(table, index, key)
  }
  catch(ex){
    console.error(ex)
    throw new Error(`countFromIndex error: table ${table} index ${index} key ${key}`)
  }
}

function count(table){
  try{
    const store = db.transaction(table).store
    return store.count()
  }
  catch(ex){
    console.error(ex)
    throw new Error(`count error on table ${table}`)
  }
}

function deleteOne(table, id){
  return db.delete(table, id)
}

// clears content in all tables
async function clearAll(){
  const tables = ['entries', 'images', 'history', 'conflicts', 'updates']
  return tables.reduce(async (prom, table) => {
    await prom
    return db.clear(table)
  }, Promise.resolve())
}


export const repo = {
  open,

  getAll,

  // find by providing document id
  findById,

  // find by providing a query function.
  findOne,

  getFromIndex,
  getAllFromIndex,
  countFromIndex,

  // updates doc by replacing it entirely
  updateDoc,

  // updates doc by providing only modified fields
  updateOne,

  insertOne,

  deleteOne,

  count,

  clearAll,
}
