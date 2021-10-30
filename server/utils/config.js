'use strict'

const VError = require('verror'),
			{readFileSync} = require('fs'),
			{join} = require('path'),
			yaml = require('js-yaml')

const REFRESH_INTERVAL = 15 * 60 * 1e3

let _config = null

function getConfig(){
	return _config
}

// on module load, get config from file
void function getConfFromFile(){
	try{
		const filepath = join(__dirname, '../config/config.yml')
		const content = readFileSync(filepath, 'utf8')
		_config = yaml.load(content)
		// console.debug(JSON.stringify(_config))
	}
	catch(ex){
		throw new VError(ex, 'Error reading configuration file')
	}
}()


module.exports = exports = getConfig
