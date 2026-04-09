{
  description = "discord-bots - Node.js bots";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = [
            # Node.js (bots/) - npmはNode.jsに同梱
            pkgs.nodejs_24
          ];

          shellHook = ''
            echo "discord-bots dev environment"
            echo "Node: $(node --version)"
            echo "npm:  $(npm --version)"
          '';
        };
      });
}
