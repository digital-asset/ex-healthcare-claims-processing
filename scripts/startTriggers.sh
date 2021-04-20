#!/usr/bin/env bash
#
# Copyright (c) 2019, Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
# SPDX-License-Identifier: Apache-2.0
#

set -e

cleanup() {
    pids=$(jobs -p)
    echo Killing "$pids"
    [ -n "$pids" ] && kill $pids
}

trap "cleanup" INT QUIT TERM

if [ $# -lt 2 ]; then
    echo "${0} LEDGER_HOST LEDGER_PORT DAR_FILE"
    exit 1
fi

LEDGER_HOST="$1"
LEDGER_PORT="$2"
DAR_FILE="$3"

run_trigger() {
  local trigger_name="$1"
  local party="$2"
  daml trigger \
      --wall-clock-time \
      --dar "${DAR_FILE}" \
      --trigger-name "$trigger_name" \
      --ledger-host "${LEDGER_HOST}" \
      --ledger-port "${LEDGER_PORT}" \
      --ledger-party "$party"
}

scripts/waitForLedger.sh "$LEDGER_HOST" "$LEDGER_PORT"

run_trigger Triggers.AcceptClaimTrigger:acceptClaimTrigger InsuranceCompany &
run_trigger Triggers.EvaluateReferralTrigger:evaluateReferralTrigger Radiologist &
run_trigger Triggers.AcknowledgeAppointmentTrigger:acknowledgeAppointmentTrigger InsuranceCompany &
run_trigger Triggers.UpdateReferralDetailsTrigger:updateReferralDetailsTrigger Radiologist &

run_trigger Triggers.AcknowledgeAndDiscloseTrigger:acknowledgeAndDiscloseTrigger Patient1 &
run_trigger Triggers.AcceptPatientPaymentRequestTrigger:acceptPatientPaymentRequestTrigger Patient1 &

sleep 2
pids=$(jobs -p)
echo Waiting for $pids
wait $pids
