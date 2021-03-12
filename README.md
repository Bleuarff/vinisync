# Vinisync

Simple cellar management. https://vinisync.fr.

## Description

Vinisync is a simple cellar management. It stores all information locally. Your data leaves your device only if you enable synchronization with other Vinisync instances on other devices.

Chrome and Firefox only. Not even tested on other browsers.

## Run dev

Needs node.js >=14. Run `nvm use` first

bundler:
````
npm run dev
````

server:
````
node server/server.js
````

## Run prod
`npm run build`  
Then use nginx to server files

## Deployment

````bash
./scripts/deploy.sh <env>
````

env being `stg` or  `prod`

## Sync reference

### client sendDiff
payload has random id, diff as changes, ts (+ userid, type, devid)

### server insertUpdate
ts is payload ts (or current time if not provided), uploadedDate is insertion time

### server getUpdates
get updates uploaded after the requesting device last sync.  
returns updates sorted by ts asc, + server time as lastSync date

### client getUpdates
sends device last sync date. If pagination, last sync date is the value returned by server in the previous response.
