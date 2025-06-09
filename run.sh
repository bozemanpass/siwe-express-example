#!/bin/bash

if [[ -z "$REQUIRE_WHITELISTED_ACCOUNTS" ]]; then
  if [[ -n "$WHITELIST_CONTRACT_ADDRESS" ]] || [[ -n "$STACK_SVC_FXETH_GETH_1" ]]; then
    REQUIRE_WHITELISTED_ACCOUNTS=true
  fi
fi

if [[ -z "$WHITELIST_CONTRACT_ADDRESS" ]] && [[ ${REQUIRE_WHITELISTED_ACCOUNTS} == "true" ]]; then
  while [ ! -f /app/AddressList.deploy.json ]; do
    echo "Waiting for AddressList contract to be deployed ..."
    sleep 1
  done
  WHITELIST_CONTRACT_ADDRESS=$(jq -r '.deployedTo' /app/AddressList.deploy.json)
fi

export WHITELIST_CONTRACT_ADDRESS
export REQUIRE_SAME_NETWORK=${REQUIRE_SAME_NETWORK:-false}
export ETHEREUM_RPC_URL=${ETHEREUM_RPC_URL:-http://${STACK_SVC_FXETH_GETH_1}:8545}
export MINIMUM_ACCOUNT_BALANCE=${MINIMUM_ACCOUNT_BALANCE:-1}
export FAUCET_PRIVATE_KEY=${FAUCET_PRIVATE_KEY:-888814df89c4358d7ddb3fa4b0213e7331239a80e1f013eaa7b2deca2a41a218}

npm run start
