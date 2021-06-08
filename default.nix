{ pkgs ? import ./nix/deps/nixpkgs {}
, daml ? import ./nix/deps/daml.nix { inherit pkgs; }
}:

rec {
  inherit pkgs daml;

  model = pkgs.stdenv.mkDerivation {
    name = "model";

    nativeBuildInputs = [ daml ];

    src = ./model;

    buildPhase = ''
      mkdir $out
      daml build --output $out/healthcare-claims-processing.dar
    '';
    installPhase = "true";
  };

  triggers = pkgs.stdenv.mkDerivation {
    name = "triggers";

    nativeBuildInputs = [ daml ];

    src = ./triggers;

    patches = [
      (pkgs.writeText "fix-dep.patch" ''
        --- a/daml.yaml
        +++ b/daml.yaml
        @@ -12,4 +12,4 @@ dependencies:
           - daml-stdlib
           - daml-trigger
           - daml-script
        -  - ../target/healthcare-claims-processing.dar
        +  - ${model}/healthcare-claims-processing.dar
      '')
    ];

    buildPhase = ''
      daml build --output $out/healthcare-claims-processing-triggers.dar
    '';
    installPhase = "true";
  };

  daml-js = pkgs.runCommand "daml-js" {
    nativeBuildInputs = [ daml ];
  } ''
    daml codegen js ${model}/*.dar -o $out
  '';

  nodejs = pkgs.nodejs-15_x;

  ui = import ./nix/ui {
    inherit pkgs nodejs daml-js;
  };

  pyEnv = pkgs.python3.withPackages (p: with p; [
    requests
  ]);

  shell = pkgs.mkShell {
    name = "daml-shell";
    nativeBuildInputs = [ daml pkgs.openjdk pyEnv nodejs ];
  };
}
