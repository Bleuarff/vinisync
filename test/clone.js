const assert = require('chai').assert

// doesn't work if using relative path.
import utils from '/home/bleuarff/dev/vinisync/src/utils.js'

describe('Clone', () => {
  it('basic', () => {
    const src = {a : 2},
          res = utils.deepClone(src)
    assert.deepEqual(res, src)
  })
  it('complex', () => {
    const src = {a : {b: -8, c: [1,2]}, f: [2, 4,5]},
          res = utils.deepClone(src)
    assert.deepEqual(res, src)
    assert.notStrictEqual(src.a, res.a)
    assert.notStrictEqual(src.f, res.f)
  })
  it('null', () => {
    const res = utils.deepClone(null)
    assert.isNull(res)
  })
  it('undefined', () => {
    const res = utils.deepClone(undefined)
    assert.isNull(res)
  })

  it('arraybug', () => {
    const src = {
      wine:{appellation:"Champagne",producer:"Gosset",name:"Grande Réserve",year:2006,country:"France",apogeeStart:null,
      apogeeEnd:null,cepages:['syrah'],containing:"0.75",color:"rose",sweet:false,sparkling:true},count:6,location:"",
      id:"82665b31-77d6-4538-b142-f0ce2471750c",creationDate:"2020-05-01T21:51:39.395Z",lastUpdateDate:"2020-05-01T22:07:29.412Z"
    }

    const res = utils.deepClone(src)
    assert.equal(res.wine.cepages[0], 'syrah')
  })
})
