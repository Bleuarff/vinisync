// Wrapper around fetch

const host = '//192.168.9.226:5002',
      TIMEOUT = 30 * 1e3

function LogicException(data) {
  this.status = data.status
  this.message = data.data.reason
  this.data = data.data
  this.toString = () => { return `[${this.status}] ${this.message}` }
}

export async function send(path, method = 'GET', data = {}){
  const options = {
    method: method,
    mode: 'cors',
    headers: {}
  }

  if (['POST', 'PUT'].includes(method)){
    options.headers['Content-Type'] = 'application/json'
    options.body = JSON.stringify(data)
  }
  else{
    const qs = '?' + Object.entries(data).map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join('&')
    path += qs
  }

  try{
    const res = await Promise.race([
      fetch(host + path, options),
      new Promise(reject => {
        setTimeout(() => {reject('TIMEOUT')}, TIMEOUT)
      })
    ])
    let data = null

    if (res.status !== 204)
      data = await res.json()

    if (res.status > 400)
      throw new LogicException({status: res.status, data: data})

    return data
  }
  catch(ex){
    console.error(ex)

    if (ex.message.includes('NetworkError'))
      throw new Error('Erreur réseau, ressayer ultérieurement')
    else
      throw ex
  }


}
