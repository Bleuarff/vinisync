'use strict'

const yaml = require('js-yaml')
const fs   = require('fs')

const inputFile = process.argv[2]

if (!inputFile)
  return 'No input file'


  // Get document, or throw exception on error
  try {
    const doc = yaml.load(fs.readFileSync(inputFile, 'utf8'))
    // console.log(doc)

    const newPath = inputFile.replace(/\.ya?ml$/, '\.json')
    fs.writeFileSync(newPath, JSON.stringify(doc, null, 2))
  } catch (e) {
    console.error(e)
  }
