// Wrapper around fetch

const host = '//localhost:5002'

function LogicException(data) {
  this.status = data.status
  this.message = data.data.reason
  this.data = data.data
  this.toString = () => { return `[${this.status}] ${this.message}` }
}

export async function send(path, method = 'GET', data = {}){
  const options = {
    method: method,
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
    const res = await fetch(host + path, options)
    const data = await res.json()

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
