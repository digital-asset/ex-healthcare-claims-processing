#!/usr/bin/env bash
#
# Copyright (c) 2019, Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
# SPDX-License-Identifier: Apache-2.0
#


PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." >/dev/null 2>&1 && pwd )"

if [ $# -eq 0 ]
then
    echo "Fetching latest SDK version"
    SDK_VERSION="$(curl -s -L -H "Accept: application/json"  https://github.com/digital-asset/daml/releases/latest | jq -r '.tag_name' | tr -d v)"
elif [ $# -eq 1 ]
then
    SDK_VERSION=$1
else
    echo "Usage: ${BASH_SOURCE[0]} [SDK_VERSION]"
    exit 1
fi

echo "SDK version is $SDK_VERSION"
echo "modifying ${PROJECT_DIR}/da.yaml"
sed -e "s/sdk-version: .*$/sdk-version: $SDK_VERSION/" -i "${PROJECT_DIR}/da.yaml"

echo "SDK version is $SDK_VERSION"
echo "modifying ${PROJECT_DIR}/daml.yaml"
sed -e "s/sdk-version: .*$/sdk-version: $SDK_VERSION/" -i "${PROJECT_DIR}/daml.yaml"

echo "modifying ${PROJECT_DIR}/pom.xml"
sed -e "s/<daml-sdk.version>.*<\/daml-sdk.version>$/<daml-sdk.version>10$SDK_VERSION<\/daml-sdk.version>/" -i "${PROJECT_DIR}/pom.xml"

echo "modifying ${PROJECT_DIR}/Dockerfile-navigator"
sed -e "s/ARG sdk_version=.*/ARG sdk_version=$SDK_VERSION/" -i "${PROJECT_DIR}/Dockerfile-navigator"

echo "modifying ${PROJECT_DIR}/Dockerfile-sandbox"
sed -e "s/ARG sdk_version=.*/ARG sdk_version=$SDK_VERSION/" -i "${PROJECT_DIR}/Dockerfile-sandbox"

echo "modifying ${PROJECT_DIR}/.circleci/config.yml"
sed -e "s/_version: \".*\"$/_version: \"$SDK_VERSION\"/" -i "${PROJECT_DIR}/.circleci/config.yml"
