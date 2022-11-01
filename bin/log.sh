source ./bin/datadog-secret.sh
NODEID="${1}"
NODETITLE="${2}"
ACTION="${3}"
curl -X POST "https://http-intake.logs.datadoghq.com/api/v2/logs" \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "DD-API-KEY: $APIKEY" \
-d @- << EOF
[
  {
    "nodeid": "$NODEID",
    "nodetitle": "$NODETITLE",
    "action": "$ACTION",
  }
]
EOF
