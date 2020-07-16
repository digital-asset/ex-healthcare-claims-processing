#
# Copyright (c) 2019, Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
# SPDX-License-Identifier: Apache-2.0
#

ARG sdk_vsn=1.3.0

FROM digitalasset/daml-sdk:${sdk_vsn} AS source

USER root

# TODO: Remove this when upgrading to SDK 1.2
# That version will have a fix for this problem.
# See https://github.com/digital-asset/daml/pull/5882
RUN echo 'hosts: files dns' > /etc/nsswitch.conf

WORKDIR /home/daml/

USER daml
COPY --chown=daml daml.yaml ./
COPY --chown=daml daml daml
COPY --chown=daml ui-backend.conf frontend-config.js /home/daml/

EXPOSE 6865
EXPOSE 7500

ENTRYPOINT daml start \
  --sandbox-option="--address=0.0.0.0" \
  --sandbox-option="--static-time" \
  --sandbox-port=6865 \
# Cannot explicitly specify, because of: https://github.com/digital-asset/daml/issues/5777
# Relying on default port behaviour as of now.
#  --navigator-option="--port=7500" \
  --open-browser=no \
  --json-api-port=none
