{
  description = "A flake for a  project using bun";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShell = pkgs.mkShell {
          buildInputs = [
            pkgs.bun
          ];

          shellHook = ''
            # Instalar bun localmente si no está instalado
            if ! [ -d "node_modules/.bin/nest" ]; then
              echo "Instalando NestJS CLI localmente..."
              bun add -D @nestjs/cli
            fi
          '';
        };
      });
}
