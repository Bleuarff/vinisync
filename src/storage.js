import { v4 as uuidv4} from 'uuid'

class Entries{
  constructor(){
    this.entries = [{
      id: '1',
      name: 'Cuvée du Potier',
      appellation: 'St Jo',
      producer: 'Domaine de la Ville Rouge',
      year: 2016,
      color: 'red'
    }, {
      id: '2',
      appellation: 'Pomerol',
      producer: 'Petrus',
      year: 1999,
      color: 'red'
    },{
      id: '3',
      name: 'Pouet',
      appellation: 'Sancerre',
      producer: 'Vincent Pinard',
      year: 2017,
      color: 'white'
    }]
  }

  async getAll(){
    return this.entries
  }

  async getOne(id){
    return this.entries.find(x => x.id === id)
  }

  async insert(entry){
    entry.id = uuidv4()
    this.entries = [...this.entries, entry]
    return Promise.resolve()
  }

  createId(len = 4){
    let id = ''
    do{
      id += Math.random().toString(36).substring(2)
    }
    while(id.length < len)
    return id.substring(0, len)
  }
}

export const repo = new Entries()
