#!/usr/bin/bash
set -e

zipName="$1"

# Create log directory
# sudo mkdir -p /var/log/vinisync
# sudo chown -R ubuntu:ubuntu /var/log/vinisync

# decompress archive
unzip -o ~/vinisync/${zipName} -d /var/www/vinisync

source ~/vinisync/sendgrid.env

# install dependencies
cd /var/www/vinisync
/usr/local/bin/npm install

# find existing process
# TODO: Cannot run other processes with same script. Need more foolproof way.
curpid=$(pgrep -f "node server/main.js")

#echo "curpid $curpid"

# kill existing process
if [ -n "$curpid" ]
then
  echo "kill pid \"$curpid\""
  kill -15 $curpid || true
else
  echo "No existing process found"
fi

# run
echo "start app"
nohup /usr/local/bin/node server/main.js >> /var/log/vinisync/vinisync.log 2>&1 &
echo "done"
