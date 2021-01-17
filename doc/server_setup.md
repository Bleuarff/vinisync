# Server Setup

## Mongodb

### install

install packages **server** & **shell** from https://www.mongodb.com/try/download/community.

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
download version & extract to /opt, edit /usr/local/bin/(node|npm) symlinks to the new version.
````
# ln -s /opt/node-v15/bin/node node15
# ln -s /opt/node-v15/bin/npm npm15
# mv -T node15 node
# mv -T npm15 npm
````

## Nginx
- Copy `config/nginx.prod.conf` to `/etc/nginx/sites-available/vinisync.conf`
- Create symbolic link in `sites-enabled/` & restart

## TLS config
`sudo certbot certonly --webroot -w /var/www/vinisync/ -d stg.vinisync.fr --preferred-challenges http`

+ sudo apt install unzip
