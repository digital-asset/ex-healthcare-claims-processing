MODELS_DAR=target/healthcare-claims-processing.dar
TRIGGERS_DAR=target/healthcare-claims-processing-triggers.dar

.PHONY: build
build: build-dars

.PHONY: clean
clean:
	rm -rf .daml triggers/.daml
	rm -rf target

### DARS ###

.PHONY: build-dars
build-dars: $(MODELS_DAR) $(TRIGGERS_DAR)

DAML_SRC=$(shell find src/ -name '*.daml')

$(MODELS_DAR): $(DAML_SRC) daml.yaml
	daml build --output $@

TRIGGERS_DAML_SRC=$(shell find triggers/daml/ -name '*.daml')

$(TRIGGERS_DAR): $(TRIGGERS_DAML_SRC) triggers/daml.yaml $(MODELS_DAR)
	cd triggers && daml build --output ../$@


.PHONY: test-dars
test-dars: build-dars
	daml test
	cd triggers && daml test

