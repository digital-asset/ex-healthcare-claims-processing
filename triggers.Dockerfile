#
# Copyright (c) 2019, Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
# SPDX-License-Identifier: Apache-2.0
#

ARG sdk_vsn=1.6.1

FROM digitalasset/daml-sdk:${sdk_vsn}

USER root
RUN apt-get update || apt-get update
RUN apt-get -y install netcat-openbsd
USER daml

WORKDIR /home/daml

COPY --chown=daml daml.yaml ./
COPY --chown=daml daml daml
COPY --chown=daml scripts scripts
COPY --chown=daml ui-backend.conf frontend-config.js ./

RUN daml build -o app.dar

ENV JAVA_TOOL_OPTIONS -Xmx128m

ENTRYPOINT ~/scripts/waitForLedger.sh ${LEDGER_HOST} ${LEDGER_PORT} && \
           ~/scripts/startTriggers.sh "${LEDGER_HOST}" "${LEDGER_PORT}" app.dar
