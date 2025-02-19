{
  description = "A flake for a Node.js project using npm";

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
            pkgs.nodejs
            pkgs.pnpm
          ];

          shellHook = ''
            # Instalar NestJS localmente si no está instalado
            if ! [ -d "node_modules/.bin/nest" ]; then
              echo "Instalando NestJS CLI localmente..."
              npm add -D @nestjs/cli
            fi
          '';
        };
      });
}
