#!/bin/bash
set -e

#######################################
#
# Mongo backup & upload to scaleway s3
#
#######################################

ENV="$1"
DEST_FOLDER="$2"

source ./.credentials.env

TS=$(date +"%Y%m%d_%H%M")
FILENAME="vinisync-$ENV-mongo-backup-${DEST_FOLDER}-$TS.gz"

mongodump --db=vinisync --username="$MONGO_USER" --password="$MONGO_PWD" --gzip --archive=$FILENAME --authenticationMechanism=SCRAM-SHA-256 --port=29817

# restore: username must have admin rights
# mongorestore  --username --password --authenticationMechanisme SCRAM-SHA-256 --gzip --archive=FILENAME

echo "
Archive $FILENAME created"

# Check api key exists
if [ -z "$SCW_ACCESS_KEY" ] || [ -z "$SCW_SECRET_KEY" ]
then
  echo "API key not defined"
  exit
fi

# Uploads a file to vni-backups bucket (Scaleway)
yyyymmdd=`date +%Y%m%d`
s3Bucket="vni-backups"
bucketLocation="fr-par"
s3SecretKey=${SCW_SECRET_KEY}
s3AccessKey=${SCW_ACCESS_KEY}
endpoint="${s3Bucket}.s3.fr-par.scw.cloud"
contentLength=`cat ${FILENAME} | wc -c`
contentHash=`openssl dgst -sha256 -hex ${FILENAME} | sed 's/.* //'`
contentType=`file -b --mime-type $FILENAME`
# echo $contentType
b64=`openssl md5 -binary "$FILENAME" | openssl base64`
acl="private"

date=`date -u +%Y%m%dT%H%M%SZ`
expdate_s="2033-12-30T12:00:00.000Z"
region="fr-par"

p=$(cat <<POLICY | openssl base64 | tr -d \\n
{ "expiration": "${expdate_s}",
  "conditions": [
    {"acl": "$acl" },
    {"bucket": "$s3Bucket" },
    ["starts-with", "\$key", ""],
    {"x-amz-date": "$date" },
    {"x-amz-credential": "${s3AccessKey}/${yyyymmdd}/${region}/s3/aws4_request" },
    {"x-amz-algorithm": "AWS4-HMAC-SHA256" }
  ]
}
POLICY
)

stringToSign=$p
#echo "----------------- canonicalRequest --------------------"
#echo -e ${canonicalRequest}
#echo "----------------- stringToSign --------------------"
#echo -e ${stringToSign}
#echo "-------------------------------------------------------"

# calculate the signing key
DateKey=`echo -n "${yyyymmdd}" | openssl dgst -sha256 -hex -hmac "AWS4${s3SecretKey}" | sed 's/.* //'`
DateRegionKey=`echo -n "${bucketLocation}" | openssl dgst -sha256 -hex -mac HMAC -macopt hexkey:${DateKey} | sed 's/.* //'`
DateRegionServiceKey=`echo -n "s3" | openssl dgst -sha256 -hex -mac HMAC -macopt hexkey:${DateRegionKey} | sed 's/.* //'`
SigningKey=`echo -n "aws4_request" | openssl dgst -sha256 -hex -mac HMAC -macopt hexkey:${DateRegionServiceKey} | sed 's/.* //'`
# then, once more a HMAC for the signature
signature=`echo -en ${p} | openssl dgst -sha256 -hex -mac HMAC -macopt hexkey:${SigningKey} | sed 's/.* //'`

key_and_sig_args="-F X-Amz-Credential=${s3AccessKey}/${yyyymmdd}/${region}/s3/aws4_request -F X-Amz-Algorithm=AWS4-HMAC-SHA256 -F X-Amz-Signature=$signature -F X-Amz-Date=${date}"
#-F "X-Amz-Security-Token= ${xamztoken}" \

responseCode=$(curl   \
-w "%{http_code}" \
-F "key=$DEST_FOLDER/$FILENAME" \
-F acl=$acl \
$key_and_sig_args  \
-F "content-md5= ${b64}" \
-F "Policy=$p" \
-F "file=@$FILENAME" \
https://${endpoint})

echo "${responseCode}"

if [ "$responseCode" = "204" ]; then
  rm $FILENAME
  echo "Success, delete local backup file"
fi
