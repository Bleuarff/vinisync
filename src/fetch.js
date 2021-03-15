// Wrapper around fetch

const TIMEOUT = 30 * 1e3

function LogicException(data) {
  this.status = data.status
  this.message = data.data.reason
  this.data = data.data
  this.toString = () => { return `[${this.status}] ${this.message}` }
}

let cryptoKey

export async function send(path, method = 'GET', data = {}, key){
  const ts = (new Date()).toISOString()
  const options = {
    method: method,
    mode: 'cors',
    headers: {
      ['X-Date']: ts
    }
  }

  let qs = ''
  if (['POST', 'PUT'].includes(method)){
    options.headers['Content-Type'] = 'application/json'
    options.body = JSON.stringify(data)
  }
  else{
    qs = '?' + Object.entries(data).map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join('&')
  }

  // if key is provided, use it to sign the request:
  // compute hmac digest for requet,
  // and add it as Authorization header
  if (key){
    const input = [method, path, ts, options.body || '', qs.substring(1)].join('\n')
    // console.debug(`req from ${data.userid} key ${key}`)
    // console.debug(input)
    const signature = await sign(key, input)
    options.headers['Authorization'] = signature
  }

  try{
    const res = await Promise.race([
      fetch(path + qs, options),
      new Promise((resolve, reject) => {
        setTimeout(() => {reject('TIMEOUT')}, TIMEOUT)
      })
    ])
    let data = null

    if (res.status !== 204)
      data = await res.json()

    if (res.status >= 400)
      throw new LogicException({status: res.status, data: data})

    return data
  }
  catch(ex){
    console.error(ex)

    if (ex === 'TIMEOUT')
      // TODO: send postmessage
      throw new Error('TIMEOUT')
    else if (ex && ex.message && ex.message.includes('NetworkError'))
      throw new Error('Erreur réseau, ressayer ultérieurement')
    else
      throw ex
  }
}

export function clearKey(){
  cryptoKey = null
}

// sign the request if the user key
async function sign(key, input){
  const encoder = new TextEncoder()

  // createy key only once
  if (!cryptoKey){
    cryptoKey = await crypto.subtle.importKey('raw', encoder.encode(key), {
      name: 'HMAC', hash: 'SHA-384'
    }, false, ['sign'])
  }

  const buf_signature = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(input)),
        signature = _arrayBufferToBase64(buf_signature)

  return signature
}

// convert buffer to base 64
function _arrayBufferToBase64(buffer){
  var binary = ''
  const bytes = new Uint8Array(buffer),
        len = bytes.byteLength
  for (let i = 0; i < len; i++){
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary)
}
