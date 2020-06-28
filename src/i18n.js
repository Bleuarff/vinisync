
// basic i18n & L20n provider
export default class{
  constructor(){
    this.lang = 'fr'
    this.messages = texts[this.lang]
  }

  getString(key){
    const msg = this.messages[key]
    return msg || key
  }
}

const texts = {
  fr: {
    year: 'Année',
    apogeeEnd: 'Apogée fin',
    apogeeStart: 'Apogée début',
    sparkling: 'Pétillant',
    count: 'Bouteilles',
  }
}
