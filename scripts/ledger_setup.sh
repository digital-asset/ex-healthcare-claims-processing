#!/usr/bin/env bash
#
# Copyright (c) 2019, Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
# SPDX-License-Identifier: Apache-2.0
#

wait_for_sandbox() {
  local host="$1"
  local port="$2"
  until nc -z "$host" "$port"; do
    echo "Waiting for sandbox..."
    sleep 1
  done
  echo "Connected sandbox."
}

sandbox_host="$1"
sandbox_port="$2"

wait_for_sandbox "$sandbox_host" "$sandbox_port"

dar_file="$3"
script_name="$4"

daml script \
  --wall-clock-time \
  --ledger-host "$sandbox_host" \
  --ledger-port "$sandbox_port" \
  --dar "$dar_file" \
  --script-name "$script_name"

echo "DAML Script exited with code: $?"
