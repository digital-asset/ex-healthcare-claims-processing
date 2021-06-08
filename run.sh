#! /usr/bin/env nix-shell
#! nix-shell -i bash
#
# Copyright (c) 2019, Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
# SPDX-License-Identifier: Apache-2.0
#

make build
cd ui && npm install && npm start
