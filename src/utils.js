import { DateTime } from 'luxon'

export default class Utils{

  // computes diff between 2 objects.
  // returns null if objects are equal
  static async getDiff(obj, ref){
    let diff = null

    // get ref object's keys, to check if some keys have been removed.
    Object.keys(ref).forEach(key => {
      if (obj[key] == null && ref[key] != null){
        diff = {...diff, key: null}
      }
    })

    // loop modified object's entries to check for addition & modifications
    await Object.entries(obj).reduce(async (prom, [key, value]) => {
      await prom
      if (ref[key] == null && value != null){ // key is new in obj
        diff = diff || {}
        if (value instanceof Blob)
          diff[key] = await Utils.getBlobAsBase64(value)
        else
          diff[key] = value
      }
      else if (Array.isArray(value)){
        if (value.length !== ref[key].length){
          diff = diff || {}
          diff[key] = value
        }
        else{
          for (let i= 0; i < value.length; i++){
            // primitive types only for array items check
            if (value[i] !== ref[key][i]){
              diff = diff || {}
              diff[key] = value
              break
            }
          }
        }
      }
      else if (value instanceof Blob){
        if (ref[key] instanceof Blob){
          // convert to base64 to compare them
          const [dataRef, dataObj] = await Promise.all([
            Utils.getBlobAsBase64(ref[key]),
            Utils.getBlobAsBase64(value)
          ])
          if (dataRef !== dataObj){
            diff = diff || {}
            diff[key] = dataObj
          }
        }
      }
      else if (typeof value === 'object' && value != null){
        const subDiff = await Utils.getDiff(value, ref[key])
        if (subDiff){
          diff = diff || {}
          diff[key] = subDiff
        }
      }
      else if (value !== ref[key]){
        diff = diff || {}
        diff[key] = value
      }
    }, Promise.resolve())

    return diff
  }

  // convert blob to base64
  static getBlobAsBase64(blob){
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.addEventListener('load', e => {
        resolve(e.target.result.split(',')[1]) // remove "[mime];base64," prefix
      }, false)
      reader.readAsDataURL(blob)
    })
  }

  // convert base64 value to blob
  // mime type is just to make it a valid data url, not related to actual mime type of image
  static async getBlobFromBase64(value){
    const res = await fetch('data:image/jpeg;base64,' + value)
    return res.blob()
  }

  static deepClone(obj){
    if (obj == null) return null

    const cp = {}
    Object.entries(obj).forEach(([key, value]) => {
      if (Array.isArray(value))
        cp[key] = [...value] // array is assumed to contain only primitive types
      else if (value instanceof Blob)
        cp[key] === value // no copy for blobs
      else if (typeof value === 'object')
        cp[key] = Utils.deepClone(value)
      else
        cp[key] = value
    })
    return cp
  }

  // thanks to https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest#Examples
  static async computeHash(input, algo = 'SHA-256'){
    const msgUint8 = new TextEncoder().encode(input),
          hashBuffer = await crypto.subtle.digest(algo, msgUint8),
          hashArray = Array.from(new Uint8Array(hashBuffer)),
          hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    return hashHex
  }

  static logError(error, payload = {}){
    if (typeof payload === 'string')
      payload = { msg: payload }

    console.error(payload.msg, error)

    const params = {
      msg: '',
      ...payload,
      lvl: 'error',
      env: '__ENVIRONMENT__',
      ts: DateTime.utc().toISO(),
      orig: 'client',
      error_msg: error.message,
      error_stack: error.stack
      
    }

    // use fetch to send data
    const options = {
      method: 'POST',
      body: JSON.stringify(params),
      headers: {
        ['Content-Type']: 'application/json',
        'X-Daco': '__DACO_AUTH__'
      }
    }
    fetch('https:///daco.vinisync.fr/log', options)
    .catch(ex => {
      console.error('Log error', ex)
    })
    
    return
  }
}
