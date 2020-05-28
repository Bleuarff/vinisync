// const utils = require('../src/utils.js')
const assert = require('chai').assert

// doesn't work if using relative path.
import utils from '/home/bleuarff/dev/vinisync/src/utils.js'


describe('Diff', () => {
  it('modified key', async () => {
    const ref = {a: 1},
          obj = {a: 2},
          expected = {a: 2}
    const diff = await utils.getDiff(obj, ref)
    assert.deepEqual(diff, expected)
  })
  it('deleted key', async () => {
    const ref = {a: 1, b:2},
          obj = {a: 1},
          expected = {b: null}
    const diff = await utils.getDiff(obj, ref)
    assert.deepEqual(diff, expected)
  })
  it('new key', () => {
    const ref = {a: 1},
          obj = {a: 1, b: 5},
          expected = {b: 5}
    const diff = utils.getDiff(obj, ref)
    assert.deepEqual(diff, expected)
  })
  it('multiple modifs', () => {
    const ref = {a: 1, b: 5, c: 3},
          obj = {a: 2, b: 5, d: 65},
          expected = {a: 2, c: null, d: 65}
    const diff = utils.getDiff(obj, ref)
    assert.deepEqual(diff, expected)
  })
  it('equals', () => {
    const ref = {a: 1, b: 5, c: 3},
          obj = {a: 1, b: 5, c: 3},
          expected = null
    const diff = utils.getDiff(obj, ref)
    assert.deepEqual(diff, expected)
  })
  it('new obj', () => {
    const ref = {a: 1},
          obj = {a: 1, w:{y: 1995}},
          expected = { w:{y: 1995}}
    const diff = utils.getDiff(obj, ref)
    assert.deepEqual(diff, expected)
  })
  it('deleted obj', () => {
    const ref = {a: 1, w:{y: 1995}},
          obj = {a: 2},
          expected = { a: 2, w: null}
    const diff = utils.getDiff(obj, ref)
    assert.deepEqual(diff, expected)
  })
  it('edited obj', () => {
    const ref = {a: 1, w:{y: 1995}},
          obj = {a: 1, w:{y: 2007}},
          expected = {w: {y: 2007}}
    const diff = utils.getDiff(obj, ref)
    assert.deepEqual(diff, expected)
  })
  it('edited array', () => {
    const ref = {a: 1, w:{c: ['syrah', 'sauvignon']}},
          obj = {a: 1, w:{c: ['syrah']}},
          expected = {w: {c: ['syrah']}}
    const diff = utils.getDiff(obj, ref)
    assert.deepEqual(diff, expected)
  })
  it('edited array 2', () => {
    const ref = {a: 1, w:{c: ['syrah', 'sauvignon']}},
          obj = {a: 1, w:{c: ['syrah', 'malbec', 'grenache gis']}},
          expected = {w: {c: ['syrah', 'malbec', 'grenache gis']}}
    const diff = utils.getDiff(obj, ref)
    assert.deepEqual(diff, expected)
  })
  it('null', () => {
    const ref = {a: 1, w:{c: null}},
          obj = {a: 1, w:{c: null, d: 1}},
          expected = {w:{d: 1}}
    const diff = utils.getDiff(obj, ref)
    assert.deepEqual(diff, expected)
  })


})
