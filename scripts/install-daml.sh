
#!/usr/bin/env bash
#
# Copyright (c) 2019, Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
# SPDX-License-Identifier: Apache-2.0
#

if [ $# -eq 0 ]
then
    echo "ERROR: No parameters given! Usage: ${0} SDK_VERSION"
    exit 1
fi

SDK_VERSION="${1}"

if [ -f "${HOME}/.daml/bin/daml" ]
then
    echo "Skipping DAML SDK installation as it is already installed..."
else
    cd ${HOME}
    wget https://github.com/digital-asset/daml/releases/download/v${SDK_VERSION}/daml-sdk-${SDK_VERSION}-linux.tar.gz
    tar -zxvf daml-sdk-${SDK_VERSION}-linux.tar.gz
    cd sdk-${SDK_VERSION}
    ./install.sh
    cd ${HOME}
    rm -rf sdk-${SDK_VERSION}
fi
