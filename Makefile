MODELS_DAR=target/healthcare-claims-processing.dar
TRIGGERS_DAR=target/healthcare-claims-processing-triggers.dar

.PHONY: build
build: build-dars build-ui install-python-dependencies

test: test-dars test-ui

.PHONY: clean
clean:
	rm -rf model/.daml triggers/.daml
	rm -rf target
	rm -rf ui/daml.js
	$(MAKE) clean -C ui

.PHONY: install-python-dependencies
install-python-dependencies:
	cd scripts && pipenv sync

### DARS ###

.PHONY: build-dars
build-dars: $(MODELS_DAR) $(TRIGGERS_DAR)

DAML_SRC=$(shell find model/daml/ -name '*.daml')

$(MODELS_DAR): $(DAML_SRC) model/daml.yaml
	cd model && daml build --output ../$@

TRIGGERS_DAML_SRC=$(shell find triggers/daml/ -name '*.daml')

$(TRIGGERS_DAR): $(TRIGGERS_DAML_SRC) triggers/daml.yaml $(MODELS_DAR)
	cd triggers && daml build --output ../$@

.PHONY: test-dars
test-dars: build-dars
	cd model && daml test --junit ../target/daml-test-reports/model.xml
	cd triggers && daml test --junit ../target/daml-test-reports/triggers.xml


### JS Codegen ###

ui/daml.js: $(MODELS_DAR)
	daml codegen js $^ -o $@
	@touch $@


### UI ###

build-ui: ui/daml.js
	$(MAKE) -C ui

test-ui: build-ui
	$(MAKE) -C ui test

daml-hub-package: build
	$(MAKE) -C ui daml-hub-package LEDGER_ID=$(LEDGER_ID)
