{ pkgs ? import <nixpkgs> {} }:
pkgs.stdenv.mkDerivation rec {  
  name = "daml-sdk";
  version = "1.13.1";
  src = pkgs.fetchurl {
    url = "https://github.com/digital-asset/daml/releases/download/v${version}/daml-sdk-${version}-linux.tar.gz";
    sha256 = "0frmh47rarkp61cwl76jm36hqsxzbakb16dfv4qszf0kdzss5npb";
  };
  buildPhase = ''
    mkdir $out
    sed -i 's|/usr/bin/env sh|/bin/sh|' ./daml/daml
    HOME=$out/
    ./daml/daml install .
    mv $out/.daml/* $out/
  '';
}
