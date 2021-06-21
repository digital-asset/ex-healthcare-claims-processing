#
# Copyright (c) 2021, Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
# SPDX-License-Identifier: Apache-2.0
#

build: npminstall

test: build
	npx prettier --check .
	npm run-script lint -- --max-warnings 0
	npm test -- --watchAll=false

clean:
	rm -rf node_modules
	rm -f healthcare-claims-processing-ui.zip
	rm -rf build

JS_CODEGEN_ARTIFACT=daml.js

UI_INSTALL_ARTIFACT=node_modules

npminstall: $(UI_INSTALL_ARTIFACT)

package-lock.json: package.json
	npm install

$(UI_INSTALL_ARTIFACT): package.json package-lock.json $(JS_CODEGEN_ARTIFACT)
	npm install
	touch $(UI_INSTALL_ARTIFACT)

daml-hub-package: healthcare-claims-processing-ui.zip

UI_SRC=$(shell find src/ -type f)

healthcare-claims-processing-ui.zip: $(UI_INSTALL_ARTIFACT) $(UI_SRC)
	REACT_APP_LEDGER_ID=$(LEDGER_ID) \
	REACT_APP_HTTP_BASE_URL="https://api.projectdabl.com/data/$(LEDGER_ID)/" \
	REACT_APP_IS_LOCAL=false \
	npm --trace-warnings run build
	rm -f healthcare-claims-processing-ui.zip
	zip --quiet -r healthcare-claims-processing-ui.zip build
