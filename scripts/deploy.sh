#!/bin/bash
set -e # exit on any error

env="$1"

if [ -z "$env" ]
then
  echo "env not set. Usage: ./deploy.sh <stg|prod>"
  exit
fi

# build app
# gulp build --e $env

# get archive name
zipName=$(ls -t releases/vin* | head -n 1 | cut -d / -f2)
echo "Deploying archive $zipName..."

# upload it
# rsync "releases/$zipName" "scripts/install.sh" "ubuntu@gigondas:~/vinisync/"
rsync "scripts/install.sh" "ubuntu@gigondas:~/vinisync/"

# on server: install & run
ssh "ubuntu@gigondas" "chmod 744 ~/vinisync/install.sh && ~/vinisync/install.sh $zipName;"
