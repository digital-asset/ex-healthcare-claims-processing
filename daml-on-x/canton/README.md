Prerequisites
-------------
 - The following utility programs need to be installed:
    - wget
    - tar
 - Working directory needs to be the root of ex-healthcare-claims-processing application repository.
 - The application needs to be built (see the README).
  - Three terminal windows need to be opened.

Installation & startup
----------------------

1) [Terminal 1] Get Canton:
`wget https://github.com/digital-asset/canton/releases/download/v0.0.27/canton-0.0.27.tar.gz`

2) Unpack:
`tar xvf canton-0.0.27.tar.gz canton-0.0.27/`

3) Start and [bootstrap](daml-on-x/canton/bootstrap.canton) Canton:
`./canton-0.0.27/bin/canton -c daml-on-x/canton/topology.conf --bootstrap-script daml-on-x/canton/bootstrap.canton`

4) [Terminal 2] Start the bots:
`java -jar target/healthcare-claims-processing-0.0.1-SNAPSHOT.jar`

5) [Terminal 3] Start Navigator:
The DAML assistant automatically supplies the `daml.yaml` parties that won't work for Canton as their party ids are designed to be unique.
So instead ensure the sdk tooling is installed and launch Navigator directly.

`daml install project && java -jar ~/.daml/sdk/$(grep sdk-version daml.yaml | cut -d' ' -f2)/navigator/navigator.jar server localhost 7600 --config-file daml-on-x/canton/ui-backend.conf`
