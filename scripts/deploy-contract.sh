#!/usr/bin/env bash

if [[ -n "$BPI_SCRIPT_DEBUG" ]]; then
    set -x
fi

if [[ -f "${STACK_DEPLOYMENT_DIR}/.init_complete" ]]; then
  echo "Initialization complete (if this is wrong, remove ${STACK_DEPLOYMENT_DIR}/.init_complete and restart the stack)."
  exit 0
fi

while true; do
  stack manage --dir ${STACK_DEPLOYMENT_DIR} status | grep "\-siwe\-" | grep -i 'running'
  if [ $? -eq 0 ]; then
    echo "Stack is running, proceeding with contract deployment."
    break
  else
    echo "Stack is not running yet, waiting for it to start..."
    sleep 5
  fi
done

EXEC_CMD="stack manage --dir ${STACK_DEPLOYMENT_DIR} exec siwe"

# Check if the stack is running in fixturenet (ie, whether the geth service is part of this deployment)
GETH_HOST=$( $EXEC_CMD "getent hosts fxeth-geth-1 2>/dev/null | head -1" )
if [[ -z "$GETH_HOST" ]]; then
  echo "Not running in fixturenet, skipping contract deployment."
  touch "${STACK_DEPLOYMENT_DIR}/.init_complete"
  exit 0
fi

# Wait till ETH RPC endpoint is available with block number > 1
retry_interval=5
while true; do
  block_number_hex=$( $EXEC_CMD "curl -s -X POST -H 'Content-Type: application/json' --data '{\"jsonrpc\":\"2.0\",\"method\":\"eth_blockNumber\",\"params\":[],\"id\":1}' http://fxeth-geth-1:8545 | jq -r '.result'")

  # Check if the request call was successful
  if [ $? -ne 0 ] || [ -z "$block_number_hex" ] || [[ $block_number_hex == *"rror"* ]]; then
    echo "RPC endpoint not yet available, retrying in $retry_interval seconds..."
    sleep $retry_interval
    continue
  fi

  # Convert hex to decimal
  block_number_dec=$(printf %u ${block_number_hex})

  # Check if block number is > 1 to avoid failures in the deployment
  if [ "$block_number_dec" -ge 1 ]; then
    echo "RPC endpoint is up"
    break
  else
    echo "RPC endpoint not yet available, retrying in $retry_interval seconds..."
    sleep $retry_interval
    continue
  fi
done

set -e

echo "Deploying AddressList contract..."
$EXEC_CMD "mkdir /tmp/forge.$$ && forge create --no-cache --out /tmp/forge.$$ --rpc-url http://fxeth-geth-1:8545 --private-key 888814df89c4358d7ddb3fa4b0213e7331239a80e1f013eaa7b2deca2a41a218 /app/contracts/AddressList.sol:AddressList --json > /tmp/forge.$$/deploy.json.$$ && cp -f /tmp/forge.$$/deploy.json.$$ /data/AddressList.deploy.json && rm -rf /tmp/forge.$$"

echo "Success, AddressList contract deployed"
touch "${STACK_DEPLOYMENT_DIR}/.init_complete"
