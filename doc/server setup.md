# Server Setup

## Mongodb

### install

install packages **server** & **shell** from https://www.mongodb.com/try/download/community3.

### db create & user mgmt
````bash
mongo

use vinisync
db.createUser({user: "vni", pwd: "1234", roles: ["readWrite"]})

use admin
db.createUser({user: "admin", pwd: "admin", roles: ["readWriteAnyDatabase", "userAdminAnyDatabase", "dbAdminAnyDatabase"]})

use vinisync
db.updates.createIndex({userid: 1, devid: 1, uploadedDate: -1})
````

### server config
open `/etc/mongod.config`
- enable authentication
- bind network interfaces


## Node
Install https://github.com/nvm-sh/nvm then latest node 14.X
