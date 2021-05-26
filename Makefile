MODELS_DAR=target/healthcare-claims-processing.dar
TRIGGERS_DAR=target/healthcare-claims-processing-triggers.dar

.PHONY: build
build: build-dars install-python-dependencies

.PHONY: clean
clean:
	rm -rf .daml triggers/.daml
	rm -rf target

.PHONY: install-python-dependencies
install-python-dependencies:
	cd scripts && pipenv sync

### DARS ###

.PHONY: build-dars
build-dars: $(MODELS_DAR) $(TRIGGERS_DAR)

DAML_SRC=$(shell find daml/ -name '*.daml')

$(MODELS_DAR): $(DAML_SRC) daml.yaml
	daml build --output $@

TRIGGERS_DAML_SRC=$(shell find triggers/daml/ -name '*.daml')

$(TRIGGERS_DAR): $(TRIGGERS_DAML_SRC) triggers/daml.yaml $(MODELS_DAR)
	cd triggers && daml build --output ../$@


.PHONY: test-dars
test-dars: build-dars
	daml test --junit target/daml-test-reports/model.xml
	cd triggers && daml test --junit ../target/daml-test-reports/triggers.xml

