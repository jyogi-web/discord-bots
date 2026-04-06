{
  description = "discord-bots - Node.js bots + Haskell services";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        haskellPkgs = pkgs.haskell.packages.ghc984;
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = [
            # Node.js (bots/) - npmはNode.jsに同梱
            pkgs.nodejs_24

            # GHC & build tools (services/text-gacha/)
            haskellPkgs.ghc
            haskellPkgs.cabal-install
            haskellPkgs.haskell-language-server
            haskellPkgs.hlint
            haskellPkgs.ormolu

            # System libraries
            pkgs.zlib
            pkgs.pkg-config
          ];

          shellHook = ''
            echo "discord-bots dev environment"
            echo "Node: $(node --version)"
            echo "npm:  $(npm --version)"
            echo "GHC:  $(ghc --version)"
            echo "Cabal: $(cabal --version | head -1)"
          '';
        };
      });
}
