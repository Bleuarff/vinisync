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
Install https://github.com/nvm-sh/nvm for easy mgmt, then  node >= 14

## Nginx
- Copy `config/nginx.prod.conf` to `/etc/nginx/sites-available/vinisync.conf`
- Create symbolic link in `sites-enabled/` & restart

## TLS config
`sudo certbot certonly --webroot -w /var/www/vinisync/ -d stg.vinisync.fr --preferred-challenges http`

TODO:
- build & upload script
- server install script (after upload & unpack)
