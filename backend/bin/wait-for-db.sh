#!/bin/sh
#
# Wait until the database given in DATABASE_URL accepts connections.
#
HOSTPORT=`echo "$DATABASE_URL" | sed -E 's#^[a-z]+://([^@]*@)?([^/?]+).*#\2#'`
HOST=${HOSTPORT%%:*}
PORT=${HOSTPORT##*:}
if [ "$PORT" = "$HOSTPORT" ]; then
  PORT=5432
fi
exec `dirname $0`/wait-for-it.sh -t 120 -h "$HOST" -p "$PORT"
