#!/bin/bash
#
# Copyright (c) 2019, Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
# SPDX-License-Identifier: Apache-2.0
#


# Runs the UI, including all required background processes:
#   1. Ledger/backend
#   2. Triggers

BACKEND_READY_TEXT="Press 'Ctrl-C' to quit"

run_backend() {
    cd ../model || exit
    daml start --sandbox-option --address=localhost --start-navigator false
}

run_triggers() {
    cd ..
    scripts/startTriggers.py 6865 &
}

run_frontend() {
    echo "Running UI..."
    npm start
}

# Create tmp log file for backend output
backend_log_file=$(mktemp)
echo "DEBUG: Using tmp log file: $backend_log_file"

# Start backend in the background
(run_backend | tee "$backend_log_file" &)

# Start triggers in the background
run_triggers &

# Wait for backend to be ready, then start frontend
echo "Waiting for backend..."
tail -F "${backend_log_file}" |
    grep --line-buffered "${BACKEND_READY_TEXT}" |
    while read -r ; do echo "Backend ready."; run_frontend ; done
