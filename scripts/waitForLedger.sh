#!/usr/bin/env bash
#
# Copyright (c) 2019, Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
# SPDX-License-Identifier: Apache-2.0
#

wait_for_ledger() {
  local host="$1"
  local port="$2"
  until nc -z "$host" "$port"; do
    echo "Waiting for ledger..."
    sleep 1
  done
  echo "Connected to ledger."
}

ledger_host="$1"
ledger_port="$2"

wait_for_ledger "$ledger_host" "$ledger_port"
