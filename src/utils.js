
export default class Utils{

  // computes diff between 2 objects.
  // returns null if objects are equal
  static async getDiff(obj, ref){
    let diff = null

    // get ref object's keys, to check if some keys have been removed.
    Object.keys(ref).forEach(key => {
      if (obj[key] == null && ref[key] != null){
        diff = diff || {}
        diff[key] = null
        // HACK: try object spread instead of above
      }
    })

    // loop modified object's entries to check for addition & modifications
    Object.entries(obj).forEach(async ([key, value]) => {
      if (ref[key] == null && value != null){ // key is new in obj
        diff = diff || {}
        if (value instanceof Blob)
          diff[key] = await Utils.getBlobAsDataUrl(value)
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
            dif[key] = dataObj
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
    })

    return diff
  }

  static getBlobAsBase64(blob){
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.addEventListener('load', e => {
        resolve(e.target.result.split(',')[1]) // remove "[mime];base64," prefix
      }, false)
      reader.readAsDataURL(blob)
    })
  }

  static deepClone(obj){
    if (obj == null) return null

    const cp = {}
    Object.entries(obj).forEach(([key, value]) => {
      if (Array.isArray(value))
        cp[key] = [...value] // array is assumed to contain only primitive types
      else if (typeof value === 'object')
        cp[key] = Utils.deepClone(value)
      else
        cp[key] = value
    })
    return cp
  }
}
