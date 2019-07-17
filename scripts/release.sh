#!/usr/bin/env bash
#
# Copyright (c) 2019, Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
# SPDX-License-Identifier: Apache-2.0
#

set -e

appName="$1"
if [ "$appName" == "" ]
then
    echo "No appname defined"
    exit 1
fi

# download hub
pushd ${HOME}
    wget https://github.com/github/hub/releases/download/v2.12.1/hub-linux-amd64-2.12.1.tgz
    tar xvzf hub-linux-amd64-2.12.1.tgz
    export PATH="${HOME}/hub-linux-amd64-2.12.1/bin/:${PATH}"
popd

export GITHUB_TOKEN="${GITHUB_REFAPP_MACHINE_TOKEN}"
version=$(git describe --abbrev=0 --tags)
number=$(echo $version | cut -c 2-)

echo "testing if tag is on master"
if git merge-base --is-ancestor $(git rev-parse $version) $(git rev-parse master)
then
    echo "collecting package"
    fullname="$appName-$number"
    mkdir -p "/tmp/workspacetarget/$fullname/bin"
    cp -r * "/tmp/workspacetarget/$fullname/"
    pushd "/tmp/workspace"
    cp -r * "/tmp/workspacetarget/$fullname/bin/"
    popd
    echo "archiving"
    pushd "/tmp/workspacetarget"
    tar -czf "$fullname.tar.gz" "$fullname"
    popd

    echo "releasing $version"
    hub release create \
        --attach "/tmp/workspacetarget/$fullname.tar.gz" \
        --message "Release $version" \
        "$version"
fi
