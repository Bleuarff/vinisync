
export default class Utils{

  // computes diff between 2 objects.
  // returns null if objects are equal
  static getDiff(obj, ref){
    let diff = null

    // get ref object's keys, to check if some keys have been removed.
    Object.keys(ref).forEach(key => {
      if (obj[key] == null && ref[key] != null){
        diff = diff || {}
        diff[key] = null
      }
    })

    // loop modified object's entries to check for addition & modifications
    Object.entries(obj).forEach(([key, value]) => {
      if (ref[key] == null){ // key is new in obj
        diff = diff || {}
        diff[key] = value
      }
      else if (Array.isArray(value)){
        if (value.length !== ref[key].length){
          diff = diff || {}
          diff[key] = value
        }
        else{
          for (let i= 0; i < value.length; i++){
            if (value[i] !== ref[key][i]){
              diff = diff || {}
              diff[key] = value
              break
            }
          }
        }
      }
      else if (typeof value === 'object'){
        const subDiff = Utils.getDiff(value, ref[key])
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
}
