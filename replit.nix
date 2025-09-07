{ pkgs }: {
  deps = [
    pkgs.nodejs-20_x
    pkgs.nodePackages.npm
    pkgs.python3
    pkgs.pkg-config
    # （必要最低限。あとで増やせます）
  ];
}

